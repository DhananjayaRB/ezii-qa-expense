import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Edit, 
  Trash2, 
  Eye, 
  Plus,
  Download,
  Clock,
  Building2,
  User,
  Calendar
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface VendorClaim {
  id: string;
  title: string;
  description?: string;
  vendorId: string;
  vendorName: string;
  userId: string;
  userName: string;
  totalAmount: string;
  balancePayment: string;
  status: string;
  billType: string;
  submittedAt: string;
  approvedAt?: string;
  paidAt?: string;
  dueDate?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  currentApprovalLevel?: string;
  customFields?: any;
}

interface User {
  id: string;
  role: string;
}

export default function VendorClaimsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [billTypeFilter, setBillTypeFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [selectedClaim, setSelectedClaim] = useState<VendorClaim | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Use JWT authentication from localStorage ONLY - no more session auth queries
  const { user: currentUser } = useAuth();

  // Fetch vendor claims
  const { data: claims, isLoading: isLoadingClaims, refetch: refetchClaims } = useQuery<VendorClaim[]>({
    queryKey: ["/api/vendor-claims"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch vendors for filter
  const { data: vendors } = useQuery<any[]>({
    queryKey: ["/api/vendors"]
  });

  // Approve claim mutation
  const approveMutation = useMutation({
    mutationFn: (claimId: string) => apiRequest(`/api/vendor-claims/${claimId}/approve`, { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor claim approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-claims"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve claim",
        variant: "destructive",
      });
    },
  });

  // Reject claim mutation
  const rejectMutation = useMutation({
    mutationFn: ({ claimId, reason }: { claimId: string; reason: string }) =>
      apiRequest(`/api/vendor-claims/${claimId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor claim rejected successfully",
      });
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-claims"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject claim",
        variant: "destructive",
      });
    },
  });

  // Process payment mutation
  const payMutation = useMutation({
    mutationFn: ({ claimId, paymentReference }: { claimId: string; paymentReference: string }) =>
      apiRequest(`/api/vendor-claims/${claimId}/pay`, {
        method: "POST",
        body: JSON.stringify({ paymentReference }),
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
      setPaymentReference("");
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-claims"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  // Delete claim mutation
  const deleteMutation = useMutation({
    mutationFn: (claimId: string) => apiRequest(`/api/vendor-claims/${claimId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor claim deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-claims"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete claim",
        variant: "destructive",
      });
    },
  });

  // Filter claims based on search and filters
  const filteredClaims = claims?.filter(claim => {
    const matchesSearch = claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          claim.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          claim.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    const matchesBillType = billTypeFilter === "all" || claim.billType === billTypeFilter;
    const matchesVendor = vendorFilter === "all" || claim.vendorId === vendorFilter;
    
    return matchesSearch && matchesStatus && matchesBillType && matchesVendor;
  }) || [];

  const getStatusBadge = (status: string) => {
    const variants = {
      'submitted': 'secondary',
      'approved': 'default',
      'rejected': 'destructive',
      'paid': 'outline',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} data-testid={`status-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canApprove = (claim: VendorClaim) => {
    return claim.status === 'submitted' && 
           (currentUser?.role.includes('manager') || 
            currentUser?.role.includes('accountant') || 
            currentUser?.role.includes('admin'));
  };

  const canProcessPayment = (claim: VendorClaim) => {
    return claim.status === 'approved' && 
           (currentUser?.role.includes('accountant') || 
            currentUser?.role.includes('admin'));
  };

  const canEdit = (claim: VendorClaim) => {
    return claim.status === 'submitted' || claim.status === 'draft';
  };

  const canDelete = (claim: VendorClaim) => {
    return (claim.status === 'submitted' || claim.status === 'draft') && 
           (currentUser?.role.includes('admin') || claim.userId === currentUser?.id);
  };

  const exportToCSV = () => {
    const csvData = filteredClaims.map(claim => ({
      'Claim ID': claim.id,
      'Title': claim.title,
      'Vendor': claim.vendorName,
      'Submitted By': claim.userName,
      'Amount': claim.totalAmount,
      'Net Payable': claim.balancePayment,
      'Status': claim.status,
      'Bill Type': claim.billType,
      'Submitted Date': formatDate(claim.submittedAt),
      'Due Date': claim.dueDate ? formatDate(claim.dueDate) : '',
      'Invoice Number': claim.invoiceNumber || '',
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-claims-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Claims Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage vendor claims with complete approval workflow
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Link href="/vendors/claim">
              <Button className="flex items-center gap-2" data-testid="button-create-claim">
                <Plus className="w-4 h-4" />
                Create Claim
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-claims">
                {filteredClaims.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-claims">
                {filteredClaims.filter(c => c.status === 'submitted').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-amount">
                {formatCurrency(
                  filteredClaims.reduce((sum, claim) => sum + parseFloat(claim.totalAmount || '0'), 0)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Payable</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-net-payable">
                {formatCurrency(
                  filteredClaims.reduce((sum, claim) => sum + parseFloat(claim.balancePayment || '0'), 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">Search Claims</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title, vendor, or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bill-type-filter">Bill Type</Label>
                <Select value={billTypeFilter} onValueChange={setBillTypeFilter}>
                  <SelectTrigger data-testid="select-bill-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bill Types</SelectItem>
                    <SelectItem value="vendor_dues">Vendor Dues</SelectItem>
                    <SelectItem value="utility_bills">Utility Bills</SelectItem>
                    <SelectItem value="professional_services">Professional Services</SelectItem>
                    <SelectItem value="purchase_orders">Purchase Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vendor-filter">Vendor</Label>
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger data-testid="select-vendor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors?.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setBillTypeFilter("all");
                    setVendorFilter("all");
                  }}
                  variant="outline"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Claims ({filteredClaims.length})</CardTitle>
            <CardDescription>
              Complete list of vendor claims with approval management
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingClaims ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No vendor claims found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Claim Details</th>
                      <th className="text-left p-4 font-semibold">Vendor</th>
                      <th className="text-left p-4 font-semibold">Amount</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Dates</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim) => (
                      <tr key={claim.id} className="border-b hover:bg-muted/50" data-testid={`row-claim-${claim.id}`}>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-sm">{claim.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {claim.billType} • {claim.invoiceNumber || 'No Invoice'}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <User className="w-3 h-3" />
                              {claim.userName}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{claim.vendorName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{formatCurrency(parseFloat(claim.totalAmount))}</div>
                            <div className="text-sm text-green-600">
                              Net: {formatCurrency(parseFloat(claim.balancePayment))}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(claim.status)}
                        </td>
                        <td className="p-4">
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Submitted: {formatDate(claim.submittedAt)}
                            </div>
                            {claim.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due: {formatDate(claim.dueDate)}
                              </div>
                            )}
                            {claim.approvedAt && (
                              <div className="text-green-600">
                                Approved: {formatDate(claim.approvedAt)}
                              </div>
                            )}
                            {claim.paidAt && (
                              <div className="text-blue-600">
                                Paid: {formatDate(claim.paidAt)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {/* View/Details Button */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  data-testid={`button-view-${claim.id}`}
                                  onClick={() => setSelectedClaim(claim)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Vendor Claim Details</DialogTitle>
                                  <DialogDescription>
                                    Complete information for claim: {selectedClaim?.title}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedClaim && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Title</Label>
                                        <p className="text-sm">{selectedClaim.title}</p>
                                      </div>
                                      <div>
                                        <Label>Status</Label>
                                        <div>{getStatusBadge(selectedClaim.status)}</div>
                                      </div>
                                      <div>
                                        <Label>Vendor</Label>
                                        <p className="text-sm">{selectedClaim.vendorName}</p>
                                      </div>
                                      <div>
                                        <Label>Bill Type</Label>
                                        <p className="text-sm">{selectedClaim.billType}</p>
                                      </div>
                                      <div>
                                        <Label>Total Amount</Label>
                                        <p className="text-sm font-medium">{formatCurrency(parseFloat(selectedClaim.totalAmount))}</p>
                                      </div>
                                      <div>
                                        <Label>Net Payable</Label>
                                        <p className="text-sm font-medium text-green-600">{formatCurrency(parseFloat(selectedClaim.balancePayment))}</p>
                                      </div>
                                      <div>
                                        <Label>Submitted Date</Label>
                                        <p className="text-sm">{formatDate(selectedClaim.submittedAt)}</p>
                                      </div>
                                      {selectedClaim.dueDate && (
                                        <div>
                                          <Label>Due Date</Label>
                                          <p className="text-sm">{formatDate(selectedClaim.dueDate)}</p>
                                        </div>
                                      )}
                                    </div>
                                    {selectedClaim.description && (
                                      <div>
                                        <Label>Description</Label>
                                        <p className="text-sm">{selectedClaim.description}</p>
                                      </div>
                                    )}
                                    {selectedClaim.customFields && (
                                      <div>
                                        <Label>Additional Details</Label>
                                        <div className="bg-muted p-3 rounded text-xs">
                                          <pre>{JSON.stringify(selectedClaim.customFields, null, 2)}</pre>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {/* Edit Button */}
                            {canEdit(claim) && (
                              <Link href={`/vendors/claim?edit=${claim.id}`}>
                                <Button variant="ghost" size="sm" data-testid={`button-edit-${claim.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}

                            {/* Approve Button */}
                            {canApprove(claim) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveMutation.mutate(claim.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${claim.id}`}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                            )}

                            {/* Reject Button */}
                            {canApprove(claim) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    data-testid={`button-reject-${claim.id}`}
                                  >
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Vendor Claim</DialogTitle>
                                    <DialogDescription>
                                      Please provide a reason for rejecting this claim.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="rejection-reason">Rejection Reason</Label>
                                      <Textarea
                                        id="rejection-reason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Enter reason for rejection..."
                                        data-testid="textarea-rejection-reason"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <DialogTrigger asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogTrigger>
                                      <Button
                                        onClick={() => rejectMutation.mutate({ claimId: claim.id, reason: rejectionReason })}
                                        disabled={rejectMutation.isPending || !rejectionReason.trim()}
                                        variant="destructive"
                                        data-testid="button-confirm-reject"
                                      >
                                        Reject Claim
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            {/* Process Payment Button */}
                            {canProcessPayment(claim) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    data-testid={`button-pay-${claim.id}`}
                                  >
                                    <DollarSign className="w-4 h-4 text-blue-600" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Process Payment</DialogTitle>
                                    <DialogDescription>
                                      Process payment for {claim.title} - {formatCurrency(parseFloat(claim.balancePayment))}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="payment-reference">Payment Reference (Optional)</Label>
                                      <Input
                                        id="payment-reference"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        placeholder="Enter payment reference or transaction ID..."
                                        data-testid="input-payment-reference"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <DialogTrigger asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogTrigger>
                                      <Button
                                        onClick={() => payMutation.mutate({ claimId: claim.id, paymentReference })}
                                        disabled={payMutation.isPending}
                                        data-testid="button-confirm-payment"
                                      >
                                        Process Payment
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            {/* Delete Button */}
                            {canDelete(claim) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    data-testid={`button-delete-${claim.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Vendor Claim</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{claim.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(claim.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      data-testid="button-confirm-delete"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}