import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { 
  BarChart3, 
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Download,
  Filter
} from "lucide-react";

export default function ControlReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Fetch control data from API
  const { data: controlData, isLoading } = useQuery({
    queryKey: ['/api/reports/control', { period: selectedPeriod, department: selectedDepartment }],
  });

  const data = controlData || {
    spendingLimits: [],
    budgetAdherence: [],
    policyViolations: [],
    anomalies: [],
    approvalFlow: []
  };
  
  // Ensure data properties are arrays for safety
  const safeBudgetAdherence = Array.isArray(data.budgetAdherence) ? data.budgetAdherence : [];
  const safePolicyViolations = Array.isArray(data.policyViolations) ? data.policyViolations : [];
  const safeAnomalies = Array.isArray(data.anomalies) ? data.anomalies : [];
  const safeApprovalFlow = Array.isArray(data.approvalFlow) ? data.approvalFlow : [];

  // Calculate summary metrics
  const metrics = {
    totalBudget: safeBudgetAdherence.reduce((sum: number, dept: any) => sum + dept.allocated, 0),
    totalSpent: safeBudgetAdherence.reduce((sum: number, dept: any) => sum + dept.spent, 0),
    policyViolations: safePolicyViolations.length,
    criticalAnomalies: safeAnomalies.filter((a: any) => a.severity === 'critical').length,
    pendingApprovals: safeApprovalFlow.filter((a: any) => a.status === 'pending').length
  };

  const budgetUtilization = metrics.totalBudget > 0 ? (metrics.totalSpent / metrics.totalBudget) * 100 : 0;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Control Reports</h1>
              <p className="text-lg text-gray-600">
                Management controls, spending limits, budget adherence, and policy enforcement insights. 
                Maintain oversight and governance on overall expense processes.
              </p>
            </div>

            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Budget Utilized</p>
                      <p className="text-2xl font-bold text-blue-600">{budgetUtilization.toFixed(1)}%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalSpent)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Policy Violations</p>
                      <p className="text-2xl font-bold text-red-600">{metrics.policyViolations}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Critical Anomalies</p>
                      <p className="text-2xl font-bold text-orange-600">{metrics.criticalAnomalies}</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                      <p className="text-2xl font-bold text-purple-600">{metrics.pendingApprovals}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedPeriod === "current_month" ? "default" : "outline"}
                        onClick={() => setSelectedPeriod("current_month")}
                        data-testid="button-period-current-month"
                      >
                        This Month
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
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedDepartment === "all" ? "default" : "outline"}
                        onClick={() => setSelectedDepartment("all")}
                        data-testid="button-dept-all"
                      >
                        All Departments
                      </Button>
                      <Button
                        variant={selectedDepartment === "high_risk" ? "default" : "outline"}
                        onClick={() => setSelectedDepartment("high_risk")}
                        data-testid="button-dept-high-risk"
                      >
                        High Risk Only
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-export-control-report">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Adherence */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Adherence by Department</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {safeBudgetAdherence.map((dept: any) => {
                      const utilization = dept.allocated > 0 ? (dept.spent / dept.allocated) * 100 : 0;
                      const isOverBudget = utilization > 100;
                      
                      return (
                        <div key={dept.department} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900" data-testid={`text-dept-${dept.department}`}>
                              {dept.department}
                            </h3>
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                {formatCurrency(dept.spent)} / {formatCurrency(dept.allocated)}
                              </p>
                              <Badge 
                                className={isOverBudget ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                                data-testid={`badge-budget-${dept.department}`}
                              >
                                {utilization.toFixed(1)}% utilized
                              </Badge>
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(utilization, 100)} 
                            className={`h-2 ${isOverBudget ? 'bg-red-200' : 'bg-gray-200'}`}
                          />
                          {isOverBudget && (
                            <p className="text-sm text-red-600 mt-1">
                              Over budget by {formatCurrency(dept.spent - dept.allocated)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Policy Violations */}
            <Card>
              <CardHeader>
                <CardTitle>Policy Violations & Anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {safePolicyViolations.map((violation: any) => (
                    <div key={violation.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h3 className="font-semibold text-red-900" data-testid={`text-violation-${violation.id}`}>
                              {violation.type}
                            </h3>
                            <Badge className={getSeverityColor(violation.severity)}>
                              {violation.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-red-800 mb-1">
                            Employee: {violation.employeeName} ({violation.department})
                          </p>
                          <p className="text-sm text-red-700">
                            {violation.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-900">
                            {formatCurrency(violation.amount)}
                          </p>
                          <p className="text-sm text-red-700">
                            {formatDateDisplay(violation.detectedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {safePolicyViolations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No policy violations detected in the selected period</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Management Control Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Management Control Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Spending Trends</h4>
                    </div>
                    <p className="text-sm text-blue-700 mb-1">
                      Monthly spending has increased by 12% compared to last quarter
                    </p>
                    <p className="text-xs text-blue-600">
                      Action: Review department budgets and approve additional allocation if needed
                    </p>
                  </div>
                  
                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-800">Risk Areas</h4>
                    </div>
                    <p className="text-sm text-orange-700 mb-1">
                      3 departments are approaching their budget limits
                    </p>
                    <p className="text-xs text-orange-600">
                      Action: Implement additional approval layers for high-value expenses
                    </p>
                  </div>
                  
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">Compliance Score</h4>
                    </div>
                    <p className="text-sm text-green-700 mb-1">
                      Overall policy compliance is at 94%, exceeding target
                    </p>
                    <p className="text-xs text-green-600">
                      Status: Excellent control environment maintained
                    </p>
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