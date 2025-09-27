import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  User, 
  Calendar,
  DollarSign,
  CheckCircle,
  FileText,
  Hash,
  Clock
} from "lucide-react";
import { ExpenseClaim, User as UserType } from "@shared/schema";

interface ClaimWithDetails extends ExpenseClaim {
  user: UserType;
  items: any[];
  // Employee profile data from external API
  employerName?: string;
  employeeNumber?: string;
  employeeEmail?: string;
}

interface ProcessedPayment extends ExpenseClaim {
  user: UserType;
  processedByUser: UserType;
  // Employee profile data from external API
  employerName?: string;
  employeeNumber?: string;
  employeeEmail?: string;
}

export default function PaymentProcessing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithDetails | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get approved claims ready for payment
  const { data: approvedClaims, isLoading: loadingApproved } = useQuery<ClaimWithDetails[]>({
    queryKey: ["/api/expense-claims/approved"],
  });

  // Get approved requests ready for payment
  const { data: approvedRequests, isLoading: loadingApprovedRequests } = useQuery<any[]>({
    queryKey: ["/api/expense-requests/approved"],
  });

  // Get processed payments history
  const { data: processedPayments, isLoading: loadingProcessed } = useQuery<ProcessedPayment[]>({
    queryKey: ["/api/expense-claims/processed-payments"],
  });

  // Process payment mutation
  const paymentMutation = useMutation({
    mutationFn: async ({ claimId, utrNumber, paymentDate }: { 
      claimId: string; 
      utrNumber: string; 
      paymentDate: string; 
    }) => {
      return await apiRequest(`/api/expense-claims/${claimId}/process-payment`, {
        method: "POST",
        body: { utrNumber, paymentDate },
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Payment Processed",
        description: `Payment processed successfully with UTR: ${data.utrNumber}`,
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims/approved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-requests/approved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims/processed-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims"] });
      
      setSelectedClaim(null);
      setUtrNumber("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setIsProcessing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleProcessPayment = async () => {
    if (!selectedClaim || !utrNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter UTR number",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    paymentMutation.mutate({
      claimId: selectedClaim.id,
      utrNumber: utrNumber.trim(),
      paymentDate,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="payment-processing">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Processing</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <CreditCard className="w-4 h-4 mr-1" />
            UTR Tracking
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Items for Payment ({(approvedClaims?.length || 0) + (approvedRequests?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="processed" data-testid="tab-processed">
            Payment History ({processedPayments?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <h2 className="text-xl font-semibold">Claims & Requests Ready for Payment</h2>
          
          {(loadingApproved || loadingApprovedRequests) ? (
            <div className="space-y-4" data-testid="loading-approved">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (!approvedClaims || approvedClaims.length === 0) && (!approvedRequests || approvedRequests.length === 0) ? (
            <Card className="h-64 flex items-center justify-center" data-testid="no-approved-claims">
              <CardContent>
                <div className="text-center text-gray-500">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Items Pending Payment</h3>
                  <p>All approved claims and requests have been processed.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {/* Approved Expense Requests */}
              {approvedRequests?.map((request) => (
                <Card key={`request-${request.id}`} data-testid={`approved-request-${request.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">
                          <Badge variant="outline" className="mr-2">REQUEST</Badge>
                          {request.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{request.firstName} {request.lastName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Approved: {new Date(request.approvedAt!).toLocaleDateString('en-GB')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mb-2">
                          Request - Ready for Payment
                        </Badge>
                        <div className="flex items-center gap-1 text-xl font-bold">
                          <DollarSign className="w-5 h-5" />
                          <span>₹{parseFloat(request.estimatedAmount || '0').toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-gray-600 mb-1">Estimated Amount: ₹{parseFloat(request.estimatedAmount || '0').toLocaleString()}</p>
                        <p className="text-gray-600">Type: {request.type || 'General'}</p>
                      </div>
                      
                      <Button 
                        variant="outline"
                        data-testid={`button-approve-request-${request.id}`}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Process Request Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Approved Expense Claims */}
              {approvedClaims?.map((claim) => (
                <Card key={claim.id} data-testid={`approved-claim-${claim.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{claim.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{claim.employerName || `${claim.user.firstName} ${claim.user.lastName}`}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Approved: {new Date(claim.approvedAt!).toLocaleDateString('en-GB')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 mb-2">
                          Ready for Payment
                        </Badge>
                        <div className="flex items-center gap-1 text-xl font-bold">
                          <DollarSign className="w-5 h-5" />
                          <span>₹{parseFloat(claim.balancePayment).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-gray-600 mb-1">Total Amount: ₹{parseFloat(claim.totalAmount).toLocaleString()}</p>
                        {claim.advanceAmount && parseFloat(claim.advanceAmount) > 0 && (
                          <p className="text-gray-600">Advance Used: ₹{parseFloat(claim.advanceAmount).toLocaleString()}</p>
                        )}
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={() => {
                              setSelectedClaim(claim);
                              setUtrNumber("");
                              setPaymentDate(new Date().toISOString().split('T')[0]);
                            }}
                            data-testid={`button-process-${claim.id}`}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Process Payment
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <CreditCard className="w-5 h-5" />
                              Process Payment
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedClaim && (
                            <div className="space-y-4">
                              <Card>
                                <CardContent className="p-4">
                                  <h3 className="font-medium mb-2">{selectedClaim.title}</h3>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">Employee:</span>
                                      <p className="font-medium">{selectedClaim.employerName || `${selectedClaim.user.firstName} ${selectedClaim.user.lastName}`}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Payment Amount:</span>
                                      <p className="font-bold text-green-600">₹{parseFloat(selectedClaim.balancePayment).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="utr-number" className="flex items-center gap-1">
                                    <Hash className="w-4 h-4" />
                                    UTR Number *
                                  </Label>
                                  <Input
                                    id="utr-number"
                                    placeholder="Enter UTR number"
                                    value={utrNumber}
                                    onChange={(e) => setUtrNumber(e.target.value)}
                                    data-testid="input-utr"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="payment-date" className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Payment Date *
                                  </Label>
                                  <Input
                                    id="payment-date"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    data-testid="input-payment-date"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedClaim(null)}
                                  disabled={isProcessing}
                                  data-testid="button-cancel"
                                >
                                  Cancel
                                </Button>
                                
                                <Button
                                  onClick={handleProcessPayment}
                                  disabled={isProcessing || !utrNumber.trim()}
                                  data-testid="button-confirm-payment"
                                >
                                  {isProcessing ? (
                                    <Clock className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                  )}
                                  Process Payment
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          <h2 className="text-xl font-semibold">Payment History</h2>
          
          {loadingProcessed ? (
            <div className="space-y-4" data-testid="loading-processed">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !processedPayments || processedPayments.length === 0 ? (
            <Card className="h-64 flex items-center justify-center" data-testid="no-processed-payments">
              <CardContent>
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Payment History</h3>
                  <p>No payments have been processed yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {processedPayments.map((payment) => (
                <Card key={payment.id} data-testid={`processed-payment-${payment.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-medium">{payment.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{payment.employerName || `${payment.user.firstName} ${payment.user.lastName}`}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            <span>UTR: {payment.utrNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(payment.paymentDate!).toLocaleDateString('en-GB')}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Processed by: {payment.processedByUser?.firstName} {payment.processedByUser?.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 mb-2">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </Badge>
                        <div className="flex items-center gap-1 font-bold">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{parseFloat(payment.balancePayment).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}