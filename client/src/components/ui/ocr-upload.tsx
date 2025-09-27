import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CloudUpload, CheckCircle, Scan, FileText, X, Check } from "lucide-react";

interface OcrUploadProps {
  module: string; // 'employee_claims', 'vendor_claims', 'bills', 'direct_expenses'
  claimTitle: string | (() => string); // Claim title from parent form or function to get current value
  onDataExtracted?: (data: any) => void;
  onUploadComplete?: (file: any) => void;
  accept?: string;
  maxSize?: number;
  "data-testid"?: string;
}

interface OcrResult {
  id: string;
  module: string;
  originalFileName: string;
  extractedData: any;
  confidence: number;
  status: 'processing' | 'completed' | 'confirmed';
  isConfirmed: boolean;
  filePath: string;
  createdAt: string;
}

// State machine states
type OcrState = 'idle' | 'uploading' | 'preview' | 'confirming' | 'completed';

export default function OcrUpload({
  module,
  claimTitle,
  onDataExtracted,
  onUploadComplete,
  accept = ".jpg,.jpeg,.png,.pdf",
  maxSize = 5 * 1024 * 1024, // 5MB default
  "data-testid": testId,
}: OcrUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State machine
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentOcrResult, setCurrentOcrResult] = useState<OcrResult | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // OCR Processing Mutation
  const ocrProcessMutation = useMutation({
    mutationFn: async (file: File) => {
      setOcrState('uploading');
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("module", module);
      formData.append("description", `OCR processing for ${module}`);

      const jwt_token = localStorage.getItem('jwt_token');
      if (!jwt_token) {
        throw new Error('No authentication token found');
      }

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error("Invalid response format"));
            }
          } else {
            reject(new Error(`OCR processing failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("OCR processing failed"));
        });

        xhr.open("POST", "/api/ocr/process");
        xhr.setRequestHeader("Authorization", `Bearer ${jwt_token}`);
        xhr.send(formData);
      });
    },
    onSuccess: (data: any) => {
      setUploadProgress(0);
      const result = data?.result || data;
      setCurrentOcrResult(result);
      
      // Automatically transition to preview state
      if (result?.extractedData && Object.keys(result.extractedData).length > 0) {
        const mappedData = result.extractedData.extractedData || result.extractedData;
        
        const preview = {
          billNo: mappedData.billNo || mappedData.invoiceNumber,
          billAmount: mappedData.billAmount || mappedData.amount,
          billDate: mappedData.billDate || mappedData.date,
          vendorName: mappedData.vendorName || mappedData.vendor,
          spentDate: mappedData.spentDate || mappedData.date,
          // Enhanced OCR: Let individual field callbacks handle the data instead of dumping everything in description
          // description: mappedData.description
        };
        
        setPreviewData(preview);
        setOcrState('preview');
        
        toast({
          title: "🎉 OCR Processing Complete!",
          description: "Review the extracted data and click 'Approve & Apply' to continue",
        });
      }

      onUploadComplete?.(result);
    },
    onError: (error) => {
      setUploadProgress(0);
      setOcrState('idle');
      toast({
        title: "❌ OCR Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    },
  });

  // Save and Retrieve Mutation - Chains POST → GET
  const saveAndRetrieveMutation = useMutation({
    mutationFn: async ({ ocrId, claimTitle }: { ocrId: string; claimTitle: string }) => {
      setOcrState('confirming');
      
      // Step 1: Save with claim title (POST)
      await apiRequest(`/api/ocr/save-with-title/${ocrId}`, {
        method: 'POST',
        body: { claimTitle }
      });
      
      // Step 2: Immediately retrieve by claim title (GET)
      const response = await apiRequest(`/api/ocr/by-claim-title/${encodeURIComponent(claimTitle)}`);
      return response;
    },
    onSuccess: (data: any) => {
      setOcrState('completed');
      
      const { mappedData } = data;
      const finalData = {
        billNo: mappedData.billNo || mappedData.invoiceNumber,
        billAmount: mappedData.billAmount || mappedData.amount,
        billDate: mappedData.billDate || mappedData.date,
        vendorName: mappedData.vendorName || mappedData.vendor,
        spentDate: mappedData.spentDate || mappedData.date,
        // Enhanced OCR: Pass raw extracted data for individual field processing
        ...mappedData // Pass all extracted data for enhanced processing
      };
      
      // Apply to form automatically
      if (onDataExtracted) {
        onDataExtracted(finalData);
      }
      
      toast({
        title: "✅ Data Applied Successfully!",
        description: "OCR data has been saved and applied to your form",
      });
      
      // Reset after brief delay
      setTimeout(() => {
        setOcrState('idle');
        setCurrentOcrResult(null);
        setPreviewData(null);
      }, 2000);
    },
    onError: (error) => {
      setOcrState('preview'); // Go back to preview on error
      toast({
        title: "❌ Failed to Save Data",
        description: error instanceof Error ? error.message : "Failed to save OCR data",
        variant: "destructive",
      });
    },
  });

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }

    const allowedTypes = accept.split(",").map(type => type.trim());
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type not supported. Allowed types: ${accept}`;
    }

    return null;
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid file",
        description: error,
        variant: "destructive",
      });
      return;
    }

    ocrProcessMutation.mutate(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (fileInputRef.current && ocrState === 'idle') {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleApproveAndApply = () => {
    console.log('🔍 DEBUG: handleApproveAndApply called');
    
    if (!currentOcrResult) {
      console.log('❌ DEBUG: No OCR result available');
      toast({
        title: "Error",
        description: "No OCR data available to apply",
        variant: "destructive",
      });
      return;
    }

    // Apply OCR data directly to form without requiring claim title
    console.log('✅ DEBUG: Applying OCR data directly to form');
    
    // Prepare the OCR data in the expected format
    if (previewData && onDataExtracted) {
      onDataExtracted(previewData);
      
      setOcrState('completed');
      
      toast({
        title: "✅ Data Applied Successfully!",
        description: "OCR data has been applied to your form. Please review and complete the remaining fields.",
      });

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setOcrState('idle');
        setCurrentOcrResult(null);
        setPreviewData(null);
      }, 3000);
    }
  };

  const handleReject = () => {
    setOcrState('idle');
    setCurrentOcrResult(null);
    setPreviewData(null);
    
    toast({
      title: "OCR Data Rejected",
      description: "You can upload another receipt to try again",
    });
  };

  // Render based on state machine
  const renderContent = () => {
    switch (ocrState) {
      case 'idle':
        return (
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              dragActive 
                ? "border-blue-400 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={(e) => handleFileSelect(e)}
          >
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <CloudUpload className="h-8 w-8 text-gray-400" />
                  <Scan className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-700 mb-2 font-semibold text-lg">
                    📸 Upload Your Receipt
                  </p>
                  <p className="text-gray-600 mb-3">
                    Drop your receipt here and we'll automatically fill in all the details for you!
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    or{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-blue-600 hover:underline font-medium"
                      onClick={handleFileSelect}
                      data-testid="button-browse-files"
                    >
                      choose from your device
                    </Button>
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2 border border-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <span>✨ Instant • Accurate • Always Free</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Supported: {accept} (max {(maxSize / 1024 / 1024).toFixed(1)}MB)
              </p>
            </CardContent>
          </Card>
        );

      case 'uploading':
        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Scan className="h-6 w-6 text-blue-600 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium">✨ Reading your receipt...</p>
                  <Progress value={uploadProgress} className="mt-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    Finding amount, date, vendor name and other details
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'preview':
        return (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">📋 OCR Data Extracted</h3>
                  <Badge variant="secondary">Preview</Badge>
                </div>
                
                {previewData && (
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Bill No:</span>
                        <p className="text-gray-900 mt-1">{previewData.billNo || 'Not found'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Bill Date:</span>
                        <p className="text-gray-900 mt-1">{previewData.billDate || 'Not found'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Bill Amount:</span>
                        <p className="text-gray-900 mt-1 font-semibold">₹{previewData.billAmount || 'Not found'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Vendor:</span>
                        <p className="text-gray-900 mt-1">{previewData.vendorName || 'Not found'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button"
                    onClick={handleApproveAndApply}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="button-approve-apply"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    ✅ Approve & Apply
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleReject}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-reject"
                  >
                    <X className="h-4 w-4 mr-2" />
                    ❌ Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'confirming':
        return (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                <div>
                  <p className="font-medium">💾 Saving and applying data...</p>
                  <p className="text-sm text-gray-600">Please wait while we process your request</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'completed':
        return (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">✅ Data Applied Successfully!</p>
                  <p className="text-sm text-green-600">OCR data has been added to your form</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4" data-testid={testId}>
      {renderContent()}
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        data-testid="input-file-hidden"
      />
    </div>
  );
}