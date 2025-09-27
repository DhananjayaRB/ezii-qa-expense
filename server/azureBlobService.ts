import { BlobServiceClient, ContainerClient, BlockBlobClient, BlobHTTPHeaders, StorageSharedKeyCredential } from '@azure/storage-blob';
import { Readable } from 'stream';

// Azure Blob Storage Configuration - Add your Azure credentials here
export interface AzureBlobConfig {
  accountName: string;
  accountKey: string;
  containerName: string;
}

// Azure Blob Storage Service class - mirrors the C# pattern provided
export class AzureBlobService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  
  constructor(private config: AzureBlobConfig) {
    // Create shared key credential for Azure authentication
    const sharedKeyCredential = new StorageSharedKeyCredential(
      config.accountName,
      config.accountKey
    );
    
    // Initialize Azure Blob Service Client with shared key credential
    this.blobServiceClient = new BlobServiceClient(
      `https://${config.accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
    
    // Get container client - equivalent to _blobserviceclient.GetBlobContainerClient() in C#
    this.containerClient = this.blobServiceClient.getContainerClient(config.containerName);
  }

  /**
   * Upload file to Azure Blob Storage following the C# pattern provided
   * @param fileBuffer - File buffer data
   * @param fileName - Original file name  
   * @param fileType - MIME content type
   * @param module - Module/form type (expense_claims, requests, etc.)
   * @param userInfo - User information for file naming
   * @returns Promise<string> - Returns the blob URL
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    module: string,
    userInfo: {
      employeeNumber: string;
      employeeName: string;
      userId: string;
    }
  ): Promise<string> {
    try {
      // Generate file name following the C# pattern:
      // "{user.employee_number}_{user.employee_name}_payslip_{pay_period}_Expense_{DateTime.Now:yyyyMMddHHmmss}.pdf"
      const fileExtension = this.getFileExtension(fileName, fileType);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // yyyyMMddTHHmmss
      const sanitizedName = userInfo.employeeName.replace(/[^a-zA-Z0-9]/g, '_');
      
      const generatedFileName = `${userInfo.employeeNumber}_${sanitizedName}_${module}_${timestamp}${fileExtension}`;

      // Get blob client for the specific file - equivalent to blobContainerClient.GetBlobClient() in C#
      const blobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(generatedFileName);

      // Create blob HTTP headers - equivalent to BlobHttpHeaders in C#
      const blobHTTPHeaders: BlobHTTPHeaders = {
        blobContentType: fileType,
        blobContentDisposition: `inline; filename="${generatedFileName}"`
      };

      // Convert buffer to stream (equivalent to MemoryStream in C#)
      const stream = Readable.from(fileBuffer);

      // Upload to Azure Blob - equivalent to blobClient.UploadAsync() in C#
      const uploadResponse = await blobClient.uploadStream(
        stream, 
        fileBuffer.length,
        undefined, // Default parallelism
        {
          blobHTTPHeaders,
          metadata: {
            module,
            originalFileName: fileName,
            uploadedBy: userInfo.userId,
            uploadedAt: new Date().toISOString()
          }
        }
      );

      // Return blob URL - equivalent to blobClient.Uri.ToString() in C#
      const blobUrl = blobClient.url;
      
      console.log(`File uploaded successfully to Azure Blob: ${blobUrl}`);
      console.log(`Upload response etag: ${uploadResponse.etag}`);
      
      return blobUrl;
      
    } catch (error) {
      console.error('Azure Blob upload failed:', error);
      throw new Error(`Failed to upload file to Azure Blob Storage: ${error}`);
    }
  }

  /**
   * Delete file from Azure Blob Storage
   * @param blobUrl - Full blob URL to delete
   * @returns Promise<boolean> - Returns true if deleted successfully
   */
  async deleteFile(blobUrl: string): Promise<boolean> {
    try {
      const blobName = this.extractBlobNameFromUrl(blobUrl);
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      
      const deleteResponse = await blobClient.delete();
      console.log(`File deleted successfully from Azure Blob: ${blobUrl}`);
      
      return true;
    } catch (error) {
      console.error('Azure Blob delete failed:', error);
      return false;
    }
  }

  /**
   * Check if file exists in Azure Blob Storage
   * @param blobUrl - Full blob URL to check
   * @returns Promise<boolean> - Returns true if file exists
   */
  async fileExists(blobUrl: string): Promise<boolean> {
    try {
      const blobName = this.extractBlobNameFromUrl(blobUrl);
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      
      return await blobClient.exists();
    } catch (error) {
      console.error('Azure Blob existence check failed:', error);
      return false;
    }
  }

  /**
   * Get file stream from Azure Blob Storage for downloading
   * @param blobUrl - Full blob URL to download
   * @returns Promise<NodeJS.ReadableStream> - Returns file stream
   */
  async getFileStream(blobUrl: string): Promise<NodeJS.ReadableStream> {
    try {
      const blobName = this.extractBlobNameFromUrl(blobUrl);
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      
      const downloadResponse = await blobClient.download();
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error('Failed to get file stream');
      }
      
      return downloadResponse.readableStreamBody;
    } catch (error) {
      console.error('Azure Blob download failed:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from Azure Blob Storage
   * @param blobUrl - Full blob URL to get metadata for
   * @returns Promise<any> - Returns file metadata
   */
  async getFileMetadata(blobUrl: string): Promise<any> {
    try {
      const blobName = this.extractBlobNameFromUrl(blobUrl);
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      
      const properties = await blobClient.getProperties();
      
      return {
        contentType: properties.contentType,
        contentLength: properties.contentLength,
        lastModified: properties.lastModified,
        etag: properties.etag,
        metadata: properties.metadata
      };
    } catch (error) {
      console.error('Azure Blob metadata retrieval failed:', error);
      throw error;
    }
  }

  // Helper Methods

  /**
   * Extract blob name from full Azure Blob URL
   * @param blobUrl - Full blob URL
   * @returns string - Blob name/path
   */
  private extractBlobNameFromUrl(blobUrl: string): string {
    try {
      const url = new URL(blobUrl);
      // Remove the leading slash and container name from pathname
      const pathParts = url.pathname.split('/');
      // Skip first empty part and container name, join the rest
      return pathParts.slice(2).join('/');
    } catch (error) {
      throw new Error(`Invalid blob URL format: ${blobUrl}`);
    }
  }

  /**
   * Get appropriate file extension based on file name and MIME type
   * @param fileName - Original file name
   * @param mimeType - MIME content type
   * @returns string - File extension with dot
   */
  private getFileExtension(fileName: string, mimeType: string): string {
    // Try to get extension from filename first
    const fileExt = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
    
    if (fileExt) {
      return fileExt;
    }

    // Fallback to MIME type mapping
    const mimeTypeExtensions: { [key: string]: string } = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg', 
      'image/png': '.png',
      'image/gif': '.gif',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/plain': '.txt',
      'text/csv': '.csv'
    };

    return mimeTypeExtensions[mimeType] || '.bin';
  }
}

// Azure Blob Configuration with Placeholder Credentials
// TODO: Replace these placeholder values with your actual Azure Storage Account credentials
export const azureBlobConfig: AzureBlobConfig = {
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || 'YOUR_AZURE_STORAGE_ACCOUNT_NAME_PLACEHOLDER',
  accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || 'YOUR_AZURE_STORAGE_ACCOUNT_KEY_PLACEHOLDER', 
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'expense-management-files'
};

// Export singleton instance
export const azureBlobService = new AzureBlobService(azureBlobConfig);