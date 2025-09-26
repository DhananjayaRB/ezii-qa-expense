import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Search, Filter, Calendar, DollarSign, FileText, Clock } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface VendorClaim {
  id: string;
  title: string;
  description: string;
  vendorName: string;
  category: string;
  amount: string;
  status: string;
  createdAt: string;
  vendorDueDate?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
}

interface VendorClaimSummaryProps {
  onViewClaim?: (claimId: string) => void;
}

export function VendorClaimSummary({ onViewClaim }: VendorClaimSummaryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch vendor claims
  const { data: vendorClaims, isLoading } = useQuery<VendorClaim[]>({
    queryKey: ['/api/vendor-claims'],
    enabled: true,
  });

  const filteredClaims = vendorClaims?.filter(claim => {
    const matchesSearch = claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || claim.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      approved: { variant: "default" as const, label: "Approved" },
      rejected: { variant: "destructive" as const, label: "Rejected" },
      paid: { variant: "default" as const, label: "Paid" },
      draft: { variant: "outline" as const, label: "Draft" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} data-testid={`status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      vendor_dues: "Vendor Dues",
      utility_bill: "Utility Bill",
      standard_bill: "Standard Bill",
      non_registered: "Non-Registered",
      po_matching: "PO Matching",
    };
    return categoryLabels[category] || category;
  };

  // Calculate summary stats
  const totalClaims = filteredClaims.length;
  const totalAmount = filteredClaims.reduce((sum, claim) => sum + parseFloat(claim.amount || '0'), 0);
  const pendingClaims = filteredClaims.filter(claim => claim.status === 'pending').length;
  const overdueClaims = filteredClaims.filter(claim => {
    if (!claim.vendorDueDate) return false;
    return new Date(claim.vendorDueDate) < new Date() && claim.status !== 'paid';
  }).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-lg text-muted-foreground">Loading vendor claims...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{totalClaims}</div>
                <div className="text-sm text-muted-foreground">Total Claims</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{pendingClaims}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{overdueClaims}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, vendor, or invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-claims"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vendor_dues">Vendor Dues</SelectItem>
                <SelectItem value="utility_bill">Utility Bill</SelectItem>
                <SelectItem value="standard_bill">Standard Bill</SelectItem>
                <SelectItem value="non_registered">Non-Registered</SelectItem>
                <SelectItem value="po_matching">PO Matching</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vendor Claims ({filteredClaims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClaims.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium text-muted-foreground">No vendor claims found</div>
              <div className="text-sm text-muted-foreground mt-1">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first vendor claim to get started"}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id} data-testid={`claim-row-${claim.id}`}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{claim.title}</div>
                        {claim.invoiceNumber && (
                          <div className="text-sm text-muted-foreground">
                            Invoice: {claim.invoiceNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{claim.vendorName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(claim.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(parseFloat(claim.amount || '0'))}
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      {formatDate(claim.createdAt)}
                    </TableCell>
                    <TableCell>
                      {claim.vendorDueDate ? (
                        <div className={`text-sm ${
                          new Date(claim.vendorDueDate) < new Date() && claim.status !== 'paid'
                            ? 'text-red-600 font-medium'
                            : 'text-muted-foreground'
                        }`}>
                          {formatDate(claim.vendorDueDate)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewClaim?.(claim.id)}
                        data-testid={`button-view-claim-${claim.id}`}
                      >
                        <Eye className="h-4 w-4" />
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
  );
}