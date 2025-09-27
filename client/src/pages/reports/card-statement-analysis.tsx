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
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Receipt,
  Search,
  Download,
  Filter,
  XCircle,
  FileX
} from "lucide-react";

export default function CardStatementAnalysis() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cardFilter, setCardFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("reconciliation");

  // Fetch card statement data from API
  const { data: cardData, isLoading } = useQuery({
    queryKey: ['/api/reports/card-analysis', { search: searchTerm, status: statusFilter, card: cardFilter }],
  });

  const data = cardData || {
    cardTransactions: [],
    expenseClaims: [],
    reconciliation: [],
    missingReceipts: [],
    corporateCards: []
  };

  // Ensure data properties are arrays for safety
  const safeCardTransactions = Array.isArray(data.cardTransactions) ? data.cardTransactions : [];
  const safeExpenseClaims = Array.isArray(data.expenseClaims) ? data.expenseClaims : [];
  const safeReconciliation = Array.isArray(data.reconciliation) ? data.reconciliation : [];
  const safeMissingReceipts = Array.isArray(data.missingReceipts) ? data.missingReceipts : [];
  const safeCorporateCards = Array.isArray(data.corporateCards) ? data.corporateCards : [];

  const filteredTransactions = safeCardTransactions.filter((transaction: any) => {
    const matchesSearch = transaction.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || transaction.reconciliationStatus === statusFilter;
    const matchesCard = cardFilter === "all" || transaction.cardId === cardFilter;
    return matchesSearch && matchesStatus && matchesCard;
  });

  // Calculate summary stats
  const stats = {
    totalCardTransactions: safeCardTransactions.length,
    totalExpenseClaims: safeExpenseClaims.length,
    matchedTransactions: safeReconciliation.filter((r: any) => r.status === 'matched').length,
    unmatchedTransactions: safeReconciliation.filter((r: any) => r.status === 'unmatched').length,
    missingReceipts: safeMissingReceipts.length,
    totalCardSpend: safeCardTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    totalClaimedAmount: safeExpenseClaims.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
  };

  const reconciliationRate = stats.totalCardTransactions > 0 
    ? (stats.matchedTransactions / stats.totalCardTransactions) * 100 
    : 0;

  const getReconciliationColor = (status: string) => {
    switch (status) {
      case 'matched': return 'bg-green-100 text-green-800 border-green-200';
      case 'unmatched': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disputed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReconciliationIcon = (status: string) => {
    switch (status) {
      case 'matched': return <CheckCircle className="w-4 h-4" />;
      case 'unmatched': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Card Statement Analysis</h1>
              <p className="text-lg text-gray-600">
                Match and analyze corporate card expenses against submitted claims. 
                Ensure accurate reconciliation and prevent misuse of company cards.
              </p>
            </div>

            {/* Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Card Transactions</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalCardTransactions}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Card Spend</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCardSpend)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reconciliation Rate</p>
                      <p className="text-2xl font-bold text-purple-600">{reconciliationRate.toFixed(1)}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Missing Receipts</p>
                      <p className="text-2xl font-bold text-red-600">{stats.missingReceipts}</p>
                    </div>
                    <FileX className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by merchant or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-transactions"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      onClick={() => setStatusFilter("all")}
                      data-testid="button-filter-all"
                    >
                      All Status
                    </Button>
                    <Button
                      variant={statusFilter === "unmatched" ? "default" : "outline"}
                      onClick={() => setStatusFilter("unmatched")}
                      data-testid="button-filter-unmatched"
                    >
                      Unmatched
                    </Button>
                    <Button
                      variant={statusFilter === "disputed" ? "default" : "outline"}
                      onClick={() => setStatusFilter("disputed")}
                      data-testid="button-filter-disputed"
                    >
                      Disputed
                    </Button>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700" data-testid="button-export-card-analysis">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Card Statement Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
                    <TabsTrigger value="unmatched">Unmatched Items</TabsTrigger>
                    <TabsTrigger value="missing">Missing Receipts</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                  </TabsList>

                  <TabsContent value="reconciliation" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Transaction Reconciliation Status</h3>
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredTransactions.map((transaction: any) => (
                            <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-gray-900" data-testid={`text-transaction-${transaction.id}`}>
                                      {transaction.merchant || "Unknown Merchant"}
                                    </h3>
                                    <Badge 
                                      className={`${getReconciliationColor(transaction.reconciliationStatus)} flex items-center gap-1`}
                                      data-testid={`badge-status-${transaction.id}`}
                                    >
                                      {getReconciliationIcon(transaction.reconciliationStatus)}
                                      {transaction.reconciliationStatus || 'pending'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    Card: {transaction.cardNumber} | Date: {formatDateDisplay(transaction.transactionDate)}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {transaction.description || "No description available"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">
                                    {formatCurrency(transaction.amount)}
                                  </p>
                                  {transaction.matchedClaimId && (
                                    <p className="text-sm text-green-600">
                                      Claim: {transaction.matchedClaimId}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {transaction.reconciliationStatus === 'unmatched' && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                  <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-800">Action Required</span>
                                  </div>
                                  <p className="text-sm text-red-700">
                                    This transaction has no matching expense claim. 
                                    Employee may need to submit a claim or justify the expense.
                                  </p>
                                </div>
                              )}

                              {transaction.notes && (
                                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-sm text-blue-800">
                                    <strong>Notes:</strong> {transaction.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {filteredTransactions.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>No transactions found matching your criteria</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="unmatched" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Unmatched Transactions</h3>
                      <div className="space-y-3">
                        {safeCardTransactions.filter((t: any) => t.reconciliationStatus === 'unmatched').map((transaction: any) => (
                          <div key={transaction.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <XCircle className="w-5 h-5 text-red-600" />
                                  <h4 className="font-semibold text-red-900" data-testid={`text-unmatched-${transaction.id}`}>
                                    {transaction.merchant}
                                  </h4>
                                </div>
                                <p className="text-sm text-red-700 mb-1">
                                  Employee: {transaction.cardholderName} | Date: {formatDateDisplay(transaction.transactionDate)}
                                </p>
                                <p className="text-sm text-red-600">
                                  Potential Issue: No expense claim found for this corporate card transaction
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-red-900">
                                  {formatCurrency(transaction.amount)}
                                </p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="mt-2 text-red-600 border-red-300"
                                  data-testid={`button-investigate-${transaction.id}`}
                                >
                                  Investigate
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {safeCardTransactions.filter((t: any) => t.reconciliationStatus === 'unmatched').length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No unmatched transactions found - great reconciliation work!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="missing" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Missing Receipt Analysis</h3>
                      <div className="space-y-3">
                        {safeMissingReceipts.map((item: any) => (
                          <div key={item.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileX className="w-5 h-5 text-yellow-600" />
                                  <h4 className="font-semibold text-yellow-900" data-testid={`text-missing-receipt-${item.id}`}>
                                    {item.merchant || item.description}
                                  </h4>
                                </div>
                                <p className="text-sm text-yellow-700 mb-1">
                                  Employee: {item.employeeName} | Transaction Date: {formatDateDisplay(item.transactionDate)}
                                </p>
                                <p className="text-sm text-yellow-600">
                                  Status: Receipt required for compliance and audit purposes
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-yellow-900">
                                  {formatCurrency(item.amount)}
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                  {item.daysSinceTransaction} days since transaction
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {safeMissingReceipts.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>All transactions have proper receipt documentation</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="insights" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Card Usage Insights & Recommendations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">Reconciliation Health</h4>
                          </div>
                          <p className="text-sm text-green-700 mb-2">
                            {reconciliationRate.toFixed(1)}% of card transactions are properly matched to expense claims
                          </p>
                          <p className="text-xs text-green-600">
                            {reconciliationRate >= 95 ? 'Excellent compliance rate!' : 'Target: Achieve 95%+ reconciliation rate'}
                          </p>
                        </div>
                        
                        <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <h4 className="font-semibold text-orange-800">Risk Areas</h4>
                          </div>
                          <p className="text-sm text-orange-700 mb-2">
                            {stats.unmatchedTransactions} unmatched transactions require immediate attention
                          </p>
                          <p className="text-xs text-orange-600">
                            Follow up with cardholders to submit missing expense claims
                          </p>
                        </div>
                        
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Card Usage Trends</h4>
                          </div>
                          <p className="text-sm text-blue-700 mb-2">
                            Average transaction amount: {formatCurrency(stats.totalCardSpend / (stats.totalCardTransactions || 1))}
                          </p>
                          <p className="text-xs text-blue-600">
                            Monitor for unusual spending patterns or high-value transactions
                          </p>
                        </div>
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