import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock, AlertCircle, Download } from "lucide-react";
import { format } from "date-fns";

export default function ReleaseBills() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch payment batches that can be released (processing status)
  const { data: batches = [], isLoading: loadingBatches } = useQuery({
    queryKey: ["/api/payment-batches"],
  });

  // Release bills mutation
  const releaseBillsMutation = useMutation({
    mutationFn: async (batchId: string) => {
      return await apiRequest(`/api/payment-batches/${batchId}/release`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-batches"] });
      toast({
        title: "Success",
        description: "Bills released successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReleaseBills = (batchId: string, batchTitle: string) => {
    if (confirm(`Are you sure you want to release bills for "${batchTitle}"?`)) {
      releaseBillsMutation.mutate(batchId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      processing: { color: "bg-blue-100 text-blue-800", icon: AlertCircle },
      released: { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Filter batches that are in processing status and can be released
  const batchesData = Array.isArray(batches) ? batches : [];
  const processingBatches = batchesData.filter((batch: any) => batch.status === "processing");
  const releasedBatches = batchesData.filter((batch: any) => batch.status === "released");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Release Bills</h1>
              <p className="text-gray-600">Review and release bills for payment processing</p>
            </div>

            {/* Ready for Release Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Ready for Release
                </CardTitle>
                <CardDescription>Payment batches ready to be released for processing</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBatches ? (
                  <div className="text-center py-4">Loading batches...</div>
                ) : processingBatches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No batches ready for release</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processingBatches.map((batch: any) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-mono text-sm" data-testid={`text-batch-number-${batch.id}`}>
                            {batch.batchNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium" data-testid={`text-batch-title-${batch.id}`}>{batch.title}</p>
                              {batch.description && (
                                <p className="text-sm text-gray-500">{batch.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-batch-amount-${batch.id}`}>
                            ₹{parseFloat(batch.totalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(batch.status)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {format(new Date(batch.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleReleaseBills(batch.id, batch.title)}
                              disabled={releaseBillsMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`button-release-${batch.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Release
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Released Bills Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Released Bills
                </CardTitle>
                <CardDescription>Previously released payment batches</CardDescription>
              </CardHeader>
              <CardContent>
                {releasedBatches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No released bills yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Released Date</TableHead>
                        <TableHead>Released By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {releasedBatches.map((batch: any) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-mono text-sm" data-testid={`text-released-batch-number-${batch.id}`}>
                            {batch.batchNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium" data-testid={`text-released-batch-title-${batch.id}`}>{batch.title}</p>
                              {batch.description && (
                                <p className="text-sm text-gray-500">{batch.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-released-batch-amount-${batch.id}`}>
                            ₹{parseFloat(batch.totalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(batch.status)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {batch.releasedAt ? format(new Date(batch.releasedAt), "MMM dd, yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {batch.releasedBy || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-view-details-${batch.id}`}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}