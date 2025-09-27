import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { 
  DollarSign, 
  FileText,
  Calculator,
  TrendingUp,
  Download,
  Calendar,
  Building,
  CreditCard,
  Receipt,
  PieChart
} from "lucide-react";

export default function AccountantReport() {
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [activeTab, setActiveTab] = useState("summary");

  // Fetch accounting data from API
  const { data: accountingData, isLoading } = useQuery({
    queryKey: ['/api/reports/accounting', { period: selectedPeriod }],
  });

  const data = accountingData || {
    summary: {},
    ledgerEntries: [],
    expenseBreakdown: [],
    taxSummary: {},
    auditTrail: [],
    reconciliation: {}
  };
  
  // Ensure data properties are safe for access
  const safeLedgerEntries = Array.isArray(data?.ledgerEntries) ? data.ledgerEntries : [];
  const safeExpenseBreakdown = Array.isArray(data?.expenseBreakdown) ? data.expenseBreakdown : [];
  const safeTaxSummary = data?.taxSummary || {};
  const safeAuditTrail = Array.isArray(data?.auditTrail) ? data.auditTrail : [];

  // Calculate financial summary
  const summary = {
    totalExpenses: safeLedgerEntries.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0),
    totalTax: safeTaxSummary.totalTax || 0,
    pendingReconciliation: data.reconciliation?.pending || 0,
    completedEntries: safeLedgerEntries.filter((entry: any) => entry.status === 'posted').length
  };

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'debit': return 'bg-red-100 text-red-800 border-red-200';
      case 'credit': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Accountant Report</h1>
              <p className="text-lg text-gray-600">
                Financial data for accounting, reconciliation, and audit purposes. 
                Prepare financial statements, support audits, and ensure accurate reporting.
              </p>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalExpenses)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tax Liability</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalTax)}</p>
                    </div>
                    <Calculator className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Reconciliation</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.pendingReconciliation)}</p>
                    </div>
                    <FileText className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Posted Entries</p>
                      <p className="text-2xl font-bold text-green-600">{summary.completedEntries}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Reporting Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant={selectedPeriod === "current_month" ? "default" : "outline"}
                      onClick={() => setSelectedPeriod("current_month")}
                      data-testid="button-period-current-month"
                    >
                      Current Month
                    </Button>
                    <Button
                      variant={selectedPeriod === "last_quarter" ? "default" : "outline"}
                      onClick={() => setSelectedPeriod("last_quarter")}
                      data-testid="button-period-last-quarter"
                    >
                      Last Quarter
                    </Button>
                    <Button
                      variant={selectedPeriod === "fiscal_year" ? "default" : "outline"}
                      onClick={() => setSelectedPeriod("fiscal_year")}
                      data-testid="button-period-fiscal-year"
                    >
                      Fiscal Year
                    </Button>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700" data-testid="button-export-accounting">
                    <Download className="w-4 h-4 mr-2" />
                    Export Financial Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Reports Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="ledger">General Ledger</TabsTrigger>
                    <TabsTrigger value="breakdown">Expense Breakdown</TabsTrigger>
                    <TabsTrigger value="tax">Tax Report</TabsTrigger>
                    <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Financial Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Income Statement Items</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-gray-600">Operating Expenses</span>
                              <span className="font-semibold">{formatCurrency(summary.totalExpenses * 0.8)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-gray-600">Administrative Expenses</span>
                              <span className="font-semibold">{formatCurrency(summary.totalExpenses * 0.15)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-gray-600">Travel & Entertainment</span>
                              <span className="font-semibold">{formatCurrency(summary.totalExpenses * 0.05)}</span>
                            </div>
                            <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-300">
                              <span>Total Expenses</span>
                              <span>{formatCurrency(summary.totalExpenses)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Balance Sheet Impact</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-gray-600">Accounts Payable</span>
                              <span className="font-semibold">{formatCurrency(summary.pendingReconciliation)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-gray-600">Prepaid Expenses</span>
                              <span className="font-semibold">{formatCurrency(summary.totalExpenses * 0.1)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-gray-600">Tax Payable</span>
                              <span className="font-semibold">{formatCurrency(summary.totalTax)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ledger" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">General Ledger Entries</h3>
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {safeLedgerEntries.map((entry: any) => (
                            <div key={entry.id} className="border rounded-lg p-4 bg-white">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-900" data-testid={`text-entry-${entry.id}`}>
                                      {entry.account} - {entry.description}
                                    </h4>
                                    <Badge className={getEntryTypeColor(entry.type)}>
                                      {entry.type}
                                    </Badge>
                                    <Badge className={getStatusColor(entry.status)}>
                                      {entry.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Reference: {entry.reference} | Date: {formatDateDisplay(entry.date)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">
                                    {formatCurrency(entry.amount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {safeLedgerEntries.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>No ledger entries found for the selected period</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="breakdown" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Expense Category Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safeExpenseBreakdown.map((category: any) => (
                          <Card key={category.category} className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.colorClass || 'bg-blue-100'}`}>
                                <Building className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900" data-testid={`text-category-${category.category}`}>
                                  {category.category}
                                </h4>
                                <p className="text-sm text-gray-600">{category.count} transactions</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(category.amount)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {((category.amount / summary.totalExpenses) * 100).toFixed(1)}% of total
                              </p>
                            </div>
                          </Card>
                        ))}
                        
                        {safeExpenseBreakdown.length === 0 && (
                          <div className="col-span-full text-center py-8 text-gray-500">
                            <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No expense breakdown available for the selected period</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tax" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Tax Compliance Report</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">GST Summary</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between py-2">
                              <span className="text-gray-600">Input Tax Credit</span>
                              <span className="font-semibold">{formatCurrency(safeTaxSummary.gstInput || 0)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span className="text-gray-600">Output Tax Liability</span>
                              <span className="font-semibold">{formatCurrency(safeTaxSummary.gstOutput || 0)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-t font-bold">
                              <span>Net GST Payable</span>
                              <span>{formatCurrency((safeTaxSummary.gstOutput || 0) - (safeTaxSummary.gstInput || 0))}</span>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">TDS Summary</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between py-2">
                              <span className="text-gray-600">TDS on Vendor Payments</span>
                              <span className="font-semibold">{formatCurrency(safeTaxSummary.tdsVendor || 0)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span className="text-gray-600">TDS on Employee Expenses</span>
                              <span className="font-semibold">{formatCurrency(safeTaxSummary.tdsEmployee || 0)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-t font-bold">
                              <span>Total TDS Deducted</span>
                              <span>{formatCurrency((safeTaxSummary.tdsVendor || 0) + (safeTaxSummary.tdsEmployee || 0))}</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="audit" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Audit Trail</h3>
                      <div className="space-y-3">
                        {safeAuditTrail.map((audit: any) => (
                          <div key={audit.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1" data-testid={`text-audit-${audit.id}`}>
                                  {audit.action} - {audit.entityType}
                                </h4>
                                <p className="text-sm text-gray-600 mb-1">
                                  User: {audit.performedBy} | Entity ID: {audit.entityId}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Changes: {audit.changes}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDateDisplay(audit.timestamp)}
                                </p>
                                <Badge className="mt-1" variant="outline">
                                  {audit.action}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {safeAuditTrail.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No audit trail entries found for the selected period</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}