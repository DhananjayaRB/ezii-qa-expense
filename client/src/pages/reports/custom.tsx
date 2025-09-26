import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { FileText, Plus, BarChart3, Download, Eye, Settings, Trash2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CustomReportsPage() {
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [reportResults, setReportResults] = useState<any>(null);
  const { toast } = useToast();

  // Fetch saved reports
  const { data: savedReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/custom-reports"],
    retry: false,
  });

  // Execute report mutation - same logic as Admin panel
  const executeReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      // First get the saved report details
      const reportResponse = await apiRequest("GET", `/api/custom-reports/${reportId}`);
      const report = await reportResponse.json();
      
      // Check if report has columns saved
      if (!report.selectedColumns || report.selectedColumns.length === 0) {
        throw new Error(`Report "${report.name}" has no columns saved. Please recreate this report with columns selected.`);
      }
      
      // Check if this is a multi-process report by looking at column prefixes
      const isMultiProcess = report.selectedColumns && report.selectedColumns.some((col: string) => 
        col.includes('.') && col.split('.')[0] !== report.process
      );
      
      // Then execute the report using the saved parameters  
      const executeResponse = await apiRequest("POST", "/api/report-builder/generate", {
        // For multi-process reports, don't pass tableName to allow detection
        ...(isMultiProcess ? {} : { tableName: report.process }),
        columns: report.selectedColumns,
        filters: (report.filters && typeof report.filters === 'object') ? report.filters : {}
      });
      const results = await executeResponse.json();
      
      return { report, results };
    },
    onSuccess: ({ report, results }) => {
      // Show report results
      setReportResults({
        reportName: report.name,
        reportData: results
      });
      toast({
        title: "Success",
        description: `Report "${report.name}" executed successfully`,
      });
    },
    onError: (error) => {
      console.error("Execute report error:", error);
      toast({
        title: "Error",
        description: "Failed to execute report",
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Custom Reports</h1>
                <p className="text-gray-600">Access and manage all custom reports created with Report Builder</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BarChart3 className="w-4 h-4" />
                  <span>Reports</span>
                </div>
                <Button
                  onClick={() => setIsCreateReportOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-create-custom-report"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Report
                </Button>
              </div>
            </div>

            {reportsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading your custom reports...</p>
              </div>
            ) : Array.isArray(savedReports) && savedReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedReports.map((report: any) => (
                  <Card 
                    key={report.id}
                    className="p-6 hover:shadow-lg transition-shadow bg-white"
                    data-testid={`custom-report-card-${report.id}`}
                  >
                    <CardHeader className="pb-4">
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
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {report.process || report.tableName || 'Unknown Source'}
                        </Badge>
                        {report.selectedColumns && (
                          <Badge variant="outline" className="text-xs">
                            {Array.isArray(report.selectedColumns) ? report.selectedColumns.length : 0} columns
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-gray-500">
                          Created: {new Date(report.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => executeReportMutation.mutate(report.id)}
                          disabled={executeReportMutation.isPending}
                          data-testid={`button-view-report-${report.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {executeReportMutation.isPending ? "Running..." : "View"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Execute report first, then export the results
                            executeReportMutation.mutate(report.id);
                          }}
                          disabled={executeReportMutation.isPending}
                          data-testid={`button-export-report-${report.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
                              deleteReportMutation.mutate(report.id);
                            }
                          }}
                          disabled={deleteReportMutation.isPending}
                          data-testid={`button-delete-report-${report.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Custom Reports Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You haven't created any custom reports yet. Use the Report Builder to create your first custom report.
                </p>
                <Button
                  onClick={() => setIsCreateReportOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Report
                </Button>
              </div>
            )}

            {/* Report Results Display */}
            {reportResults && (
              <div className="mt-8">
                <div className="bg-white border rounded-lg shadow-sm">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {reportResults.reportData.isMultiProcess 
                            ? `Multi-Process Report - ${reportResults.reportName}`
                            : (reportResults.reportData.tableName || reportResults.reportName)
                          }
                        </h3>
                        <p className="text-sm text-gray-600">
                          {reportResults.reportData.totalRecords} records found
                          {reportResults.reportData.isMultiProcess && 
                            ` across ${Object.keys(reportResults.reportData.data).length} processes`
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            // Helper function for proper CSV escaping
                            const escapeCSVField = (value: any): string => {
                              if (value === null || value === undefined) return '';
                              const strValue = String(value);
                              if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n') || strValue.includes('\r')) {
                                return `"${strValue.replace(/"/g, '""')}"`;
                              }
                              return strValue;
                            };

                            // Export CSV for report results - handle both single and multi-process
                            let csvContent = '';
                            
                            if (reportResults.reportData.isMultiProcess) {
                              // Multi-process export - create unified CSV with process column
                              const allRows: string[] = [];
                              const allColumns = new Set<string>();
                              
                              // Collect all unique columns across all processes
                              Object.entries(reportResults.reportData.data).forEach(([processName, processData]) => {
                                (processData as any[]).forEach((row: any) => {
                                  Object.keys(row).forEach(col => allColumns.add(col));
                                });
                              });
                              
                              const columnsList = Array.from(allColumns).sort(); // Sort for consistent output
                              allRows.push(`Process,${columnsList.map(escapeCSVField).join(',')}`);
                              
                              Object.entries(reportResults.reportData.data).forEach(([processName, processData]) => {
                                (processData as any[]).forEach((row: any) => {
                                  const values = columnsList.map(col => escapeCSVField(row[col] || ''));
                                  allRows.push(`${escapeCSVField(processName)},${values.join(',')}`);
                                });
                              });
                              
                              csvContent = allRows.join('\n');
                            } else {
                              // Single process export
                              const exportColumns = reportResults.reportData.columns;
                              csvContent = [
                                exportColumns.map(escapeCSVField).join(','),
                                ...reportResults.reportData.data.map((row: any) => 
                                  exportColumns.map((col: string) => escapeCSVField(row[col] || '')).join(',')
                                )
                              ].join('\n');
                            }
                            
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${reportResults.reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.csv`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          data-testid="button-export-results-csv"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export CSV
                        </Button>
                        <Button 
                          onClick={() => setReportResults(null)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                          data-testid="button-close-results"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Multi-Process Tables Display */}
                  {reportResults.reportData.isMultiProcess && reportResults.reportData.data && Object.keys(reportResults.reportData.data).length > 0 ? (
                    <div className="space-y-6">
                      {(() => {
                        const processNames = Object.keys(reportResults.reportData.data);
                        
                        // Define explicit amount columns per process type
                        const processAmountColumnMap: {[key: string]: string} = {
                          'request': 'estimatedAmount',
                          'claim': 'totalAmount',
                          'payment': 'totalAmount',
                          'vendor': 'totalAmount',
                          'vendorclaim': 'totalAmount',
                          'pettycash': 'amount',
                          'directexpense': 'amount'
                        };
                        
                        // Helper function to parse amount values robustly
                        const parseAmount = (value: any): number => {
                          if (value === null || value === undefined || value === '') return 0;
                          const stringValue = String(value).replace(/[₹,\s]/g, ''); // Remove currency symbol, commas, spaces
                          const parsed = parseFloat(stringValue);
                          return isNaN(parsed) ? 0 : parsed;
                        };
                        
                        // Calculate table totals and grand total
                        const tableData = processNames.map(processName => {
                          const processData = reportResults.reportData.data[processName];
                          if (!processData || processData.length === 0) return null;
                          
                          // Get all unique columns across all rows in this process
                          const allColumns = new Set<string>();
                          processData.forEach((row: any) => {
                            Object.keys(row).forEach(col => allColumns.add(col));
                          });
                          
                          const displayColumns = Array.from(allColumns).filter(col => 
                            !col.includes('.') || col.split('.')[0] === processName
                          );
                          
                          // Calculate totals for all numeric columns
                          const columnTotals: { [key: string]: number } = {};
                          
                          if (processData.length > 0) {
                            displayColumns.forEach(column => {
                              // Only calculate totals for amount fields
                              const isAmountField = column.toLowerCase().includes('amount') || 
                                                   column.toLowerCase().includes('payment') ||
                                                   column.toLowerCase().includes('cost') ||
                                                   column.toLowerCase().includes('price');
                              
                              if (isAmountField) {
                                let total = 0;
                                let hasNumericData = false;
                                
                                processData.forEach((row: any) => {
                                  const value = row[column];
                                  const numericValue = parseAmount(value);
                                  if (!isNaN(numericValue) && numericValue !== 0) {
                                    total += numericValue;
                                    hasNumericData = true;
                                  }
                                });
                                
                                if (hasNumericData) {
                                  columnTotals[column] = total;
                                }
                              }
                            });
                          }
                          
                          return {
                            processName,
                            processData,
                            displayColumns,
                            columnTotals
                          };
                        }).filter(Boolean);
                        
                        // Calculate grand total from all numeric columns
                        const grandTotal = tableData.reduce((sum, data) => {
                          if (!data?.columnTotals) return sum;
                          return sum + Object.values(data.columnTotals).reduce((a, b) => a + b, 0);
                        }, 0);
                        
                        return (
                          <>
                            {tableData.map((data) => {
                              if (!data) return null;
                              const { processName, processData, displayColumns, columnTotals } = data;
                              
                              return (
                                <div key={processName} className="border-b last:border-b-0 pb-6 last:pb-0">
                                  <div className="px-4 py-3 bg-blue-50 border-b">
                                    <h4 className="font-semibold text-lg capitalize">
                                      {processName === 'request' ? 'Request Records' :
                                       processName === 'claim' ? 'Claim Records' :
                                       processName === 'payment' ? 'Payment Records' :
                                       processName === 'vendor' ? 'Vendor Records' :
                                       processName === 'vendorclaim' ? 'Vendor Claim Records' :
                                       processName === 'pettycash' ? 'Petty Cash Records' :
                                       processName === 'directexpense' ? 'Direct Expense Records' :
                                       `${processName.charAt(0).toUpperCase() + processName.slice(1)} Records`}
                                    </h4>
                                    <p className="text-sm text-gray-600">{processData.length} records found</p>
                                  </div>
                                  
                                  <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm">
                                      <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                          {displayColumns.map((col: string, index: number) => (
                                            <th key={index} className="px-4 py-3 text-left font-medium text-gray-900 border-b">
                                              {col.includes('.') 
                                                ? col.split('.')[1].charAt(0).toUpperCase() + col.split('.')[1].slice(1).replace(/([A-Z])/g, ' $1')
                                                : col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')
                                              }
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {processData.map((row: any, rowIndex: number) => (
                                          <tr key={rowIndex} className="hover:bg-gray-50 border-b">
                                            {displayColumns.map((col: string, colIndex: number) => (
                                              <td key={colIndex} className="px-4 py-3 text-gray-900">
                                                {(() => {
                                                  // Only format as currency if it's an amount field
                                                  const isAmountField = col.toLowerCase().includes('amount') || 
                                                                       col.toLowerCase().includes('payment') ||
                                                                       col.toLowerCase().includes('cost') ||
                                                                       col.toLowerCase().includes('price');
                                                  
                                                  if (isAmountField && (typeof row[col] === 'number' || (typeof row[col] === 'string' && !isNaN(parseAmount(row[col])) && parseAmount(row[col]) > 0))) {
                                                    return `₹${parseAmount(row[col]).toLocaleString('en-IN')}`;
                                                  }
                                                  
                                                  return row[col] || '-';
                                                })()}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                        {/* Totals Row */}
                                        <tr className="bg-yellow-50 border-t-2 border-yellow-300 font-bold">
                                          {displayColumns.map((col: string, colIndex: number) => (
                                            <td key={colIndex} className="px-4 py-3 text-gray-900">
                                              {colIndex === 0 ? 'Total' : 
                                               columnTotals[col] ? `₹${columnTotals[col].toLocaleString('en-IN')}` : '-'
                                              }
                                            </td>
                                          ))}
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Summary Section - Process-wise Totals */}
                            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 border rounded-lg">
                              <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Company Expense Summary</h3>
                              <div className="space-y-3">
                                {tableData.map((data) => {
                                  if (!data) return null;
                                  const { processName, columnTotals } = data;
                                  const processTotal = Object.values(columnTotals).reduce((sum, val) => sum + val, 0);
                                  
                                  const processLabel = processName === 'request' ? 'Expense Request' :
                                                     processName === 'claim' ? 'Expense Claim' :
                                                     processName === 'payment' ? 'Payment' :
                                                     processName === 'vendor' ? 'Vendor' :
                                                     processName === 'vendorclaim' ? 'Vendor Claim' :
                                                     processName === 'pettycash' ? 'Petty Cash' :
                                                     processName === 'directexpense' ? 'Direct Expense' :
                                                     processName.charAt(0).toUpperCase() + processName.slice(1);
                                  
                                  return (
                                    <div key={processName} className="flex justify-between items-center py-2 px-4 bg-white rounded border-l-4 border-blue-400">
                                      <span className="font-medium text-gray-700">{processLabel}</span>
                                      <span className="text-lg font-bold text-blue-600">₹{processTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                  );
                                })}
                                
                                {/* Grand Total */}
                                <div className="border-t-2 border-gray-300 pt-3 mt-4">
                                  <div className="flex justify-between items-center py-3 px-4 bg-green-100 rounded-lg border-l-4 border-green-600">
                                    <span className="text-lg font-bold text-green-800">Overall Total (Company Spend)</span>
                                    <span className="text-2xl font-bold text-green-600">₹{grandTotal.toLocaleString('en-IN')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Single Process Table Display */
                    reportResults.reportData.data && reportResults.reportData.data.length > 0 ? (
                      <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              {reportResults.reportData.columns.map((col: string, index: number) => (
                                <th key={index} className="px-4 py-3 text-left font-medium text-gray-900 border-b">
                                  {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reportResults.reportData.data.map((row: any, rowIndex: number) => (
                              <tr key={rowIndex} className="hover:bg-gray-50 border-b">
                                {reportResults.reportData.columns.map((col: string, colIndex: number) => (
                                  <td key={colIndex} className="px-4 py-3 text-gray-900">
                                    {row[col] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        No data found for this report
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Report Dialog */}
      <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Custom Report</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center space-y-4">
            <p className="text-gray-600">
              Create a new custom report using the Report Builder tool.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  window.location.href = '/config/report-builder';
                  setIsCreateReportOpen(false);
                }}
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Use Report Builder
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  window.location.href = '/admin';
                  setIsCreateReportOpen(false);
                }}
                className="w-full"
              >
                Go to Admin Panel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}