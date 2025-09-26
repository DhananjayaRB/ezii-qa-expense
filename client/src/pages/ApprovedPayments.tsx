import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, History, Eye, FileText, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PaymentBatch {
  id: string;
  batchNumber: string;
  title: string;
  description?: string;
  totalAmount: string;
  status: string;
  createdBy: string;
  approvedAt?: string;
  createdAt: string;
  paymentType: string;
  paymentDate?: string;
  currentApprovalLevel?: string;
  totalBills: number;
}

interface PaymentBatchItem {
  id: string;
  description: string;
  amount: string;
  payeeName: string;
  accountNumber?: string;
  routingNumber?: string;
  paymentReference?: string;
}

interface ApprovalHistoryItem {
  id: string;
  approverId: string;
  approverRole: string;
  approverName: string;
  action: string;
  remarks?: string;
  processedAt: string;
  previousStatus: string;
  newStatus: string;
}

export default function ApprovedPayments() {
  const [location, navigate] = useLocation();
  const [selectedBatch, setSelectedBatch] = useState<PaymentBatch | null>(null);
  const [viewingHistory, setViewingHistory] = useState(false);

  // Fetch approved payment batches
  const {
    data: approvedBatches = [],
    isLoading,
    refetch,
  } = useQuery<PaymentBatch[]>({
    queryKey: ["/api/payment-batches/approved"],
  });

  // Fetch batch items when a batch is selected
  const { data: batchItems = [] } = useQuery<PaymentBatchItem[]>({
    queryKey: ["/api/payment-batch-items", selectedBatch?.id],
    enabled: !!selectedBatch?.id,
  });

  // Fetch approval history when viewing history
  const { data: approvalHistory = [] } = useQuery<ApprovalHistoryItem[]>({
    queryKey: ["/api/payment-batches", selectedBatch?.id, "approval-history"],
    enabled: !!(selectedBatch?.id && viewingHistory),
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-medium">Loading approved payments...</div>
            <div className="text-sm text-muted-foreground mt-2">Please wait</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="title-approved-payments">Approved Payments</h1>
          <p className="text-muted-foreground" data-testid="description-approved-payments">
            View all fully approved and processed payment batches
          </p>
        </div>
        <Button
          onClick={() => navigate('/payments')}
          variant="outline"
          data-testid="button-back-payments"
        >
          <FileText className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
      </div>

      {approvedBatches.length === 0 ? (
        <Card data-testid="card-no-approved-payments">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              No Approved Payments
            </CardTitle>
            <CardDescription>
              There are currently no fully approved payment batches.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card data-testid="card-approved-payments-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Approved Payment Batches ({approvedBatches.length})
            </CardTitle>
            <CardDescription>
              All payment batches that have completed the approval workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Bills</TableHead>
                  <TableHead>Approved Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedBatches.map((batch) => (
                  <TableRow key={batch.id} data-testid={`row-batch-${batch.id}`}>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-batch-number-${batch.id}`}>
                        {batch.batchNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div data-testid={`text-batch-title-${batch.id}`}>
                        {batch.title}
                      </div>
                      {batch.description && (
                        <div className="text-sm text-muted-foreground" data-testid={`text-batch-description-${batch.id}`}>
                          {batch.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-payment-type-${batch.id}`}>
                        {batch.paymentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600" data-testid={`text-total-amount-${batch.id}`}>
                        {formatCurrency(batch.totalAmount)}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-total-bills-${batch.id}`}>
                      {batch.totalBills}
                    </TableCell>
                    <TableCell data-testid={`text-approved-date-${batch.id}`}>
                      {batch.approvedAt && formatDate(batch.approvedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBatch(batch);
                                setViewingHistory(false);
                              }}
                              data-testid={`button-view-details-${batch.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Payment Batch Details</DialogTitle>
                              <DialogDescription>
                                {selectedBatch?.batchNumber} - {selectedBatch?.title}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedBatch && (
                              <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="details">Payment Details</TabsTrigger>
                                  <TabsTrigger 
                                    value="history"
                                    onClick={() => setViewingHistory(true)}
                                  >
                                    Approval History
                                  </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="details" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground">Batch Information</h4>
                                      <div className="space-y-2 mt-2">
                                        <div>
                                          <span className="text-sm font-medium">Number:</span> {selectedBatch.batchNumber}
                                        </div>
                                        <div>
                                          <span className="text-sm font-medium">Type:</span> {selectedBatch.paymentType}
                                        </div>
                                        <div>
                                          <span className="text-sm font-medium">Total Amount:</span> 
                                          <span className="text-green-600 font-medium ml-1">
                                            {formatCurrency(selectedBatch.totalAmount)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm font-medium">Total Bills:</span> {selectedBatch.totalBills}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground">Dates</h4>
                                      <div className="space-y-2 mt-2">
                                        <div>
                                          <span className="text-sm font-medium">Created:</span> {formatDate(selectedBatch.createdAt)}
                                        </div>
                                        {selectedBatch.approvedAt && (
                                          <div>
                                            <span className="text-sm font-medium">Approved:</span> {formatDate(selectedBatch.approvedAt)}
                                          </div>
                                        )}
                                        {selectedBatch.paymentDate && (
                                          <div>
                                            <span className="text-sm font-medium">Payment Date:</span> {formatDate(selectedBatch.paymentDate)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Payment Items</h4>
                                    <div className="border rounded-lg">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Payee</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Account</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {batchItems.map((item) => (
                                            <TableRow key={item.id}>
                                              <TableCell>{item.description}</TableCell>
                                              <TableCell>{item.payeeName}</TableCell>
                                              <TableCell className="font-medium">
                                                {formatCurrency(item.amount)}
                                              </TableCell>
                                              <TableCell className="text-sm text-muted-foreground">
                                                {item.accountNumber ? `***${item.accountNumber.slice(-4)}` : 'N/A'}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="history" className="space-y-4">
                                  <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Approval Timeline</h4>
                                    <div className="space-y-4">
                                      {approvalHistory.map((entry) => (
                                        <div key={entry.id} className="border rounded-lg p-4">
                                          <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <Badge
                                                  variant={entry.action === 'approve' ? 'default' : 
                                                          entry.action === 'reject' ? 'destructive' : 'secondary'}
                                                >
                                                  {entry.action}
                                                </Badge>
                                                <span className="text-sm font-medium">{entry.approverName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                  ({entry.approverRole})
                                                </span>
                                              </div>
                                              <div className="text-sm">
                                                Status: {entry.previousStatus} → {entry.newStatus}
                                              </div>
                                              {entry.remarks && (
                                                <div className="text-sm text-muted-foreground">
                                                  Remarks: {entry.remarks}
                                                </div>
                                              )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {formatDate(entry.processedAt)}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}