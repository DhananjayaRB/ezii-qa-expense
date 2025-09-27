import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { 
  Building2, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter
} from "lucide-react";

export default function DepartmentReport() {
  const [selectedPeriod, setSelectedPeriod] = useState("current_quarter");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch department data from API
  const { data: departmentData, isLoading } = useQuery({
    queryKey: ['/api/reports/departments', { period: selectedPeriod, department: selectedDepartment }],
  });

  const data = departmentData || {
    departments: [],
    budgetComparison: [],
    categoryBreakdown: [],
    trends: [],
    costCenters: []
  };
  
  // Ensure data properties are arrays for safety
  const safeDepartments = Array.isArray(data.departments) ? data.departments : [];
  const safeCategoryBreakdown = Array.isArray(data.categoryBreakdown) ? data.categoryBreakdown : [];

  // Calculate summary statistics
  const totalBudget = safeDepartments.reduce((sum: number, dept: any) => sum + (dept.allocatedBudget || 0), 0);
  const totalSpent = safeDepartments.reduce((sum: number, dept: any) => sum + (dept.actualSpend || 0), 0);
  const overBudgetDepts = safeDepartments.filter((dept: any) => dept.actualSpend > dept.allocatedBudget).length;
  const avgUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const getBudgetStatus = (spent: number, allocated: number) => {
    const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
    if (utilization > 100) return { color: 'text-red-600', status: 'Over Budget', bgColor: 'bg-red-100 border-red-200' };
    if (utilization > 90) return { color: 'text-orange-600', status: 'Near Limit', bgColor: 'bg-orange-100 border-orange-200' };
    if (utilization > 70) return { color: 'text-yellow-600', status: 'On Track', bgColor: 'bg-yellow-100 border-yellow-200' };
    return { color: 'text-green-600', status: 'Under Budget', bgColor: 'bg-green-100 border-green-200' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-500" />;
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Department Report</h1>
              <p className="text-lg text-gray-600">
                Analysis of expenses by department and cost centers for budget allocation and cost control. 
                Monitor departmental budgets vs. actual spending and optimize resource allocation.
              </p>
            </div>

            {/* Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Budget</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudget)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Actual Spend</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Budget Utilization</p>
                      <p className="text-2xl font-bold text-purple-600">{avgUtilization.toFixed(1)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Over Budget</p>
                      <p className="text-2xl font-bold text-red-600">{overBudgetDepts}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Report Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Period</label>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedPeriod === "current_month" ? "default" : "outline"}
                        onClick={() => setSelectedPeriod("current_month")}
                        data-testid="button-period-current-month"
                      >
                        This Month
                      </Button>
                      <Button
                        variant={selectedPeriod === "current_quarter" ? "default" : "outline"}
                        onClick={() => setSelectedPeriod("current_quarter")}
                        data-testid="button-period-current-quarter"
                      >
                        This Quarter
                      </Button>
                      <Button
                        variant={selectedPeriod === "fiscal_year" ? "default" : "outline"}
                        onClick={() => setSelectedPeriod("fiscal_year")}
                        data-testid="button-period-fiscal-year"
                      >
                        Fiscal Year
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department Focus</label>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedDepartment === "all" ? "default" : "outline"}
                        onClick={() => setSelectedDepartment("all")}
                        data-testid="button-dept-all"
                      >
                        All Departments
                      </Button>
                      <Button
                        variant={selectedDepartment === "over_budget" ? "default" : "outline"}
                        onClick={() => setSelectedDepartment("over_budget")}
                        data-testid="button-dept-over-budget"
                      >
                        Over Budget Only
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-export-department-report">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Departmental Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="budget">Budget vs Actual</TabsTrigger>
                    <TabsTrigger value="categories">Expense Categories</TabsTrigger>
                    <TabsTrigger value="trends">Spending Trends</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        safeDepartments.map((dept: any) => {
                          const budgetStatus = getBudgetStatus(dept.actualSpend, dept.allocatedBudget);
                          const utilization = dept.allocatedBudget > 0 ? (dept.actualSpend / dept.allocatedBudget) * 100 : 0;
                          
                          return (
                            <div key={dept.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900" data-testid={`text-dept-${dept.name}`}>
                                      {dept.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      Head: {dept.head} | Employees: {dept.employeeCount}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg font-bold text-gray-900">
                                      {formatCurrency(dept.actualSpend)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      / {formatCurrency(dept.allocatedBudget)}
                                    </span>
                                  </div>
                                  <Badge 
                                    className={budgetStatus.bgColor}
                                    data-testid={`badge-status-${dept.id}`}
                                  >
                                    {budgetStatus.status}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-gray-700">Budget Utilization</span>
                                  <span className={budgetStatus.color}>{utilization.toFixed(1)}%</span>
                                </div>
                                <Progress 
                                  value={Math.min(utilization, 100)} 
                                  className={`h-2 ${utilization > 100 ? 'bg-red-200' : 'bg-gray-200'}`}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                                <div className="p-2 bg-gray-50 rounded">
                                  <p className="text-xs text-gray-600">Monthly Avg</p>
                                  <p className="font-semibold text-gray-900">
                                    {formatCurrency(dept.monthlyAverage || 0)}
                                  </p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded">
                                  <p className="text-xs text-gray-600">Remaining Budget</p>
                                  <p className={`font-semibold ${dept.allocatedBudget - dept.actualSpend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(dept.allocatedBudget - dept.actualSpend)}
                                  </p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded">
                                  <p className="text-xs text-gray-600">Claims Count</p>
                                  <p className="font-semibold text-gray-900">{dept.claimsCount || 0}</p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded flex items-center justify-center gap-1">
                                  <p className="text-xs text-gray-600">Trend</p>
                                  {getTrendIcon(dept.trend)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      
                      {(!data.departments || data.departments.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No department data found for the selected period</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="budget" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Budget vs Actual Comparison</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">Budget Performance Summary</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-gray-600">Total Allocated Budget</span>
                              <span className="font-semibold">{formatCurrency(totalBudget)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-gray-600">Total Actual Spend</span>
                              <span className="font-semibold">{formatCurrency(totalSpent)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-gray-600">Remaining Budget</span>
                              <span className={`font-semibold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(totalBudget - totalSpent)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 font-bold text-lg">
                              <span>Overall Utilization</span>
                              <span className={avgUtilization > 100 ? 'text-red-600' : 'text-blue-600'}>
                                {avgUtilization.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">Department Risk Analysis</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">Over Budget: {overBudgetDepts} departments</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">
                                Near Limit (90%+): {safeDepartments.filter((d: any) => {
                                  const util = d.allocatedBudget > 0 ? (d.actualSpend / d.allocatedBudget) * 100 : 0;
                                  return util > 90 && util <= 100;
                                }).length} departments
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">
                                Under Budget: {safeDepartments.filter((d: any) => {
                                  const util = d.allocatedBudget > 0 ? (d.actualSpend / d.allocatedBudget) * 100 : 0;
                                  return util < 70;
                                }).length} departments
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="categories" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Expense Category Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safeCategoryBreakdown.map((category: any) => (
                          <Card key={category.category} className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <PieChart className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900" data-testid={`text-category-${category.category}`}>
                                  {category.category}
                                </h4>
                                <p className="text-sm text-gray-600">{category.transactionCount} transactions</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(category.amount)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {((category.amount / totalSpent) * 100).toFixed(1)}% of total spend
                              </p>
                            </div>
                          </Card>
                        ))}
                        
                        {safeCategoryBreakdown.length === 0 && (
                          <div className="col-span-full text-center py-8 text-gray-500">
                            <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No category breakdown data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="trends" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Departmental Spending Trends</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">Cost Reduction</h4>
                          </div>
                          <p className="text-sm text-green-700 mb-1">
                            3 departments have reduced spending by 15% this quarter
                          </p>
                          <p className="text-xs text-green-600">
                            Identified efficiency improvements and cost-saving measures
                          </p>
                        </div>
                        
                        <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                            <h4 className="font-semibold text-orange-800">Increased Spending</h4>
                          </div>
                          <p className="text-sm text-orange-700 mb-1">
                            2 departments showing 20% increase in monthly spend
                          </p>
                          <p className="text-xs text-orange-600">
                            Review budget allocation and spending justification required
                          </p>
                        </div>
                        
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Stable Performance</h4>
                          </div>
                          <p className="text-sm text-blue-700 mb-1">
                            5 departments maintaining consistent spending patterns
                          </p>
                          <p className="text-xs text-blue-600">
                            Good budget discipline and predictable expense management
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