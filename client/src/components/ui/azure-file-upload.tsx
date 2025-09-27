import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, File, Download, Eye, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for Azure Blob file upload
export interface AzureFileUpload {
  fileUrl: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  module: string;
  formId?: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface AzureFileUploadProps {
  module: 'expense_claims' | 'expense_requests' | 'direct_expenses' | 'vendor_onboarding' | 'vendor_claims' | 'payments';
  formId?: string;
  maxFiles?: number;
  multiple?: boolean;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  existingFiles?: AzureFileUpload[];
  onFilesChange?: (files: AzureFileUpload[]) => void;
  onUploadComplete?: (uploadedFiles: AzureFileUpload[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

export function AzureFileUpload({
  module,
  formId,
  maxFiles = 10,
  multiple = true,
  acceptedFileTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
  maxFileSize = 5,
  existingFiles = [],
  onFilesChange,
  onUploadComplete,
  onUploadError,
  className,
  disabled = false
}: AzureFileUploadProps) {
  const [files, setFiles] = useState<AzureFileUpload[]>(existingFiles);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    const fileArray = Array.from(selectedFiles);

    // Validate file count
    if (files.length + fileArray.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed. Currently have ${files.length} files.`,
        variant: 'destructive',
      });
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    fileArray.forEach((file) => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        invalidFiles.push(`${file.name} (exceeds ${maxFileSize}MB limit)`);
        return;
      }

      // Check file type
      const isValidType = acceptedFileTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });

      if (!isValidType) {
        invalidFiles.push(`${file.name} (unsupported file type)`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      toast({
        title: 'Some files were rejected',
        description: invalidFiles.join(', '),
        variant: 'destructive',
      });
    }

    // Upload valid files
    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  }, [files, maxFiles, maxFileSize, acceptedFileTypes, disabled, toast]);

  // Upload files to Azure Blob Storage
  const uploadFiles = async (filesToUpload: File[]) => {
    if (disabled) return;

    // Initialize upload progress
    const initialProgress: UploadProgress[] = filesToUpload.map((file) => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setUploadProgress(initialProgress);

    try {
      const uploadPromises = filesToUpload.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', module);
        if (formId) formData.append('formId', formId);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          },
          body: formData,
        });

        const result = await response.json();

        // Update progress
        setUploadProgress((prev) =>
          prev.map((progress, idx) =>
            idx === index
              ? {
                  ...progress,
                  progress: 100,
                  status: response.ok ? 'completed' : 'failed',
                  error: response.ok ? undefined : result.error || 'Upload failed'
                }
              : progress
          )
        );

        if (!response.ok) {
          throw new Error(result.error || `Failed to upload ${file.name}`);
        }

        return result.data as AzureFileUpload;
      });

      // Wait for all uploads to complete
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Update files state
      const newFiles = [...files, ...uploadedFiles];
      setFiles(newFiles);
      
      // Clear upload progress after delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 2000);

      // Call callbacks
      onFilesChange?.(newFiles);
      onUploadComplete?.(uploadedFiles);

      toast({
        title: 'Files uploaded successfully',
        description: `${uploadedFiles.length} file(s) uploaded to Azure Blob Storage.`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Update failed upload progress
      setUploadProgress((prev) =>
        prev.map((progress) => ({
          ...progress,
          status: 'failed',
          error: errorMessage
        }))
      );

      onUploadError?.(errorMessage);

      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Remove file
  const removeFile = async (fileToRemove: AzureFileUpload) => {
    if (disabled) return;

    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: fileToRemove.fileUrl }),
      });

      if (response.ok) {
        const updatedFiles = files.filter((file) => file.fileUrl !== fileToRemove.fileUrl);
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles);

        toast({
          title: 'File deleted',
          description: `${fileToRemove.originalName} has been deleted.`,
        });
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  // Download file
  const downloadFile = (file: AzureFileUpload) => {
    const encodedUrl = encodeURIComponent(file.fileUrl);
    window.open(`/api/files/download/${encodedUrl}`, '_blank');
  };

  // Preview file
  const previewFile = (file: AzureFileUpload) => {
    window.open(file.fileUrl, '_blank');
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          File Attachments
          {files.length > 0 && (
            <Badge variant="secondary">{files.length} file{files.length !== 1 ? 's' : ''}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            isDragOver && !disabled ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            {disabled 
              ? 'File upload disabled'
              : isDragOver 
              ? 'Drop files here...' 
              : 'Click to upload or drag and drop files here'
            }
          </p>
          <p className="text-xs text-gray-500">
            Max {maxFiles} files, up to {maxFileSize}MB each
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports: {acceptedFileTypes.join(', ')}
          </p>
          
          <Input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedFileTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
            data-testid="file-upload-input"
          />
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <h4 className="text-sm font-medium">Uploading...</h4>
            {uploadProgress.map((progress, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm truncate">{progress.fileName}</span>
                    {progress.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                    {progress.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {progress.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  {progress.status === 'failed' && progress.error && (
                    <p className="text-xs text-red-600">{progress.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto" data-testid="uploaded-files-list">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  data-testid={`uploaded-file-${index}`}
                >
                  <File className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {file.mimeType.startsWith('image/') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewFile(file)}
                        disabled={disabled}
                        data-testid={`button-preview-${index}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      disabled={disabled}
                      data-testid={`button-download-${index}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      disabled={disabled}
                      data-testid={`button-remove-${index}`}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && uploadProgress.length === 0 && (
          <div className="text-center py-4">
            <File className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No files uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}