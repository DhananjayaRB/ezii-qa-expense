import express from 'express';
import multer from 'multer';
import { azureBlobService } from '../azureBlobService.js';
import { z } from 'zod';

const router = express.Router();

// Configure multer for memory storage (Azure Blob doesn't need disk storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  }
});

// Validation schema for file upload metadata
const FileUploadSchema = z.object({
  module: z.enum(['expense_claims', 'expense_requests', 'direct_expenses', 'vendor_onboarding', 'vendor_claims', 'payments']),
  formId: z.string().optional(), // Optional - for associating with specific form records
  description: z.string().optional(),
});

/**
 * Upload single file to Azure Blob Storage
 * POST /api/files/upload
 */
router.post('/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    // Validate JWT authentication
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Validate file exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Validate request body
    const parseResult = FileUploadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid upload metadata', 
        details: parseResult.error.errors 
      });
    }

    const { module, formId, description } = parseResult.data;

    // Get user information for file naming
    const userInfo = {
      employeeNumber: req.user.employeeNumber || 'UNKNOWN',
      employeeName: req.user.employerName || 'UNKNOWN',
      userId: req.user.userId
    };

    // Upload file to Azure Blob Storage
    const fileUrl = await azureBlobService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      module,
      userInfo
    );

    // Log successful upload
    console.log(`✅ File uploaded successfully to Azure Blob:`, {
      fileUrl,
      originalName: req.file.originalname,
      module,
      userId: req.user.userId,
      fileSize: req.file.size
    });

    // Return successful response
    res.json({
      success: true,
      data: {
        fileUrl,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        module,
        formId,
        description,
        uploadedBy: req.user.userId,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ File upload failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'File upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload multiple files to Azure Blob Storage
 * POST /api/files/upload-multiple
 */
router.post('/upload-multiple', upload.array('files', 10), async (req: any, res: any) => {
  try {
    // Validate JWT authentication
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Validate files exist
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded' 
      });
    }

    // Validate request body
    const parseResult = FileUploadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid upload metadata', 
        details: parseResult.error.errors 
      });
    }

    const { module, formId, description } = parseResult.data;

    // Get user information for file naming
    const userInfo = {
      employeeNumber: req.user.employeeNumber || 'UNKNOWN',
      employeeName: req.user.employerName || 'UNKNOWN',
      userId: req.user.userId
    };

    // Upload all files to Azure Blob Storage
    const uploadPromises = req.files.map(async (file: any) => {
      try {
        const fileUrl = await azureBlobService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          module,
          userInfo
        );

        return {
          success: true,
          fileUrl,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype
        };
      } catch (error) {
        console.error(`❌ Failed to upload file ${file.originalname}:`, error);
        return {
          success: false,
          originalName: file.originalname,
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    
    // Separate successful and failed uploads
    const successful = uploadResults.filter(result => result.success);
    const failed = uploadResults.filter(result => !result.success);

    console.log(`✅ Multiple file upload completed:`, {
      successful: successful.length,
      failed: failed.length,
      module,
      userId: req.user.userId
    });

    // Return response with both successful and failed uploads
    res.json({
      success: true,
      data: {
        successful,
        failed,
        totalFiles: req.files.length,
        successCount: successful.length,
        failedCount: failed.length,
        module,
        formId,
        description,
        uploadedBy: req.user.userId,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Multiple file upload failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Multiple file upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete file from Azure Blob Storage
 * DELETE /api/files/delete
 */
router.delete('/delete', async (req: any, res: any) => {
  try {
    // Validate JWT authentication
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'File URL is required' 
      });
    }

    // Delete file from Azure Blob Storage
    const deleted = await azureBlobService.deleteFile(fileUrl);
    
    if (deleted) {
      console.log(`✅ File deleted successfully from Azure Blob:`, { fileUrl, userId: req.user.userId });
      
      res.json({
        success: true,
        message: 'File deleted successfully',
        fileUrl
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found or could not be deleted',
        fileUrl
      });
    }

  } catch (error) {
    console.error('❌ File deletion failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'File deletion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get file metadata from Azure Blob Storage
 * GET /api/files/metadata/:encodedUrl
 */
router.get('/metadata/:encodedUrl', async (req: any, res: any) => {
  try {
    // Validate JWT authentication
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const fileUrl = decodeURIComponent(req.params.encodedUrl);
    
    if (!fileUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'File URL is required' 
      });
    }

    // Get file metadata from Azure Blob Storage
    const metadata = await azureBlobService.getFileMetadata(fileUrl);
    
    console.log(`✅ File metadata retrieved:`, { fileUrl, userId: req.user.userId });
    
    res.json({
      success: true,
      data: {
        fileUrl,
        ...metadata,
        retrievedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ File metadata retrieval failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'File metadata retrieval failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Download file from Azure Blob Storage
 * GET /api/files/download/:encodedUrl
 */
router.get('/download/:encodedUrl', async (req: any, res: any) => {
  try {
    // Validate JWT authentication
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const fileUrl = decodeURIComponent(req.params.encodedUrl);
    
    if (!fileUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'File URL is required' 
      });
    }

    // Get file stream from Azure Blob Storage
    const fileStream = await azureBlobService.getFileStream(fileUrl);
    const metadata = await azureBlobService.getFileMetadata(fileUrl);
    
    // Set appropriate headers for file download
    res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', metadata.contentLength || 0);
    res.setHeader('Content-Disposition', 'attachment');
    
    // Pipe the file stream to response
    fileStream.pipe(res);
    
    console.log(`✅ File download initiated:`, { fileUrl, userId: req.user.userId });

  } catch (error) {
    console.error('❌ File download failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'File download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Check if file exists in Azure Blob Storage
 * POST /api/files/check-exists
 */
router.post('/check-exists', async (req: any, res: any) => {
  try {
    // Validate JWT authentication
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'File URL is required' 
      });
    }

    // Check if file exists in Azure Blob Storage
    const exists = await azureBlobService.fileExists(fileUrl);
    
    res.json({
      success: true,
      data: {
        fileUrl,
        exists,
        checkedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ File existence check failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'File existence check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;