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
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  Target,
  Download,
  Filter
} from "lucide-react";

export default function ComplianceReport() {
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch compliance data from API
  const { data: complianceData, isLoading } = useQuery({
    queryKey: ['/api/reports/compliance', { period: selectedPeriod, filter: complianceFilter }],
  });

  const data = complianceData || {
    policyViolations: [],
    complianceMetrics: {},
    employeeCompliance: [],
    policyRules: [],
    exceptions: [],
    auditFindings: []
  };

  // Ensure data properties are arrays for safety
  const safePolicyViolations = Array.isArray(data.policyViolations) ? data.policyViolations : [];
  const safeEmployeeCompliance = Array.isArray(data.employeeCompliance) ? data.employeeCompliance : [];
  const safePolicyRules = Array.isArray(data.policyRules) ? data.policyRules : [];
  const safeExceptions = Array.isArray(data.exceptions) ? data.exceptions : [];
  const safeAuditFindings = Array.isArray(data.auditFindings) ? data.auditFindings : [];
  const safeComplianceMetrics = data.complianceMetrics || {};

  // Calculate compliance statistics
  const stats = {
    totalViolations: safePolicyViolations.length,
    criticalViolations: safePolicyViolations.filter((v: any) => v.severity === 'critical').length,
    totalEmployees: safeEmployeeCompliance.length,
    compliantEmployees: safeEmployeeCompliance.filter((e: any) => e.complianceScore >= 90).length,
    overallComplianceRate: safeComplianceMetrics.overallRate || 0,
    policyAdherence: safeComplianceMetrics.policyAdherence || 0,
    avgViolationResolutionTime: safeComplianceMetrics.avgResolutionTime || 0,
    activeExceptions: safeExceptions.filter((e: any) => e.status === 'active').length
  };

  const getViolationSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Poor';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Report</h1>
              <p className="text-lg text-gray-600">
                Track adherence to company expense policies and highlight exceptions/violations. 
                Ensure employees follow policies and reduce audit compliance risks.
              </p>
            </div>

            {/* Compliance Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overall Compliance</p>
                      <p className="text-2xl font-bold text-green-600">{stats.overallComplianceRate}%</p>
                    </div>
                    <Shield className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Policy Violations</p>
                      <p className="text-2xl font-bold text-red-600">{stats.totalViolations}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.criticalViolations}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Exceptions</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.activeExceptions}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-500" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Focus</label>
                    <div className="flex gap-2">
                      <Button
                        variant={complianceFilter === "all" ? "default" : "outline"}
                        onClick={() => setComplianceFilter("all")}
                        data-testid="button-filter-all"
                      >
                        All Issues
                      </Button>
                      <Button
                        variant={complianceFilter === "critical" ? "default" : "outline"}
                        onClick={() => setComplianceFilter("critical")}
                        data-testid="button-filter-critical"
                      >
                        Critical Only
                      </Button>
                      <Button
                        variant={complianceFilter === "unresolved" ? "default" : "outline"}
                        onClick={() => setComplianceFilter("unresolved")}
                        data-testid="button-filter-unresolved"
                      >
                        Unresolved
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-export-compliance">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Compliance Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="violations">Policy Violations</TabsTrigger>
                    <TabsTrigger value="employees">Employee Compliance</TabsTrigger>
                    <TabsTrigger value="trends">Compliance Trends</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Compliance Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">Policy Adherence Breakdown</h4>
                          <div className="space-y-3">
                            {safePolicyRules.map((rule: any) => (
                              <div key={rule.id} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-gray-700" data-testid={`text-policy-${rule.id}`}>
                                    {rule.name}
                                  </span>
                                  <span className={rule.adherenceRate >= 90 ? 'text-green-600' : rule.adherenceRate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                                    {rule.adherenceRate}%
                                  </span>
                                </div>
                                <Progress 
                                  value={rule.adherenceRate} 
                                  className={`h-2 ${rule.adherenceRate >= 90 ? 'bg-green-200' : rule.adherenceRate >= 70 ? 'bg-yellow-200' : 'bg-red-200'}`}
                                />
                              </div>
                            ))}
                            
                            {safePolicyRules.length === 0 && (
                              <div className="text-center py-4 text-gray-500">
                                <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No policy rules data available</p>
                              </div>
                            )}
                          </div>
                        </Card>

                        <Card className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">Compliance Health Score</h4>
                          <div className="text-center mb-4">
                            <div className={`text-5xl font-bold ${getComplianceScoreColor(stats.overallComplianceRate)} mb-2`}>
                              {stats.overallComplianceRate}%
                            </div>
                            <Badge className={stats.overallComplianceRate >= 90 ? 'bg-green-100 text-green-800' : stats.overallComplianceRate >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                              {getComplianceLevel(stats.overallComplianceRate)}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Compliant Employees</span>
                              <span className="font-semibold">{stats.compliantEmployees}/{stats.totalEmployees}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Resolution Time</span>
                              <span className="font-semibold">{stats.avgViolationResolutionTime} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Policy Adherence</span>
                              <span className="font-semibold">{stats.policyAdherence}%</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="violations" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Policy Violations</h3>
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {safePolicyViolations.map((violation: any) => (
                            <div key={violation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getSeverityIcon(violation.severity)}
                                    <h4 className="font-semibold text-gray-900" data-testid={`text-violation-${violation.id}`}>
                                      {violation.policyRule}
                                    </h4>
                                    <Badge className={getViolationSeverityColor(violation.severity)}>
                                      {violation.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    Employee: {violation.employeeName} ({violation.department})
                                  </p>
                                  <p className="text-sm text-gray-600 mb-2">
                                    Detected: {formatDateDisplay(violation.detectedAt)}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {violation.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-lg text-gray-900">
                                    {formatCurrency(violation.amount)}
                                  </p>
                                  <Badge 
                                    className={violation.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                    data-testid={`badge-status-${violation.id}`}
                                  >
                                    {violation.status}
                                  </Badge>
                                </div>
                              </div>

                              {violation.status === 'unresolved' && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm font-medium text-yellow-800">Action Required</span>
                                  </div>
                                  <p className="text-sm text-yellow-700">
                                    This violation has been open for {violation.daysOpen} days. 
                                    {violation.assignedTo && ` Assigned to: ${violation.assignedTo}`}
                                  </p>
                                </div>
                              )}

                              {violation.correctiveAction && (
                                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-sm text-blue-800">
                                    <strong>Corrective Action:</strong> {violation.correctiveAction}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {safePolicyViolations.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>No policy violations found for the selected period</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="employees" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Employee Compliance Scores</h3>
                      <div className="space-y-4">
                        {safeEmployeeCompliance.map((employee: any) => (
                          <div key={employee.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900" data-testid={`text-employee-${employee.id}`}>
                                    {employee.name}
                                  </h4>
                                  <p className="text-sm text-gray-600">{employee.department} | {employee.designation}</p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${getComplianceScoreColor(employee.complianceScore)} mb-1`}>
                                  {employee.complianceScore}%
                                </div>
                                <Badge className={employee.complianceScore >= 90 ? 'bg-green-100 text-green-800' : employee.complianceScore >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                  {getComplianceLevel(employee.complianceScore)}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600">Total Claims</p>
                                <p className="font-semibold text-gray-900">{employee.totalClaims || 0}</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600">Violations</p>
                                <p className="font-semibold text-red-600">{employee.violationCount || 0}</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600">On-Time Rate</p>
                                <p className="font-semibold text-blue-600">{employee.onTimeRate || 0}%</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600">Documentation</p>
                                <p className="font-semibold text-green-600">{employee.documentationRate || 0}%</p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700">Compliance Score</span>
                                <span className={getComplianceScoreColor(employee.complianceScore)}>{employee.complianceScore}%</span>
                              </div>
                              <Progress 
                                value={employee.complianceScore} 
                                className={`h-2 ${employee.complianceScore >= 90 ? 'bg-green-200' : employee.complianceScore >= 70 ? 'bg-yellow-200' : 'bg-red-200'}`}
                              />
                            </div>
                          </div>
                        ))}
                        
                        {safeEmployeeCompliance.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No employee compliance data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="trends" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Compliance Trends & Insights</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">Positive Trends</h4>
                          </div>
                          <p className="text-sm text-green-700 mb-1">
                            Overall compliance has improved by 8% this quarter
                          </p>
                          <p className="text-xs text-green-600">
                            Employee training programs and policy updates are showing positive results
                          </p>
                        </div>
                        
                        <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <h4 className="font-semibold text-orange-800">Areas of Concern</h4>
                          </div>
                          <p className="text-sm text-orange-700 mb-1">
                            {stats.criticalViolations} critical violations require immediate attention
                          </p>
                          <p className="text-xs text-orange-600">
                            Focus on receipt documentation and expense limit adherence
                          </p>
                        </div>
                        
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Recommendations</h4>
                          </div>
                          <p className="text-sm text-blue-700 mb-1">
                            Implement automated policy checking to prevent violations
                          </p>
                          <p className="text-xs text-blue-600">
                            Consider policy revision for frequently violated rules
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