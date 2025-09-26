import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/ui/file-upload";

export default function Uploads() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ["/api/receipts"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-60">
        <Header />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
              Receipt Uploads
            </h1>
            <p className="text-gray-600" data-testid="text-page-description">
              Upload and manage your receipts and supporting documents
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  endpoint="/api/receipts/upload"
                  accept=".jpg,.jpeg,.png,.pdf"
                  maxSize={5 * 1024 * 1024} // 5MB
                  data-testid="file-upload-receipt"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                {receiptsLoading ? (
                  <div className="text-center py-8">Loading receipts...</div>
                ) : receipts && receipts.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {receipts.map((receipt: any) => (
                      <div
                        key={receipt.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        data-testid={`receipt-item-${receipt.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <i className="fas fa-file text-blue-600 text-sm"></i>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900" data-testid={`text-receipt-name-${receipt.id}`}>
                              {receipt.originalName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(receipt.createdAt).toLocaleDateString('en-GB')} • 
                              {(receipt.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {receipt.isAttached && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Attached
                            </span>
                          )}
                          <a
                            href={receipt.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            data-testid={`link-receipt-view-${receipt.id}`}
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500" data-testid="text-no-receipts">No receipts uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
