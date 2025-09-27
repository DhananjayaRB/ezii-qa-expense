import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { 
  FileText, 
  Search, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Camera,
  Filter
} from "lucide-react";

export default function ReceiptReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch receipts data from API
  const { data: receiptsData, isLoading } = useQuery({
    queryKey: ['/api/receipts', { search: searchTerm, status: statusFilter }],
  });

  const receipts = receiptsData || [];
  
  // Ensure receipts is an array for safety
  const safeReceipts = Array.isArray(receipts) ? receipts : [];

  const filteredReceipts = safeReceipts.filter((receipt: any) => {
    const matchesSearch = receipt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary stats
  const stats = {
    total: safeReceipts.length,
    withReceipts: safeReceipts.filter((r: any) => r.hasReceipt).length,
    withoutReceipts: safeReceipts.filter((r: any) => !r.hasReceipt).length,
    validated: safeReceipts.filter((r: any) => r.isValidated).length,
    suspicious: safeReceipts.filter((r: any) => r.isSuspicious).length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspicious': return 'bg-red-100 text-red-800 border-red-200';
      case 'missing': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'suspicious': return <AlertTriangle className="w-4 h-4" />;
      case 'missing': return <Camera className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Receipt Report</h1>
              <p className="text-lg text-gray-600">
                Tracks receipts submitted against expenses for validation and auditing. 
                Helps verify authenticity and prevent fraudulent claims.
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Claims</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">With Receipts</p>
                      <p className="text-2xl font-bold text-green-600">{stats.withReceipts}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Missing Receipts</p>
                      <p className="text-2xl font-bold text-red-600">{stats.withoutReceipts}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Validated</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.validated}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Suspicious</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.suspicious}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by expense title or vendor name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-receipts"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      onClick={() => setStatusFilter("all")}
                      data-testid="button-filter-all"
                    >
                      All
                    </Button>
                    <Button
                      variant={statusFilter === "missing" ? "default" : "outline"}
                      onClick={() => setStatusFilter("missing")}
                      data-testid="button-filter-missing"
                    >
                      Missing
                    </Button>
                    <Button
                      variant={statusFilter === "suspicious" ? "default" : "outline"}
                      onClick={() => setStatusFilter("suspicious")}
                      data-testid="button-filter-suspicious"
                    >
                      Suspicious
                    </Button>
                    <Button
                      variant={statusFilter === "validated" ? "default" : "outline"}
                      onClick={() => setStatusFilter("validated")}
                      data-testid="button-filter-validated"
                    >
                      Validated
                    </Button>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700" data-testid="button-export-receipts">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Validation Table */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt Validation Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReceipts.map((receipt: any) => (
                      <div key={receipt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900" data-testid={`text-receipt-title-${receipt.id}`}>
                              {receipt.title || "Untitled Expense"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Vendor: {receipt.vendorName || "Not specified"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Submitted: {formatDateDisplay(receipt.submittedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg text-gray-900">
                              {formatCurrency(receipt.amount)}
                            </p>
                            <Badge 
                              className={`${getStatusColor(receipt.receiptStatus)} flex items-center gap-1`}
                              data-testid={`badge-receipt-status-${receipt.id}`}
                            >
                              {getStatusIcon(receipt.receiptStatus)}
                              {receipt.receiptStatus || 'pending'}
                            </Badge>
                          </div>
                        </div>
                        
                        {receipt.receiptUrl && (
                          <div className="mt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(receipt.receiptUrl, '_blank')}
                              data-testid={`button-view-receipt-${receipt.id}`}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Receipt
                            </Button>
                          </div>
                        )}
                        
                        {receipt.validationNotes && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-yellow-800">
                              <strong>Validation Notes:</strong> {receipt.validationNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredReceipts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No receipts found matching your criteria</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <h4 className="font-semibold text-yellow-800 mb-2">Compliance Rate</h4>
                    <p className="text-2xl font-bold text-yellow-900">
                      {stats.total > 0 ? Math.round((stats.withReceipts / stats.total) * 100) : 0}%
                    </p>
                    <p className="text-sm text-yellow-700">of expenses have valid receipts</p>
                  </div>
                  
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-semibold text-red-800 mb-2">Risk Assessment</h4>
                    <p className="text-2xl font-bold text-red-900">{stats.suspicious}</p>
                    <p className="text-sm text-red-700">suspicious receipts requiring review</p>
                  </div>
                  
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <h4 className="font-semibold text-green-800 mb-2">Audit Readiness</h4>
                    <p className="text-2xl font-bold text-green-900">
                      {stats.total > 0 ? Math.round((stats.validated / stats.total) * 100) : 0}%
                    </p>
                    <p className="text-sm text-green-700">receipts validated and audit-ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}