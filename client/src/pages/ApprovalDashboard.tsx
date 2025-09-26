import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CostDistributionDisplay from "@/components/expense/CostDistributionDisplay";
import EditableCostDistribution from "@/components/expense/EditableCostDistribution";
import { useToast } from "@/hooks/use-toast";
import { CardLoading } from "@/components/ui/loading";
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  User, 
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Clock
} from "lucide-react";
import { ExpenseClaim, User as UserType } from "@shared/schema";

interface ClaimWithDetails extends ExpenseClaim {
  user: UserType;
  items: any[];
}

export default function ApprovalDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // All hooks must be called before any conditional returns
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithDetails | null>(null);
  const [selectedPaymentBatch, setSelectedPaymentBatch] = useState<any | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [modifiedCostDistribution, setModifiedCostDistribution] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("requests");

  // Get pending claims for the current user's role - aggressive refresh for instant updates
  const { data: pendingClaims, isLoading: isClaimsLoading } = useQuery<ClaimWithDetails[]>({
    queryKey: ["/api/expense-claims/pending-approval"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time feel
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache for instant updates
  });

  // Get pending payment batches and individual claims for approval - refetch on window focus for fresh data
  const { data: pendingPaymentsData, isLoading: isPaymentBatchesLoading } = useQuery<{
    paymentBatches: any[];
    individualClaims: any[];
  }>({
    queryKey: ["/api/payments/pending-approval"],
    select: (data) => data || { paymentBatches: [], individualClaims: [] },
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch fresh data
  });

  // Process approval mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ claimId, action, remarks, costDistributions, itemType }: { 
      claimId: string; 
      action: 'approve' | 'reject' | 'return'; 
      remarks: string;
      costDistributions?: any[];
      itemType: 'request' | 'claim' | 'vendor-onboard' | 'vendor-claim';
    }) => {
      // Determine the correct endpoint based on item type
      let endpoint = '';
      switch (itemType) {
        case 'request':
          endpoint = `/api/expense-requests/${claimId}/approve`;
          break;
        case 'claim':
          endpoint = `/api/expense-claims/${claimId}/approve`;
          break;
        case 'vendor-onboard':
          endpoint = `/api/vendor-onboard/${claimId}/approve`;
          break;
        case 'vendor-claim':
          endpoint = `/api/vendor-claims/${claimId}/approve`;
          break;
        default:
          throw new Error(`Unknown item type: ${itemType}`);
      }
      
      return await apiRequest(endpoint, {
        method: "POST",
        body: { action, remarks, costDistributions },
      });
    },
    onSuccess: (data, variables) => {
      const itemTypeName = variables.itemType === 'request' ? 'Request' : 
                          variables.itemType === 'claim' ? 'Claim' :
                          variables.itemType === 'vendor-onboard' ? 'Vendor Onboard' : 
                          'Vendor Claim';
      toast({
        title: "Success",
        description: `${itemTypeName} ${variables.action}d successfully`,
      });
      
      // Aggressive cache invalidation for instant UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims/pending-approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      
      // Force immediate refetch for instant feedback
      queryClient.refetchQueries({ queryKey: ["/api/expense-claims/pending-approval"] });
      
      // Remove stale data to ensure fresh content
      queryClient.removeQueries({ queryKey: ["/api/expense-claims/pending-approval"] });
      
      setSelectedClaim(null);
      setRemarks("");
      setModifiedCostDistribution([]);
      setIsProcessing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process approval",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  // Process payment batch approval mutation
  const paymentBatchApprovalMutation = useMutation({
    mutationFn: async ({ batchId, action, remarks }: { 
      batchId: string; 
      action: 'approve' | 'reject' | 'return'; 
      remarks: string; 
    }) => {
      return await apiRequest(`/api/payments/${batchId}/approve`, {
        method: "POST",
        body: { action, remarks },
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `Payment batch ${variables.action}d successfully`,
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/payments/pending-approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-batches"] });
      
      setSelectedPaymentBatch(null);
      setRemarks("");
      setIsProcessing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment batch approval",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

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

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const pendingPaymentBatches = pendingPaymentsData?.paymentBatches || [];
  const pendingPaymentClaims = pendingPaymentsData?.individualClaims || [];

  const handleApproval = async (action: 'approve' | 'reject' | 'return') => {
    if (!selectedClaim) return;
    
    setIsProcessing(true);
    const itemType = getItemType(selectedClaim);
    
    approvalMutation.mutate({
      claimId: selectedClaim.id,
      action,
      remarks: remarks.trim(),
      costDistributions: modifiedCostDistribution.length > 0 ? modifiedCostDistribution : undefined,
      itemType,
    });
  };

  const handlePaymentBatchApproval = async (action: 'approve' | 'reject' | 'return') => {
    if (!selectedPaymentBatch) return;
    
    setIsProcessing(true);
    paymentBatchApprovalMutation.mutate({
      batchId: selectedPaymentBatch.id,
      action,
      remarks: remarks.trim(),
    });
  };

  const getStatusColor = (status: string, isSelfApproval?: boolean) => {
    if (isSelfApproval) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border border-amber-300';
    }
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending_manager': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending_admin': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'pending_head': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'pending_accountant': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getUserRoleDisplayName = () => {
    if (!user || !(user as any).role) return 'User';
    const roles = (user as any).role.split(',');
    const roleNames = {
      manager: 'Manager',
      admin: 'Admin', 
      head: 'Head',
      accountant: 'Accountant'
    };
    return roles.map((role: any) => roleNames[role as keyof typeof roleNames] || role).join(', ');
  };

  const getApprovalActionContext = () => {
    if (!user || !(user as any).role) return 'approval';
    const roles = (user as any).role.split(',');
    
    if (roles.includes('manager')) return 'Manager Level';
    if (roles.includes('admin')) return 'Admin Level';
    if (roles.includes('head')) return 'Head Level';
    if (roles.includes('accountant')) return 'Final Accounting';
    
    return 'Approval';
  };

  // Helper function to determine item type
  const getItemType = (item: any): 'request' | 'claim' | 'vendor-onboard' | 'vendor-claim' => {
    // Check if item has processType field
    if (item.processType === 'request') return 'request';
    if (item.processType === 'claim') return 'claim';
    
    // Fallback to checking data structure - requests have estimatedAmount, claims have totalAmount
    if (item.estimatedAmount && !item.totalAmount) return 'request';
    if (item.totalAmount) return 'claim';
    
    // Check for vendor-related fields
    if (item.vendorName || item.vendorEmail) return 'vendor-onboard';
    if (item.vendorId) return 'vendor-claim';
    
    // Default fallback
    return 'claim';
  };

  // Filter items by type for tabs using unified logic
  const filterItemsByType = (items: any[] = []) => {
    const requests = items.filter(item => getItemType(item) === 'request');
    const expenseClaims = items.filter(item => getItemType(item) === 'claim');
    const vendorOnboard = items.filter(item => getItemType(item) === 'vendor-onboard');
    const vendorClaims = items.filter(item => getItemType(item) === 'vendor-claim');
    
    return { requests, expenseClaims, vendorOnboard, vendorClaims };
  };

  const { requests, expenseClaims, vendorOnboard, vendorClaims } = filterItemsByType(pendingClaims);

  // Helper function to render approval items
  const renderApprovalItems = (items: any[], emptyMessage: string, testId: string) => {
    if (!items || items.length === 0) {
      return (
        <Card className="h-96 flex items-center justify-center" data-testid={testId}>
          <CardContent>
            <div className="text-center text-gray-500">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
              <p>{emptyMessage}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-6">
        {items.map((item) => (
          <Card key={item.id} className="relative" data-testid={`pending-item-${item.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{item.user?.firstName} {item.user?.lastName} ({item.user?.email})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${getStatusColor(item.status, item.selfApprovalRequired)} mb-2`}>
                    {item.selfApprovalRequired ? 'Self-Approval Required' : item.status?.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1 text-lg font-bold">
                    <DollarSign className="w-4 h-4" />
                    <span>₹{(Number(item.totalAmount || item.estimatedAmount) || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {item.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="ml-1 font-medium">₹{(Number(item.advanceAmount || item.estimatedAmount) || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span className="ml-1 font-medium">₹{(Number(item.balancePayment || item.estimatedAmount) || 0).toLocaleString()}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedClaim(item)}
                  data-testid={`button-review-${item.id}`}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Review & Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (isClaimsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6" data-testid="loading-spinner">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Approval Dashboard</h1>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
                  <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <CardLoading text="Loading pending claims..." />
                <CardLoading text="Loading approval data..." />
                <CardLoading text="Loading statistics..." />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6" data-testid="approval-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Approval Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {getUserRoleDisplayName()}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {(pendingClaims?.length || 0)} Pending
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            Requests
            {requests?.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expenseClaims" className="flex items-center gap-2">
            Expense Claims
            {expenseClaims?.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {expenseClaims.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vendorOnboard" className="flex items-center gap-2">
            Vendor Onboard
            {vendorOnboard?.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {vendorOnboard.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vendorClaims" className="flex items-center gap-2">
            Vendor Claims
            {vendorClaims?.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {vendorClaims.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          {renderApprovalItems(requests, "No expense requests pending your approval at the moment.", "no-pending-requests")}
        </TabsContent>

        <TabsContent value="expenseClaims">
          {renderApprovalItems(expenseClaims, "No expense claims pending your approval at the moment.", "no-pending-expense-claims")}
        </TabsContent>

        <TabsContent value="vendorOnboard">
          {renderApprovalItems(vendorOnboard, "No vendor onboarding requests pending your approval at the moment.", "no-pending-vendor-onboard")}
        </TabsContent>

        <TabsContent value="vendorClaims">
          {renderApprovalItems(vendorClaims, "No vendor claims pending your approval at the moment.", "no-pending-vendor-claims")}
        </TabsContent>

      </Tabs>

      {/* Approval Dialog */}
      {selectedClaim && (
        <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {getApprovalActionContext()} - Review Claim
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Claim Details */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">{selectedClaim.title}</h3>
                  {selectedClaim.description && (
                    <p className="text-sm text-gray-600 mb-3">{selectedClaim.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <p className="font-medium">₹{(Number(selectedClaim.totalAmount || selectedClaim.estimatedAmount) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance Payment:</span>
                      <p className="font-medium">₹{(Number(selectedClaim.balancePayment || selectedClaim.estimatedAmount) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted By:</span>
                      <p className="font-medium">{selectedClaim.user?.firstName} {selectedClaim.user?.lastName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted Date:</span>
                      <p className="font-medium">{selectedClaim.submittedAt ? new Date(selectedClaim.submittedAt).toLocaleDateString('en-GB') : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Distribution */}
              <CostDistributionDisplay claimId={selectedClaim.id} />
              
              <EditableCostDistribution 
                claimId={selectedClaim.id}
                totalAmount={Number(selectedClaim.totalAmount || selectedClaim.estimatedAmount) || 0}
                onDistributionChange={setModifiedCostDistribution}
              />

              {/* Comments & Remarks */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments & Remarks (Optional)
                </label>
                <Textarea
                  placeholder="Add your comments or feedback for this claim..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => handleApproval('return')}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Return for Revision
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleApproval('reject')}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button 
                  onClick={() => handleApproval('approve')}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  </main>
</div>
</div>
  );
}