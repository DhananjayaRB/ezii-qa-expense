import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, CreditCard, AlertTriangle, FileText, IndianRupee, Calendar, Filter, Download } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import type { BillMasterType, BillMasterField } from "@shared/schema";

interface DateFilters {
  startDate: string;
  endDate: string;
  period?: 'monthly' | 'quarterly' | 'yearly';
  vendorId?: string;
}

interface VendorDueFilters extends DateFilters {
  billType?: string;
}

export default function VendorReports() {
  const [filters, setFilters] = useState<DateFilters>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0], // Today
  });

  const [activeTab, setActiveTab] = useState("overview");
  
  // Vendor Due Reports specific filters
  const [vendorDueFilters, setVendorDueFilters] = useState<VendorDueFilters>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch vendors list for filtering
  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
    enabled: true,
  });

  // Fetch analytics dashboard data
  const { data: dashboard = {}, isLoading: dashboardLoading } = useQuery<any>({
    queryKey: ["/api/vendor-reports/analytics-dashboard", filters.startDate, filters.endDate],
    enabled: !!filters.startDate && !!filters.endDate,
  });

  // Fetch expense reports
  const { data: expenseReports = [], isLoading: expenseLoading } = useQuery<any[]>({
    queryKey: ["/api/vendor-reports/expense-reports", filters.startDate, filters.endDate, filters.vendorId, filters.period],
    enabled: !!filters.startDate && !!filters.endDate,
  });

  // Fetch top vendors
  const { data: topVendors = [], isLoading: topVendorsLoading } = useQuery<any[]>({
    queryKey: ["/api/vendor-reports/top-vendors", filters.startDate, filters.endDate],
    enabled: !!filters.startDate && !!filters.endDate,
  });

  // Fetch pending vs cleared analysis
  const { data: pendingAnalysis = {}, isLoading: pendingLoading } = useQuery<any>({
    queryKey: ["/api/vendor-reports/pending-vs-cleared", filters.startDate, filters.endDate, filters.vendorId, filters.period],
    enabled: !!filters.startDate && !!filters.endDate,
  });

  // Fetch GST/TDS summary
  const { data: gstTdsSummary = [], isLoading: gstTdsLoading } = useQuery<any[]>({
    queryKey: ["/api/vendor-reports/gst-tds-summary", filters.startDate, filters.endDate, filters.vendorId, filters.period],
    enabled: !!filters.startDate && !!filters.endDate,
  });

  // Fetch bill master types for Vendor Due Reports
  const { data: billMasterTypes = [] } = useQuery<(BillMasterType & { fields: BillMasterField[] })[]>({
    queryKey: ["/api/bill-master/types"],
  });

  // Fetch vendor due reports data
  const { data: vendorDueReports = [], isLoading: vendorDueLoading } = useQuery<any[]>({
    queryKey: ["/api/vendor-reports/vendor-due-reports", vendorDueFilters.startDate, vendorDueFilters.endDate, vendorDueFilters.billType, vendorDueFilters.vendorId],
    enabled: !!vendorDueFilters.startDate && !!vendorDueFilters.endDate && !!vendorDueFilters.billType,
  });

  // Get available bill types (default + custom)
  const availableBillTypes = [
    { value: 'vendor_dues', label: 'Vendor Dues Form (for predictable expenses)', isDefault: true },
    { value: 'utility_bill', label: 'Utility Bill Form (for consumption-based expenses)', isDefault: true },
    { value: 'standard_bill', label: 'Standard Vendor Bill Form', isDefault: true },
    { value: 'non_registered', label: 'Non-Registered Vendor Payment Form', isDefault: true },
    { value: 'po_matching', label: 'Purchase Order (PO) to Invoice Matching Form', isDefault: true },
    ...billMasterTypes.filter(bt => bt.isActive).map(bt => ({
      value: bt.id,
      label: bt.name,
      isDefault: false,
      billType: bt,
    }))
  ];

  const handleFilterChange = (key: keyof DateFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === "all" || value === "none" ? undefined : value 
    }));
  };

  const handleVendorDueFilterChange = (key: keyof VendorDueFilters, value: string) => {
    setVendorDueFilters(prev => ({ 
      ...prev, 
      [key]: value === "all" || value === "none" ? undefined : value 
    }));
  };

  // Export CSV functionality
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const csvContent = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${csvContent}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive vendor insights and compliance reporting
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor (Optional)</Label>
              <Select
                value={filters.vendorId || ""}
                onValueChange={(value) => handleFilterChange('vendorId', value)}
              >
                <SelectTrigger data-testid="select-vendor">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors?.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Period Grouping</Label>
              <Select
                value={filters.period || ""}
                onValueChange={(value) => handleFilterChange('period', value)}
              >
                <SelectTrigger data-testid="select-period">
                  <SelectValue placeholder="No Grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="expense-reports" data-testid="tab-expense-reports">Expense Reports</TabsTrigger>
          <TabsTrigger value="vendor-due-reports" data-testid="tab-vendor-due-reports">Vendor Due Reports</TabsTrigger>
          <TabsTrigger value="top-vendors" data-testid="tab-top-vendors">Top Vendors</TabsTrigger>
          <TabsTrigger value="payment-status" data-testid="tab-payment-status">Payment Status</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">GST/TDS</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {dashboardLoading ? (
            <div className="text-center py-8" data-testid="loading-overview">Loading overview...</div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="metric-total-vendors">
                      {dashboard?.overview?.totalVendors || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="metric-active-vendors">
                      {dashboard?.overview?.activeVendors || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="metric-total-spend">
                      {formatCurrency(dashboard?.overview?.totalSpend || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="metric-pending-payments">
                      {formatCurrency(dashboard?.overview?.pendingPayments || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Payment Cycle</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="metric-avg-payment-cycle">
                      {dashboard?.overview?.avgPaymentCycle || 0} days
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trends Chart */}
              {dashboard?.monthlyTrends?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Spending Trends</CardTitle>
                    <CardDescription>Vendor spend analysis over the last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dashboard.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Line type="monotone" dataKey="totalAmount" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Compliance Alerts */}
              {dashboard?.complianceAlerts?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Compliance Alerts
                    </CardTitle>
                    <CardDescription>Vendors missing PAN/GSTIN information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor Name</TableHead>
                          <TableHead>Total Spend</TableHead>
                          <TableHead>Missing Info</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard.complianceAlerts.map((alert: any) => (
                          <TableRow key={alert.vendorId}>
                            <TableCell>{alert.vendorName}</TableCell>
                            <TableCell>{formatCurrency(alert.totalSpend)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {alert.missingPAN && <Badge variant="destructive">PAN</Badge>}
                                {alert.missingGSTIN && <Badge variant="destructive">GSTIN</Badge>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Expense Reports Tab */}
        <TabsContent value="expense-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor-wise Expense Reports</CardTitle>
              <CardDescription>Detailed expense breakdown by vendor and time period</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseLoading ? (
                <div className="text-center py-8" data-testid="loading-expense-reports">Loading expense reports...</div>
              ) : expenseReports?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {filters.period ? (
                        <>
                          <TableHead>Period</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Claims Count</TableHead>
                          <TableHead>Vendors Count</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseReports.map((report: any, index: number) => (
                      <TableRow key={index}>
                        {filters.period ? (
                          <>
                            <TableCell className="font-medium">{report.period}</TableCell>
                            <TableCell>{formatCurrency(report.totalAmount)}</TableCell>
                            <TableCell>{report.claimCount}</TableCell>
                            <TableCell>{report.vendorCount}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{report.vendorName || 'Unknown'}</TableCell>
                            <TableCell>{report.title}</TableCell>
                            <TableCell>{formatCurrency(parseFloat(report.amount))}</TableCell>
                            <TableCell>
                              <Badge variant={
                                report.status === 'approved' ? 'default' :
                                report.status === 'pending' ? 'secondary' :
                                report.status === 'paid' ? 'outline' : 'destructive'
                              }>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(report.submittedAt).toLocaleDateString('en-GB')}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-expense-reports">
                  No expense reports found for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Due Reports Tab */}
        <TabsContent value="vendor-due-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Vendor Due Reports
              </CardTitle>
              <CardDescription>
                Dynamic reports based on bill types with custom field columns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Vendor Due Reports Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="space-y-2">
                  <Label htmlFor="vendor-due-start-date">Start Date</Label>
                  <Input
                    id="vendor-due-start-date"
                    type="date"
                    value={vendorDueFilters.startDate}
                    onChange={(e) => handleVendorDueFilterChange('startDate', e.target.value)}
                    data-testid="input-vendor-due-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-due-end-date">End Date</Label>
                  <Input
                    id="vendor-due-end-date"
                    type="date"
                    value={vendorDueFilters.endDate}
                    onChange={(e) => handleVendorDueFilterChange('endDate', e.target.value)}
                    data-testid="input-vendor-due-end-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bill-type">Bill Type *</Label>
                  <Select
                    value={vendorDueFilters.billType || ""}
                    onValueChange={(value) => handleVendorDueFilterChange('billType', value)}
                  >
                    <SelectTrigger data-testid="select-bill-type">
                      <SelectValue placeholder="Select Bill Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBillTypes.map((billType) => (
                        <SelectItem key={billType.value} value={billType.value}>
                          <div className="flex items-center gap-2">
                            {billType.label}
                            <Badge variant={billType.isDefault ? "secondary" : "outline"} className="text-xs">
                              {billType.isDefault ? "Default" : "Custom"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-due-vendor">Vendor (Optional)</Label>
                  <Select
                    value={vendorDueFilters.vendorId || ""}
                    onValueChange={(value) => handleVendorDueFilterChange('vendorId', value)}
                  >
                    <SelectTrigger data-testid="select-vendor-due-vendor">
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendors?.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Export Button */}
              {vendorDueReports.length > 0 && (
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={() => exportToCSV(vendorDueReports, `vendor_due_reports_${vendorDueFilters.billType}`)}
                    className="flex items-center gap-2"
                    data-testid="button-export-csv"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              )}

              {/* Dynamic Reports Table */}
              {!vendorDueFilters.billType ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-lg font-medium">Select a Bill Type</p>
                  <p className="text-sm">Choose a bill type above to generate dynamic reports</p>
                </div>
              ) : vendorDueLoading ? (
                <div className="text-center py-8" data-testid="loading-vendor-due-reports">
                  Loading vendor due reports...
                </div>
              ) : vendorDueReports?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Claim Title</TableHead>
                        <TableHead>Amount (₹)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted Date</TableHead>
                        {/* Dynamic columns based on bill type fields */}
                        {(() => {
                          const selectedBillType = availableBillTypes.find(bt => bt.value === vendorDueFilters.billType);
                          if (selectedBillType && !selectedBillType.isDefault && selectedBillType.billType?.fields) {
                            return selectedBillType.billType.fields
                              .filter(field => field.isVisible)
                              .sort((a, b) => a.fieldOrder - b.fieldOrder)
                              .map(field => (
                                <TableHead key={field.id}>
                                  {field.fieldLabel}
                                </TableHead>
                              ));
                          }
                          // For default bill types, show hardcoded fields
                          if (selectedBillType?.value === 'vendor_dues') {
                            return [
                              <TableHead key="agreement_ref">Agreement Ref</TableHead>,
                              <TableHead key="expense_type">Expense Type</TableHead>,
                              <TableHead key="period">Period</TableHead>,
                            ];
                          }
                          if (selectedBillType?.value === 'utility_bill') {
                            return [
                              <TableHead key="account_number">Account Number</TableHead>,
                              <TableHead key="billing_period">Billing Period</TableHead>,
                              <TableHead key="consumption">Consumption Units</TableHead>,
                            ];
                          }
                          return [];
                        })()}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorDueReports.map((report: any, index: number) => (
                        <TableRow key={index} data-testid={`vendor-due-report-${index}`}>
                          <TableCell className="font-medium">{report.vendorName || 'Unknown'}</TableCell>
                          <TableCell>{report.title}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(parseFloat(report.amount))}</TableCell>
                          <TableCell>
                            <Badge variant={
                              report.status === 'approved' ? 'default' :
                              report.status === 'pending' ? 'secondary' :
                              report.status === 'paid' ? 'outline' : 'destructive'
                            }>
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(report.submittedAt).toLocaleDateString('en-GB')}</TableCell>
                          {/* Dynamic field data */}
                          {(() => {
                            const selectedBillType = availableBillTypes.find(bt => bt.value === vendorDueFilters.billType);
                            if (selectedBillType && !selectedBillType.isDefault && selectedBillType.billType?.fields) {
                              return selectedBillType.billType.fields
                                .filter(field => field.isVisible)
                                .sort((a, b) => a.fieldOrder - b.fieldOrder)
                                .map(field => (
                                  <TableCell key={field.id}>
                                    {report.customFields?.[field.fieldName] || '-'}
                                  </TableCell>
                                ));
                            }
                            // For default bill types, show hardcoded field data
                            if (selectedBillType?.value === 'vendor_dues') {
                              return [
                                <TableCell key="agreement_ref">{report.agreementReference || '-'}</TableCell>,
                                <TableCell key="expense_type">{report.expenseType || '-'}</TableCell>,
                                <TableCell key="period">{report.period || '-'}</TableCell>,
                              ];
                            }
                            if (selectedBillType?.value === 'utility_bill') {
                              return [
                                <TableCell key="account_number">{report.accountNumber || '-'}</TableCell>,
                                <TableCell key="billing_period">{report.billingPeriod || '-'}</TableCell>,
                                <TableCell key="consumption">{report.consumptionUnits || '-'}</TableCell>,
                              ];
                            }
                            return [];
                          })()}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-vendor-due-reports">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-lg font-medium">No Reports Found</p>
                  <p className="text-sm">No vendor claims found for the selected bill type and date range</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Vendors Tab */}
        <TabsContent value="top-vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Vendors by Spend</CardTitle>
              <CardDescription>Vendors ranked by total spending amount</CardDescription>
            </CardHeader>
            <CardContent>
              {topVendorsLoading ? (
                <div className="text-center py-8" data-testid="loading-top-vendors">Loading top vendors...</div>
              ) : topVendors?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topVendors.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vendorName" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="totalSpend" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <Table className="mt-6">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Total Spend</TableHead>
                        <TableHead>Claims Count</TableHead>
                        <TableHead>Avg Amount</TableHead>
                        <TableHead>Last Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topVendors.map((vendor: any, index: number) => (
                        <TableRow key={vendor.vendorId}>
                          <TableCell className="font-medium">#{index + 1}</TableCell>
                          <TableCell>{vendor.vendorName || 'Unknown'}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(vendor.totalSpend)}</TableCell>
                          <TableCell>{vendor.claimCount}</TableCell>
                          <TableCell>{formatCurrency(vendor.avgAmount)}</TableCell>
                          <TableCell>
                            {vendor.lastPayment ? new Date(vendor.lastPayment).toLocaleDateString('en-GB') : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-top-vendors">
                  No vendor data found for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Status Tab */}
        <TabsContent value="payment-status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending vs Cleared Invoices</CardTitle>
              <CardDescription>Payment status analysis and outstanding amounts</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="text-center py-8" data-testid="loading-payment-status">Loading payment status...</div>
              ) : pendingAnalysis ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Count</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-amber-600" data-testid="metric-pending-count">
                          {pendingAnalysis.summary?.pendingCount || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-amber-600" data-testid="metric-pending-amount">
                          {formatCurrency(pendingAnalysis.summary?.pendingAmount || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Cleared Count</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600" data-testid="metric-cleared-count">
                          {pendingAnalysis.summary?.clearedCount || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Cleared Amount</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600" data-testid="metric-cleared-amount">
                          {formatCurrency(pendingAnalysis.summary?.clearedAmount || 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pie Chart */}
                  <div className="flex justify-center">
                    <ResponsiveContainer width={400} height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pending', value: pendingAnalysis.summary?.pendingAmount || 0 },
                            { name: 'Cleared', value: pendingAnalysis.summary?.clearedAmount || 0 }
                          ]}
                          cx={200}
                          cy={150}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({value}) => formatCurrency(value)}
                        >
                          <Cell fill="#F59E0B" />
                          <Cell fill="#10B981" />
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pending Invoices Table */}
                  {pendingAnalysis.pending?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Pending Invoices</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingAnalysis.pending.slice(0, 10).map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell>{invoice.vendorName || 'Unknown'}</TableCell>
                              <TableCell>{invoice.title}</TableCell>
                              <TableCell>{formatCurrency(parseFloat(invoice.amount))}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{invoice.status}</Badge>
                              </TableCell>
                              <TableCell>{new Date(invoice.submittedAt).toLocaleDateString('en-GB')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-payment-status">
                  No payment data found for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GST/TDS Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GST/TDS Summary for Compliance</CardTitle>
              <CardDescription>Tax compliance reporting for approved transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {gstTdsLoading ? (
                <div className="text-center py-8" data-testid="loading-compliance">Loading compliance data...</div>
              ) : gstTdsSummary?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>PAN</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>TDS Category</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Estimated GST</TableHead>
                      <TableHead>Estimated TDS</TableHead>
                      <TableHead>Claims</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gstTdsSummary.map((vendor: any) => (
                      <TableRow key={vendor.vendorId}>
                        <TableCell className="font-medium">{vendor.vendorName || 'Unknown'}</TableCell>
                        <TableCell>
                          {vendor.vendorPAN ? (
                            <Badge variant="outline">{vendor.vendorPAN}</Badge>
                          ) : (
                            <Badge variant="destructive">Missing</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {vendor.vendorGSTIN ? (
                            <Badge variant="outline">{vendor.vendorGSTIN}</Badge>
                          ) : (
                            <Badge variant="destructive">Missing</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{vendor.tdsCategory || 'standard'}</Badge>
                        </TableCell>
                        <TableCell className="font-bold">{formatCurrency(vendor.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(vendor.estimatedGST)}</TableCell>
                        <TableCell>{formatCurrency(vendor.estimatedTDS)}</TableCell>
                        <TableCell>{vendor.claimCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-compliance-data">
                  No compliance data found for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </main>
      </div>
    </div>
  );
}