import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, BarChart3, Users, FileText, Wrench, CheckCircle, XCircle, Clock, Plus, Download, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("approvals");
  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(false);
  const [loadedReportData, setLoadedReportData] = useState<any>(null);
  const [savedReportResults, setSavedReportResults] = useState<any>(null);

  // ALL HOOKS MUST BE AT THE TOP - MOVED useMutation TO TOP
  // Fetch pending requests for approval
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/expense-requests"],
    retry: false,
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Fetch saved reports
  const { data: savedReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/custom-reports"],
    retry: false,
    enabled: isAuthenticated && activeTab === "reports", // Only fetch when on reports tab
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) => {
      await apiRequest("PATCH", `/api/expense-requests/${requestId}/approve`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Request updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    },
  });


  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await apiRequest("DELETE", `/api/custom-reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-reports"] });
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete report error:", error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    },
  });

  // Load report mutation - executes the saved report directly
  const loadReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      // First get the saved report details
      const reportResponse = await apiRequest("GET", `/api/custom-reports/${reportId}`);
      const report = await reportResponse.json();
      
      // Check if report has columns saved
      if (!report.selectedColumns || report.selectedColumns.length === 0) {
        throw new Error(`Report "${report.name}" has no columns saved. Please recreate this report with columns selected.`);
      }
      
      // Then execute the report using the saved parameters  
      const executeResponse = await apiRequest("POST", "/api/report-builder/generate", {
        tableName: report.process, // Use tableName instead of process
        columns: report.selectedColumns,
        filters: (report.filters && typeof report.filters === 'object') ? report.filters : {}
      });
      const results = await executeResponse.json();
      
      return { report, results };
    },
    onSuccess: ({ report, results }) => {
      // Show saved report results directly without opening builder
      setSavedReportResults({
        reportName: report.name,
        reportData: results
      });
      setActiveTab("reports"); // Stay on saved reports tab
      toast({
        title: "Success",
        description: `Report "${report.name}" executed successfully`,
      });
    },
    onError: (error) => {
      console.error("Load report error:", error);
      toast({
        title: "Error",
        description: "Failed to execute report",
        variant: "destructive",
      });
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  // REMOVED ROLE FILTERING FOR DEVELOPMENT - All users can access all pages

  const adminSections = [
    {
      title: "Configuration",
      description: "Set up user roles, expense categories, and approval workflows",
      icon: Settings,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Update Tally",
      description: "Export expense data for Tally accounting software integration",
      icon: Database,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "App Usage Report",
      description: "Statistics on application usage and performance metrics",
      icon: BarChart3,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      icon: Users,
      color: "bg-red-100 text-red-600",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "travel":
        return "Travel";
      case "cash_advance":
        return "Cash Advance";
      case "advance_payment":
        return "Advance Payment";
      default:
        return type;
    }
  };

  return (
    <>
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8" data-testid="admin-title">
              {user?.role === "admin" ? "Admin Panel" : "Accountant Panel"}
            </h1>

            {/* Tab Navigation */}
            <div className="mb-6">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab("approvals")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "approvals"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  data-testid="tab-approvals"
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Pending Approvals
                  {Array.isArray(pendingRequests) && pendingRequests.filter((r: any) => r.status === "pending").length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {Array.isArray(pendingRequests) ? pendingRequests.filter((r: any) => r.status === "pending").length : 0}
                    </Badge>
                  )}
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => setActiveTab("config")}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      activeTab === "config"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    data-testid="tab-config"
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Configuration
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "reports"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  data-testid="tab-reports"
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Custom Reports
                </button>
              </nav>
            </div>

            {/* Pending Approvals Tab */}
            {activeTab === "approvals" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Advance Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requestsLoading ? (
                      <div className="text-center py-8">Loading requests...</div>
                    ) : Array.isArray(pendingRequests) && pendingRequests.length > 0 ? (
                      <div className="space-y-4">
                        {Array.isArray(pendingRequests) && pendingRequests
                          .filter((request: any) => request.status === "pending")
                          .map((request: any) => (
                            <div
                              key={request.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                              data-testid={`pending-request-${request.id}`}
                            >
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {request.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {request.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge variant="outline">
                                    {getTypeLabel(request.type)}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    Amount: ₹{request.estimatedAmount?.toLocaleString()}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    Requested: {new Date(request.createdAt).toLocaleDateString('en-GB')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() =>
                                    approveRequestMutation.mutate({
                                      requestId: request.id,
                                      action: "approve",
                                    })
                                  }
                                  disabled={approveRequestMutation.isPending}
                                  data-testid={`approve-request-${request.id}`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    approveRequestMutation.mutate({
                                      requestId: request.id,
                                      action: "reject",
                                    })
                                  }
                                  disabled={approveRequestMutation.isPending}
                                  data-testid={`reject-request-${request.id}`}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No pending requests to approve
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Configuration Tab (Admin only) */}
            {activeTab === "config" && user?.role === "admin" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminSections.map((section, index) => {
                  const IconComponent = section.icon;
                  return (
                    <Card
                      key={index}
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      data-testid={`admin-section-${index}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${section.color}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {section.title}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Saved Reports Tab */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Custom Reports</h2>
                  <Button 
                    onClick={() => setIsReportBuilderOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-create-report"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Report
                  </Button>
                </div>

                {reportsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading reports...</div>
                ) : Array.isArray(savedReports) && savedReports.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedReports.map((report: any) => (
                      <Card 
                        key={report.id}
                        className="p-6 hover:shadow-lg transition-shadow"
                        data-testid={`report-card-${report.id}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                                {report.name}
                              </CardTitle>
                              {report.description && (
                                <p className="text-sm text-gray-600 mb-3">
                                  {report.description}
                                </p>
                              )}
                            </div>
                            <Badge 
                              variant={report.visibility === 'shared' ? 'default' : 'secondary'}
                              className="ml-2"
                            >
                              {report.visibility === 'shared' ? 'Shared' : 'Private'}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Process:</span> {report.process}
                            </div>
                            <div>
                              <span className="font-medium">Columns:</span> {report.selectedColumns?.length || 0} selected
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {new Date(report.createdAt).toLocaleDateString('en-GB')}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="default"
                              size="sm"
                              onClick={() => loadReportMutation.mutate(report.id)}
                              disabled={loadReportMutation.isPending}
                              className="flex-1"
                              data-testid={`button-load-report-${report.id}`}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              {loadReportMutation.isPending ? "Loading..." : "Run Report"}
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
                                  deleteReportMutation.mutate(report.id);
                                }
                              }}
                              disabled={deleteReportMutation.isPending}
                              className="text-red-600 hover:bg-red-50"
                              data-testid={`button-delete-report-${report.id}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Reports</h3>
                      <p className="text-gray-600 mb-4">
                        Create your first custom report to get started
                      </p>
                      <Button 
                        onClick={() => setIsReportBuilderOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-create-first-report"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Report
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Saved Report Results View */}
                {savedReportResults && (
                  <div className="mt-8">
                    <div className="bg-white border rounded-lg shadow-sm">
                      <div className="p-4 border-b bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-lg">{savedReportResults.reportData.tableName}</h3>
                            <p className="text-sm text-gray-600">
                              {savedReportResults.reportData.totalRecords} records found
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                // Export CSV for saved report
                                const exportColumns = savedReportResults.reportData.columns;
                                const headers = exportColumns.join(',');
                                const csvContent = [
                                  headers,
                                  ...savedReportResults.reportData.data.map((row: any) => 
                                    exportColumns.map((col: string) => {
                                      const value = row[col];
                                      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                                    }).join(',')
                                  )
                                ].join('\n');
                                
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${savedReportResults.reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.csv`;
                                a.click();
                                window.URL.revokeObjectURL(url);
                              }}
                              variant="outline"
                              size="sm"
                              className="border-green-500 text-green-600 hover:bg-green-50"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export CSV
                            </Button>
                            <Button 
                              onClick={() => setSavedReportResults(null)}
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Close
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {savedReportResults.reportData.data && savedReportResults.reportData.data.length > 0 ? (
                        <div className="overflow-x-auto max-h-96">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                {savedReportResults.reportData.columns.map((col: string, index: number) => (
                                  <th key={index} className="px-4 py-3 text-left font-medium text-gray-900 border-b">
                                    {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {savedReportResults.reportData.data.map((row: any, rowIndex: number) => (
                                <tr key={rowIndex} className="hover:bg-gray-50 border-b">
                                  {savedReportResults.reportData.columns.map((col: string, colIndex: number) => (
                                    <td key={colIndex} className="px-4 py-3 text-gray-900">
                                      {row[col] || 'N/A'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          No data available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Report Builder Dialog */}
            <ReportBuilderDialog 
              isOpen={isReportBuilderOpen} 
              onClose={() => {
                setIsReportBuilderOpen(false);
                setLoadedReportData(null); // Clear loaded data when closing
              }}
              loadedReport={loadedReportData}
            />
          </div>
        </main>
      </div>
    </div>

    </>
  );
}

// Report Builder Dialog Component
interface ReportBuilderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  loadedReport?: any; // Loaded report configuration to populate the builder
}

function ReportBuilderDialog({ isOpen, onClose, loadedReport }: ReportBuilderDialogProps) {
  const { toast } = useToast();
  const [selectedProcess, setSelectedProcess] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [filters, setFilters] = useState<Array<{id: string, field: string, value: string}>>([]);
  const [columns, setColumns] = useState<Array<{id: string, field: string, label: string}>>([]);
  const [filterName, setFilterName] = useState<string>("");
  const [reportName, setReportName] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResults, setReportResults] = useState<any>(null);
  
  // Save modal state
  const [saveReportOpen, setSaveReportOpen] = useState(false);
  const [saveReportName, setSaveReportName] = useState("");
  const [saveReportDescription, setSaveReportDescription] = useState("");
  const [saveReportVisibility, setSaveReportVisibility] = useState("private");

  // Save report mutation
  const saveReportMutation = useMutation({
    mutationFn: async (reportData: {
      name: string;
      description: string;
      process: string;
      selectedColumns: string[];
      filters: any;
      visibility: string;
    }) => {
      const response = await apiRequest("POST", "/api/custom-reports", reportData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-reports"] });
      toast({
        title: "Success",
        description: "Report saved successfully",
      });
      setSaveReportOpen(false);
      setSaveReportName("");
      setSaveReportDescription("");
      setSaveReportVisibility("private");
    },
    onError: (error) => {
      console.error("Save report error:", error);
      toast({
        title: "Error",
        description: "Failed to save report",
        variant: "destructive",
      });
    },
  });
  
  // Populate state when loaded report is provided
  useEffect(() => {
    if (loadedReport && isOpen) {
      setSelectedProcess(loadedReport.process || "");
      setSelectedPeriod(loadedReport.filters?.period || "");
      setReportName(loadedReport.name || "");
      
      // Convert JSON columns back to the expected format
      if (loadedReport.columns && Array.isArray(loadedReport.columns)) {
        const columnsFormatted = loadedReport.columns.map((col: string) => ({
          id: col,
          field: col,
          label: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')
        }));
        setColumns(columnsFormatted);
      }
      
      // If results are available, display them immediately
      if (loadedReport.results) {
        console.log("🔍 Frontend: Setting report results:", loadedReport.results);
        console.log("🔍 Frontend: Results structure:", {
          tableName: loadedReport.results.tableName,
          columns: loadedReport.results.columns,
          dataLength: loadedReport.results.data?.length,
          sampleData: loadedReport.results.data?.[0]
        });
        setReportResults(loadedReport.results);
      }
    }
  }, [loadedReport, isOpen]);
  
  // Fetch available processes from processMaster
  const { data: processes = [] } = useQuery<Array<{processType: string, displayName: string}>>({
    queryKey: ["/api/process-master"]
  });

  // Fetch available fields for the selected process
  const { data: availableFields = [] } = useQuery<Array<{value: string, label: string, type: string}>>({
    queryKey: [`/api/report-builder/fields/${selectedProcess}`],
    enabled: !!selectedProcess
  });

  // Auto-add employee profile fields as default columns when process changes
  useEffect(() => {
    if (selectedProcess && availableFields.length > 0) {
      const employeeProfileFields = [
        { field: 'employerName', label: 'Employee Initiated' },
        { field: 'employeeNumber', label: 'Employee Number' },
        { field: 'employeeEmail', label: 'Email' }
      ];
      
      // Check if employee profile fields are available and not already added
      const fieldsToAdd = employeeProfileFields.filter(profileField => {
        const isFieldAvailable = availableFields.some((f: any) => f.value === profileField.field);
        const isFieldAlreadyAdded = columns.some(c => c.field === profileField.field);
        return isFieldAvailable && !isFieldAlreadyAdded;
      });
      
      if (fieldsToAdd.length > 0) {
        const newDefaultColumns = fieldsToAdd.map(field => ({
          id: `default-${field.field}`,
          field: field.field,
          label: field.label
        }));
        
        // Add employee profile fields at the beginning of the columns array
        setColumns(prevColumns => [...newDefaultColumns, ...prevColumns]);
      }
    }
  }, [selectedProcess, availableFields]);
  
  const periods = [
    { value: "all", label: "All Time" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "thisQuarter", label: "This Quarter" },
    { value: "thisYear", label: "This Year" }
  ];
  
  const addFilter = () => {
    if (selectedFilter) {
      const field = availableFields.find((f: any) => f.value === selectedFilter);
      if (field && !filters.find(f => f.field === selectedFilter)) {
        setFilters([...filters, {
          id: Date.now().toString(),
          field: selectedFilter,
          value: ""
        }]);
      }
      setSelectedFilter("");
    }
  };
  
  const addColumn = () => {
    if (selectedColumn) {
      const field = availableFields.find((f: any) => f.value === selectedColumn);
      if (field && !columns.find(c => c.field === selectedColumn)) {
        setColumns([...columns, {
          id: Date.now().toString(),
          field: selectedColumn,
          label: field.label
        }]);
      }
      setSelectedColumn("");
    }
  };
  
  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };
  
  const removeColumn = (id: string) => {
    // Prevent removal of default employee profile fields
    const employeeProfileFields = ['employerName', 'employeeNumber', 'employeeEmail'];
    const columnToRemove = columns.find(c => c.id === id);
    
    if (columnToRemove && employeeProfileFields.includes(columnToRemove.field)) {
      toast({
        title: "Cannot Remove",
        description: "Employee profile fields are required and cannot be removed from reports",
        variant: "destructive"
      });
      return;
    }
    
    setColumns(columns.filter(c => c.id !== id));
  };
  
  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, field: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(field));
    e.dataTransfer.effectAllowed = 'copy';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const fieldData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (fieldData && !columns.find(c => c.field === fieldData.value)) {
        setColumns([...columns, {
          id: Date.now().toString(),
          field: fieldData.value,
          label: fieldData.label
        }]);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  // Column Reordering Handlers
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  
  const handleReorderDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleReorderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleReorderDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColumnIndex !== null && draggedColumnIndex !== dropIndex) {
      const newColumns = [...columns];
      const [draggedColumn] = newColumns.splice(draggedColumnIndex, 1);
      newColumns.splice(dropIndex, 0, draggedColumn);
      setColumns(newColumns);
    }
    setDraggedColumnIndex(null);
  };
  
  const generateReport = async () => {
    if (!selectedProcess || columns.length === 0) {
      toast({
        title: "Missing Requirements",
        description: "Please select a process and at least one column",
        variant: "destructive"
      });
      return;
    }
    
    if (!reportName.trim()) {
      toast({
        title: "Missing Report Name",
        description: "Please enter a name for your report",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    console.log("🔍 Frontend: Starting report generation...");
    console.log("🔍 Frontend: Request payload:", {
      process: selectedProcess,
      period: selectedPeriod,
      columns: columns.map(c => c.field),
      filters: filters.reduce((acc, f) => ({ ...acc, [f.field]: f.value }), {}),
      reportName: reportName || `${selectedProcess} Report`
    });
    
    try {
      console.log("🔍 Frontend: Making API call...");
      const response = await apiRequest("POST", "/api/report-builder/generate", {
        process: selectedProcess,
        period: selectedPeriod,
        columns: columns.map(c => c.field),
        filters: filters.reduce((acc, f) => ({ ...acc, [f.field]: f.value }), {}),
        reportName: reportName || `${selectedProcess} Report`
      });
      
      console.log("🔍 Frontend: API call successful!");
      console.log("🔍 Frontend: Raw response type:", typeof response);
      
      // Parse the JSON from the Response object
      const jsonData = await response.json();
      console.log("🔍 Frontend: Parsed JSON:", jsonData);
      console.log("🔍 Frontend: jsonData.data:", jsonData.data);
      console.log("🔍 Frontend: jsonData.data length:", jsonData.data?.length);
      
      setReportResults(jsonData);
      console.log("🔍 Frontend: Report results set!");
      
      toast({
        title: "Report Generated",
        description: `Generated ${(response as any).totalRecords} records successfully`
      });
    } catch (error) {
      console.error("🔍 Frontend: Error generating report:", error);
      console.error("🔍 Frontend: Error details:", JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      console.log("🔍 Frontend: Generation process complete");
      setIsGenerating(false);
    }
  };
  
  const exportToCSV = () => {
    if (!reportResults || !reportResults.data || !reportResults.data.length) {
      toast({
        title: "No Data",
        description: "Please generate a report first",
        variant: "destructive"
      });
      return;
    }
    
    // Use columns from state as fallback if API response doesn't include columns
    const exportColumns = reportResults.columns || columns.map(c => c.field);
    const headers = exportColumns.map((col: string) => {
      const field = availableFields.find((f: any) => f.value === col);
      return field?.label || col;
    });
    
    const csvContent = [
      headers.join(','),
      ...reportResults.data.map((row: any) => 
        exportColumns.map((col: string) => {
          const value = row[col];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = reportName || reportResults.tableName || 'report';
    link.setAttribute('download', `${fileName}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "CSV file has been downloaded"
    });
  };
  
  // Reset dialog state when closing
  const resetDialogState = () => {
    setSelectedProcess("");
    setSelectedPeriod("");
    setFilters([]);
    setColumns([]);
    setFilterName("");
    setReportName("");
    setSelectedFilter("");
    setSelectedColumn("");
    setReportResults(null);
    setIsGenerating(false);
  };

  const handleClose = () => {
    resetDialogState();
    onClose();
  };

  const formatCellValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (type === 'date' && value) {
      try {
        return new Date(value).toLocaleDateString('en-GB');
      } catch {
        return value;
      }
    }
    
    if (type === 'number' && typeof value === 'string') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return numValue.toLocaleString();
      }
    }
    
    return value;
  };
  
  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Builder</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Report Configuration */}
          <div className="col-span-8 space-y-6">
            {/* Period Selector */}
            <div>
              <Label htmlFor="period" className="block text-sm font-medium mb-2">
                Period
              </Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full bg-blue-50">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Process Selector */}
            <div>
              <Label htmlFor="process" className="block text-sm font-medium mb-2">
                Process
              </Label>
              <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Process" />
                </SelectTrigger>
                <SelectContent>
                  {processes.map(process => (
                    <SelectItem key={process.processType} value={process.processType}>
                      {process.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filter Selector */}
            <div>
              <Label htmlFor="filter" className="block text-sm font-medium mb-2">
                Filter
              </Label>
              <div className="flex gap-2">
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Filter Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field: any) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={addFilter} 
                  size="icon" 
                  className="bg-blue-500 hover:bg-blue-600"
                  data-testid="button-add-filter"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Available Columns - Drag and Drop */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Available Columns (Drag to Select)
              </Label>
              <div className="bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-200 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {availableFields.filter((field: any) => 
                    !columns.some(col => col.field === field.value)
                  ).map((field: any) => (
                    <div
                      key={field.value}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, field)}
                      className="bg-white p-2 rounded border cursor-move hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 text-sm"
                      data-testid={`drag-column-${field.value}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="truncate">{field.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {availableFields.filter((field: any) => 
                  !columns.some(col => col.field === field.value)
                ).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">All columns selected</p>
                )}
              </div>
            </div>
            
            {/* Report Name */}
            <div>
              <Label htmlFor="reportName" className="block text-sm font-medium mb-2">
                Report Name
              </Label>
              <Input 
                value={reportName} 
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
                data-testid="input-report-name"
              />
            </div>
            
            {/* Filter Name */}
            <div>
              <Label htmlFor="filterName" className="block text-sm font-medium mb-2">
                Filter Name
              </Label>
              <Input 
                value={filterName} 
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter filter name"
              />
            </div>
            
            {/* From Saved Filters */}
            <div>
              <Label htmlFor="savedFilters" className="block text-sm font-medium mb-2">
                From Saved Filters
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="-- select --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No saved filters yet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Generate Report Button */}
            <div className="pt-4 flex gap-2">
              <Button 
                onClick={generateReport} 
                disabled={isGenerating || !selectedProcess || columns.length === 0 || !reportName.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                data-testid="button-generate-report"
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
              {reportResults && (
                <Button 
                  onClick={exportToCSV}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  data-testid="button-export-csv"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
          
          {/* Right Panel - Filters and Columns */}
          <div className="col-span-4 space-y-6">
            {/* Filters Panel */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Filters</h3>
              {filters.length > 0 ? (
                <div className="space-y-2">
                  {filters.map(filter => (
                    <div key={filter.id} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm">{availableFields.find((f: any) => f.value === filter.field)?.label}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeFilter(filter.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No filter(s) added</p>
              )}
            </div>
            
            {/* Selected Columns - Drop Zone */}
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200"
                 onDragOver={handleDragOver}
                 onDrop={handleDrop}
                 data-testid="drop-zone-columns">
              <h3 className="font-medium text-gray-900 mb-3">Selected Columns (Drop here)</h3>
              {columns.length > 0 ? (
                <div className="space-y-2">
                  {columns.map((column, index) => (
                    <div 
                      key={column.id} 
                      draggable="true"
                      onDragStart={(e) => handleReorderDragStart(e, index)}
                      onDragOver={handleReorderDragOver}
                      onDrop={(e) => handleReorderDrop(e, index)}
                      className={`flex items-center justify-between p-2 rounded border cursor-move transition-colors duration-200 ${
                        ['employerName', 'employeeNumber', 'employeeEmail'].includes(column.field)
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                          : 'bg-white hover:bg-blue-50 hover:border-blue-300'
                      }`}
                      data-testid={`selected-column-${column.field}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-4 bg-gray-400 rounded-sm flex flex-col justify-between">
                          <div className="w-full h-0.5 bg-gray-600 rounded"></div>
                          <div className="w-full h-0.5 bg-gray-600 rounded"></div>
                          <div className="w-full h-0.5 bg-gray-600 rounded"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{column.label}</span>
                          {['employerName', 'employeeNumber', 'employeeEmail'].includes(column.field) && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeColumn(column.id)}
                        className={
                          ['employerName', 'employeeNumber', 'employeeEmail'].includes(column.field)
                            ? 'text-gray-400 cursor-not-allowed hover:text-gray-400'
                            : 'text-red-500 hover:text-red-700'
                        }
                        disabled={['employerName', 'employeeNumber', 'employeeEmail'].includes(column.field)}
                        data-testid={`button-remove-column-${column.field}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">No columns selected</p>
                  <p className="text-xs text-gray-400">Drag columns from the left to add them here</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Results Section */}
          {reportResults && (
            <div className="col-span-12 mt-6">
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{reportResults.tableName}</h3>
                      <p className="text-sm text-gray-600">
                        {reportResults.totalRecords} records found
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={exportToCSV}
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button 
                        onClick={() => setSaveReportOpen(true)}
                        variant="default"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid="button-save-report"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Report
                      </Button>
                    </div>
                  </div>
                </div>
                
                {reportResults.data && reportResults.data.length > 0 ? (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {reportResults.columns.map((col: string, index: number) => {
                            const field = availableFields.find((f: any) => f.value === col);
                            return (
                              <th key={index} className="px-4 py-3 text-left font-medium text-gray-900 border-b">
                                {field?.label || col}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {reportResults.data.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex} className="hover:bg-gray-50 border-b">
                            {reportResults.columns.map((col: string, colIndex: number) => (
                              <td key={colIndex} className="px-4 py-3 text-gray-900">
                                {formatCellValue(row[col], availableFields.find((f: any) => f.value === col)?.type)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No data found for the selected criteria
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Save Report Modal */}
    <Dialog open={saveReportOpen} onOpenChange={setSaveReportOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="save-report-name">Report Name</Label>
            <Input
              id="save-report-name"
              value={saveReportName}
              onChange={(e) => setSaveReportName(e.target.value)}
              placeholder="Enter report name"
              data-testid="input-save-report-name"
            />
          </div>
          <div>
            <Label htmlFor="save-report-description">Description (Optional)</Label>
            <Input
              id="save-report-description"
              value={saveReportDescription}
              onChange={(e) => setSaveReportDescription(e.target.value)}
              placeholder="Brief description of this report"
              data-testid="input-save-report-description"
            />
          </div>
          <div>
            <Label htmlFor="save-report-visibility">Visibility</Label>
            <Select value={saveReportVisibility} onValueChange={setSaveReportVisibility}>
              <SelectTrigger data-testid="select-save-report-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (Only me)</SelectItem>
                <SelectItem value="shared">Shared (Organization)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setSaveReportOpen(false)}
              data-testid="button-cancel-save"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!saveReportName.trim()) {
                  toast({
                    title: "Error",
                    description: "Please enter a report name",
                    variant: "destructive",
                  });
                  return;
                }
                
                const reportData = {
                  name: saveReportName.trim(),
                  description: saveReportDescription.trim(),
                  process: selectedProcess,
                  selectedColumns: columns.map(col => col.field),
                  filters: { period: selectedPeriod },
                  visibility: saveReportVisibility,
                };
                
                saveReportMutation.mutate(reportData);
              }}
              disabled={saveReportMutation.isPending}
              data-testid="button-confirm-save"
            >
              {saveReportMutation.isPending ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
