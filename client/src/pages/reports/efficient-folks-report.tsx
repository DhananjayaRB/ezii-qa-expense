import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { 
  Users, 
  Star,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Calendar,
  Download,
  Search,
  Filter
} from "lucide-react";

export default function EfficientFolksReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("efficiency_score");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Fetch efficiency data from API
  const { data: efficiencyData, isLoading } = useQuery({
    queryKey: ['/api/reports/efficiency', { search: searchTerm, sort: sortBy, department: selectedDepartment }],
  });

  const employees = efficiencyData?.employees || [];
  const departments = efficiencyData?.departments || [];
  
  // Ensure data is safe for access  
  const safeEmployees = Array.isArray(efficiencyData?.employees) ? efficiencyData.employees : [];
  const safeDepartments = Array.isArray(efficiencyData?.departments) ? efficiencyData.departments : [];

  const filteredEmployees = safeEmployees.filter((emp: any) => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDepartment === "all" || emp.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  // Calculate summary stats
  const stats = {
    totalEmployees: safeEmployees.length,
    highPerformers: safeEmployees.filter((e: any) => e.efficiencyScore >= 90).length,
    avgClaimTime: safeEmployees.reduce((sum: number, e: any) => sum + (e.avgClaimProcessingDays || 0), 0) / (safeEmployees.length || 1),
    onTimeSubmissions: safeEmployees.reduce((sum: number, e: any) => sum + (e.onTimeSubmissionRate || 0), 0) / (safeEmployees.length || 1)
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Average';
    return 'Needs Improvement';
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Efficient Folks Report</h1>
              <p className="text-lg text-gray-600">
                Track efficiency and performance of employees in expense management. 
                Monitor timeliness, accuracy, compliance, and claim approval cycles.
              </p>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Employees</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">High Performers</p>
                      <p className="text-2xl font-bold text-green-600">{stats.highPerformers}</p>
                    </div>
                    <Star className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Claim Time</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.avgClaimTime.toFixed(1)} days</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.onTimeSubmissions.toFixed(1)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
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
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by employee name or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-employees"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedDepartment === "all" ? "default" : "outline"}
                      onClick={() => setSelectedDepartment("all")}
                      data-testid="button-dept-all"
                    >
                      All Departments
                    </Button>
                    {departments.map((dept: string) => (
                      <Button
                        key={dept}
                        variant={selectedDepartment === dept ? "default" : "outline"}
                        onClick={() => setSelectedDepartment(dept)}
                        data-testid={`button-dept-${dept.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {dept}
                      </Button>
                    ))}
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700" data-testid="button-export-efficiency">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Employee Efficiency Rankings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Employee Efficiency Rankings</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={sortBy === "efficiency_score" ? "default" : "outline"}
                      onClick={() => setSortBy("efficiency_score")}
                      data-testid="button-sort-efficiency"
                    >
                      By Efficiency
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === "avg_processing_time" ? "default" : "outline"}
                      onClick={() => setSortBy("avg_processing_time")}
                      data-testid="button-sort-processing-time"
                    >
                      By Speed
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === "compliance_rate" ? "default" : "outline"}
                      onClick={() => setSortBy("compliance_rate")}
                      data-testid="button-sort-compliance"
                    >
                      By Compliance
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEmployees.map((employee: any, index: number) => (
                      <div key={employee.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                              <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900" data-testid={`text-employee-${employee.id}`}>
                                {employee.name}
                              </h3>
                              <p className="text-sm text-gray-600">{employee.department} | {employee.designation}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-2xl font-bold ${getEfficiencyColor(employee.efficiencyScore)}`}>
                                {employee.efficiencyScore}%
                              </span>
                              {employee.efficiencyScore >= 90 && <Award className="w-5 h-5 text-yellow-500" />}
                            </div>
                            <Badge 
                              className={getEfficiencyBadge(employee.efficiencyScore)}
                              data-testid={`badge-efficiency-${employee.id}`}
                            >
                              {getPerformanceLevel(employee.efficiencyScore)}
                            </Badge>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Avg Processing</span>
                            </div>
                            <p className="text-lg font-bold text-blue-900">
                              {employee.avgClaimProcessingDays || 0} days
                            </p>
                          </div>
                          
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Compliance</span>
                            </div>
                            <p className="text-lg font-bold text-green-900">
                              {employee.complianceRate || 0}%
                            </p>
                          </div>
                          
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Target className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">On-Time Rate</span>
                            </div>
                            <p className="text-lg font-bold text-orange-900">
                              {employee.onTimeSubmissionRate || 0}%
                            </p>
                          </div>
                          
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-800">Total Claims</span>
                            </div>
                            <p className="text-lg font-bold text-purple-900">
                              {employee.totalClaims || 0}
                            </p>
                          </div>
                        </div>

                        {/* Performance Breakdown */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">Claim Processing Efficiency</span>
                            <span className="text-gray-600">{employee.processingEfficiency || 0}%</span>
                          </div>
                          <Progress value={employee.processingEfficiency || 0} className="h-2" />
                        </div>

                        {employee.recentAchievements && employee.recentAchievements.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2">Recent Achievements:</p>
                            <div className="flex flex-wrap gap-2">
                              {employee.recentAchievements.map((achievement: string, achIndex: number) => (
                                <Badge key={achIndex} variant="outline" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  {achievement}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredEmployees.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No employees found matching your criteria</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">Top Performers</h4>
                    </div>
                    <p className="text-sm text-green-700 mb-2">
                      {stats.highPerformers} employees are performing excellently (90%+ efficiency)
                    </p>
                    <p className="text-xs text-green-600">
                      Recommendation: Consider these employees for performance-based rewards or mentorship roles
                    </p>
                  </div>
                  
                  <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-800">Processing Time</h4>
                    </div>
                    <p className="text-sm text-yellow-700 mb-2">
                      Average claim processing time is {stats.avgClaimTime.toFixed(1)} days
                    </p>
                    <p className="text-xs text-yellow-600">
                      Target: Reduce to under 3 days through training and process optimization
                    </p>
                  </div>
                  
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Compliance Rate</h4>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      Overall on-time submission rate is {stats.onTimeSubmissions.toFixed(1)}%
                    </p>
                    <p className="text-xs text-blue-600">
                      Focus on improving submission deadlines through reminders and training
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