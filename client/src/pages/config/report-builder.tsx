import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Wrench, Settings, BarChart3, Target, Save, Plus, X, Download, XCircle, FileText, GripVertical, Check, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function ReportBuilderPage() {
  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Builder</h1>
              <p className="text-lg text-gray-600">
                Create custom reports with advanced filtering and data visualization options
              </p>
            </div>

            {/* Launch Report Builder Button */}
            <div className="text-center py-12">
              <Button 
                size="lg"
                onClick={() => setIsReportBuilderOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
                data-testid="button-launch-report-builder"
              >
                <Wrench className="w-5 h-5 mr-3" />
                Launch Report Builder
              </Button>
            </div>

            {/* Features Overview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    Multiple Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm">
                    Access data from expense claims, requests, payments, and vendor records.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    Custom Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm">
                    Filter data by date ranges, status, users, amounts, and other criteria.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Save className="w-4 h-4 text-purple-600" />
                    </div>
                    Save & Share
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm">
                    Save reports for reuse and share them with your team members.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Full Report Builder Dialog - Same as Admin Panel */}
      <ReportBuilderDialog 
        isOpen={isReportBuilderOpen} 
        onClose={() => setIsReportBuilderOpen(false)}
      />
    </div>
  );
}

// Full Report Builder Dialog Component - Same as Admin Panel
interface ReportBuilderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  loadedReport?: any;
}

function ReportBuilderDialog({ isOpen, onClose, loadedReport }: ReportBuilderDialogProps) {
  const { toast } = useToast();
  const [selectedProcess, setSelectedProcess] = useState<string>(""); // Legacy: single process
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]); // New: multi-process support
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [filters, setFilters] = useState<Array<{id: string, field: string, value: string}>>([]);
  const [columns, setColumns] = useState<Array<{id: string, field: string, label: string}>>([]);
  const [multiProcessColumns, setMultiProcessColumns] = useState<Array<{id: string, process: string, field: string, label: string}>>([]);
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Dynamic Filters state
  const [dynamicFilters, setDynamicFilters] = useState<Array<{
    id: string;
    field: string;
    values: string[];
    availableValues: string[];
    isLoadingValues: boolean;
  }>>([]);
  // Multi-process Dynamic Filters state
  const [multiProcessDynamicFilters, setMultiProcessDynamicFilters] = useState<Array<{
    id: string;
    process: string;
    field: string;
    values: string[];
    availableValues: string[];
    isLoadingValues: boolean;
  }>>([]);
  const [selectedDynamicFilterField, setSelectedDynamicFilterField] = useState<string>("");

  // Helper function to determine if we're in multi-process mode
  const isMultiProcessMode = selectedProcesses.length > 0;
  
  // Get effective processes (backward compatibility)
  const getEffectiveProcesses = () => {
    if (selectedProcesses.length > 0) return selectedProcesses;
    if (selectedProcess) return [selectedProcess];
    return [];
  };

  // Get effective dynamic filters (unified for UI)
  const getEffectiveDynamicFilters = () => {
    return isMultiProcessMode ? multiProcessDynamicFilters : dynamicFilters;
  };

  // Save report mutation
  const saveReportMutation = useMutation({
    mutationFn: async (reportData: {
      name: string;
      description: string;
      process: string;
      selectedColumns: string[];
      filters: any;
      visibility: string;
      allowedRoles?: string[];
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
      setSelectedRoles([]);
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
        setReportResults(loadedReport.results);
      }

      // Load role-based access settings if available
      if (loadedReport.visibility) {
        setSaveReportVisibility(loadedReport.visibility);
      }
      
    }
  }, [loadedReport, isOpen]);

  // Fetch available processes from processMaster
  const { data: processes = [] } = useQuery<Array<{processType: string, displayName: string}>>({
    queryKey: ["/api/process-master"]
  });

  // Debug: log processes data
  console.log("🔍 Report Builder: Processes data:", processes);

  // Fetch workflow roles for access control
  const { data: workflowRoles = [] } = useQuery<Array<{id: string, name: string, description?: string}>>({
    queryKey: ["/api/workflow-roles?isActive=true"]
  });

  // Fetch available fields for the selected process (backward compatibility)
  const { data: availableFields = [] } = useQuery<Array<{value: string, label: string, type: string}>>({
    queryKey: [`/api/report-builder/fields/${selectedProcess}`],
    enabled: !!selectedProcess && selectedProcesses.length === 0
  });

  // Fetch available fields for multiple processes
  const multiProcessFieldQueries = useQuery<Array<{process: string, fields: Array<{value: string, label: string, type: string}>}>>({
    queryKey: ["/api/report-builder/multi-fields", selectedProcesses],
    queryFn: async () => {
      if (selectedProcesses.length === 0) return [];
      
      const results = await Promise.all(
        selectedProcesses.map(async (process) => {
          const response = await apiRequest("GET", `/api/report-builder/fields/${process}`);
          const fields = await response.json();
          return { process, fields };
        })
      );
      return results;
    },
    enabled: selectedProcesses.length > 0
  });

  // Get effective available fields (backward compatibility)
  const getEffectiveAvailableFields = () => {
    if (selectedProcesses.length > 0 && multiProcessFieldQueries.data) {
      // Multi-process mode: return all fields with process information
      const result = multiProcessFieldQueries.data.flatMap(({ process, fields }) => 
        fields.map(field => ({
          ...field,
          value: `${process}.${field.value}`,
          label: `${process.charAt(0).toUpperCase() + process.slice(1)} ${field.label}`,
          process
        }))
      );
      console.log("🔍 Multi-process fields:", result);
      return result;
    } else if (selectedProcess && availableFields.length > 0) {
      // Single process mode: return fields as-is for backward compatibility
      console.log("🔍 Single-process fields:", availableFields);
      return availableFields;
    }
    return [];
  };

  const effectiveAvailableFields = getEffectiveAvailableFields();
  console.log("🔍 Effective available fields:", effectiveAvailableFields);

  // useEffect for role-based loading - moved after queries are defined
  useEffect(() => {
    if (loadedReport && isOpen && workflowRoles.length > 0) {
      if (loadedReport.sharedRoles && Array.isArray(loadedReport.sharedRoles)) {
        // Convert role names back to IDs for the UI
        const roleIds = loadedReport.sharedRoles.map((roleName: string) => {
          const role = workflowRoles.find(r => r.name === roleName);
          return role ? role.id : roleName;
        }).filter(Boolean);
        setSelectedRoles(roleIds);
      }
    }
  }, [loadedReport, isOpen, workflowRoles]);

  // Clear dynamic filters when process changes
  useEffect(() => {
    setDynamicFilters([]);
    setMultiProcessDynamicFilters([]);
  }, [selectedProcess, selectedProcesses]);

  // Auto-add employee profile fields as default columns when process changes
  useEffect(() => {
    if ((selectedProcess || selectedProcesses.length > 0) && effectiveAvailableFields.length > 0) {
      const employeeProfileFields = [
        { field: 'employerName', label: 'Employee Initiated' },
        { field: 'employeeNumber', label: 'Employee Number' },
        { field: 'employeeEmail', label: 'Email' }
      ];
      
      // Check if employee profile fields are available and not already added
      const fieldsToAdd = employeeProfileFields.filter(profileField => {
        const isFieldAvailable = effectiveAvailableFields.some((f: any) => f.value === profileField.field);
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
      const field = effectiveAvailableFields.find((f: any) => f.value === selectedFilter);
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
      const field = effectiveAvailableFields.find((f: any) => f.value === selectedColumn);
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
  
  // Dynamic Filter Functions
  const addDynamicFilter = async () => {
    if (!selectedDynamicFilterField) return;
    
    // Check if filter already exists (support both modes)
    const existingFilter = getEffectiveDynamicFilters().find(f => f.field === selectedDynamicFilterField);
      
    if (existingFilter) {
      toast({
        title: "Filter Exists",
        description: "This filter field is already added",
        variant: "destructive"
      });
      return;
    }
    
    // Determine process and field from the selected field
    let processType: string;
    let fieldName: string;
    
    if (selectedDynamicFilterField.includes('.')) {
      // Multi-process field (e.g., "claim.title")
      [processType, fieldName] = selectedDynamicFilterField.split('.');
    } else {
      // Single process field
      processType = selectedProcess || '';
      fieldName = selectedDynamicFilterField;
    }
    
    const newFilter = isMultiProcessMode ? {
      id: Date.now().toString(),
      process: processType,
      field: selectedDynamicFilterField,
      values: [],
      availableValues: [],
      isLoadingValues: true
    } : {
      id: Date.now().toString(),
      field: selectedDynamicFilterField,
      values: [],
      availableValues: [],
      isLoadingValues: true
    };
    
    // Update appropriate state
    if (isMultiProcessMode) {
      setMultiProcessDynamicFilters([...multiProcessDynamicFilters, newFilter as any]);
    } else {
      setDynamicFilters([...dynamicFilters, newFilter as any]);
    }
    setSelectedDynamicFilterField("");
    
    try {
      if (!processType) {
        throw new Error('No process type available');
      }
      
      // Fetch available values for this field
      const response = await apiRequest("GET", `/api/report-builder/field-values/${processType}/${fieldName}`);
      const availableValues = await response.json();
      
      // Update appropriate state
      if (isMultiProcessMode) {
        setMultiProcessDynamicFilters(prev => prev.map(f => 
          f.id === newFilter.id 
            ? { ...f, availableValues, isLoadingValues: false }
            : f
        ));
      } else {
        setDynamicFilters(prev => prev.map(f => 
          f.id === newFilter.id 
            ? { ...f, availableValues, isLoadingValues: false }
            : f
        ));
      }
    } catch (error) {
      console.error("Error fetching field values:", error);
      // Update appropriate state with error handling
      if (isMultiProcessMode) {
        setMultiProcessDynamicFilters(prev => prev.map(f => 
          f.id === newFilter.id 
            ? { ...f, isLoadingValues: false }
            : f
        ));
      } else {
        setDynamicFilters(prev => prev.map(f => 
          f.id === newFilter.id 
            ? { ...f, isLoadingValues: false }
            : f
        ));
      }
      toast({
        title: "Error",
        description: "Failed to load filter values",
        variant: "destructive"
      });
    }
  };
  
  const removeDynamicFilter = (id: string) => {
    if (isMultiProcessMode) {
      setMultiProcessDynamicFilters(multiProcessDynamicFilters.filter(f => f.id !== id));
    } else {
      setDynamicFilters(dynamicFilters.filter(f => f.id !== id));
    }
  };
  
  const updateDynamicFilterValues = (filterId: string, values: string[]) => {
    if (isMultiProcessMode) {
      setMultiProcessDynamicFilters(prev => prev.map(f => 
        f.id === filterId ? { ...f, values } : f
      ));
    } else {
      setDynamicFilters(prev => prev.map(f => 
        f.id === filterId ? { ...f, values } : f
      ));
    }
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
    
    // Only handle column additions, not reordering
    if (e.dataTransfer.types.includes('application/json')) {
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
    }
  };
  
  // Column Reordering Handlers
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  
  const handleReorderDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `reorder-${index}`);
  };
  
  const handleReorderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent dragover handler
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleReorderDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent drop handler
    
    // Verify this is a reorder operation
    const dragData = e.dataTransfer.getData('text/plain');
    if (!dragData.startsWith('reorder-')) return;
    
    if (draggedColumnIndex !== null && draggedColumnIndex !== dropIndex) {
      const newColumns = [...columns];
      const [draggedColumn] = newColumns.splice(draggedColumnIndex, 1);
      newColumns.splice(dropIndex, 0, draggedColumn);
      setColumns(newColumns);
      
      // Show success feedback
      toast({
        title: "Column Reordered",
        description: `"${draggedColumn.label}" moved to position ${dropIndex + 1}`,
        duration: 2000
      });
    }
    setDraggedColumnIndex(null);
  };
  
  const generateReport = async () => {
    // Validation for both single and multi-process modes
    const effectiveProcesses = getEffectiveProcesses();
    if (effectiveProcesses.length === 0 || columns.length === 0) {
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
    
    try {
      // Convert dynamic filters to the format expected by the backend (support both modes)
      const filtersPayload = isMultiProcessMode 
        ? multiProcessDynamicFilters.reduce((acc, f) => ({
            ...acc,
            [f.field]: f.values.length === 1 ? f.values[0] : f.values
          }), {})
        : dynamicFilters.reduce((acc, f) => ({
            ...acc,
            [f.field]: f.values.length === 1 ? f.values[0] : f.values
          }), {});
      
      // Support both single and multi-process modes based on effective processes
      const effectiveProcesses = getEffectiveProcesses();
      const requestPayload = effectiveProcesses.length > 1 ? {
        processes: effectiveProcesses, // Multi-process mode
        period: selectedPeriod,
        columns: columns.map(c => c.field),
        filters: filtersPayload,
        reportName: reportName || `Multi-Process Report`
      } : {
        process: effectiveProcesses[0] || selectedProcess, // Single process mode (backward compatibility)
        period: selectedPeriod,
        columns: columns.map(c => c.field),
        filters: filtersPayload,
        reportName: reportName || `${effectiveProcesses[0] || selectedProcess} Report`
      };
      
      const response = await apiRequest("POST", "/api/report-builder/generate", requestPayload);
      
      const jsonData = await response.json();
      setReportResults(jsonData);
      
      toast({
        title: "Report Generated",
        description: `Generated ${jsonData.totalRecords} records successfully`
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const exportToCSV = () => {
    if (!reportResults || !reportResults.data) {
      toast({
        title: "No Data",
        description: "Please generate a report first",
        variant: "destructive"
      });
      return;
    }
    
    let csvContent = '';
    const fileName = reportName || reportResults.tableName || 'report';
    
    if (reportResults.isMultiProcess) {
      // Multi-process export: separate sections for each process
      const sections: string[] = [];
      
      Object.entries(reportResults.data).forEach(([processName, processData]: [string, any]) => {
        if (!Array.isArray(processData) || processData.length === 0) return;
        
        // Get columns for this process
        const processColumns = reportResults.columns.filter((col: string) => 
          col.startsWith(`${processName}.`) || !col.includes('.')
        );
        
        // Create headers for this process
        const headers = processColumns.map((col: string) => {
          const field = effectiveAvailableFields.find((f: any) => f.value === col);
          return field?.label || col;
        });
        
        // Create section header
        const sectionHeader = `\n--- ${processName.toUpperCase()} RECORDS (${processData.length} records) ---`;
        const sectionData = [
          headers.join(','),
          ...processData.map((row: any) => 
            processColumns.map((col: string) => {
              const value = row[col];
              // Escape commas and quotes in CSV
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            }).join(',')
          )
        ];
        
        sections.push(sectionHeader + '\n' + sectionData.join('\n'));
      });
      
      csvContent = sections.join('\n\n');
    } else {
      // Single process export: traditional CSV format
      if (!Array.isArray(reportResults.data) || reportResults.data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available to export",
          variant: "destructive"
        });
        return;
      }
      
      const exportColumns = reportResults.columns || columns.map(c => c.field);
      const headers = exportColumns.map((col: string) => {
        const field = effectiveAvailableFields.find((f: any) => f.value === col);
        return field?.label || col;
      });
      
      csvContent = [
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
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
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
                Process {selectedProcesses.length > 0 && `(${selectedProcesses.length} selected)`}
              </Label>
              
              {/* Multi-Select Process Dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    data-testid="button-select-processes"
                  >
                    {selectedProcesses.length === 0
                      ? "Select Process(es)"
                      : selectedProcesses.length === 1
                      ? processes.find(p => p.processType === selectedProcesses[0])?.displayName
                      : `${selectedProcesses.length} processes selected`}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search processes..." />
                    <CommandEmpty>No processes found.</CommandEmpty>
                    <CommandGroup>
                      {/* Select All Option */}
                      <CommandItem
                        onSelect={() => {
                          const allProcessTypes = processes.map(p => p.processType);
                          const allSelected = allProcessTypes.every(processType => selectedProcesses.includes(processType));
                          
                          if (allSelected) {
                            // Deselect all
                            setSelectedProcesses([]);
                            setSelectedProcess("");
                          } else {
                            // Select all
                            setSelectedProcesses(allProcessTypes);
                            setSelectedProcess("");
                          }
                        }}
                        className="border-b border-gray-100 font-medium"
                        data-testid="option-select-all-processes"
                      >
                        <Checkbox
                          checked={processes.length > 0 && processes.every(p => selectedProcesses.includes(p.processType))}
                          className="mr-2"
                        />
                        {processes.length > 0 && processes.every(p => selectedProcesses.includes(p.processType)) ? "Deselect All" : "Select All"}
                      </CommandItem>
                      {processes.map((process) => (
                        <CommandItem
                          key={process.processType}
                          onSelect={() => {
                            const isSelected = selectedProcesses.includes(process.processType);
                            if (isSelected) {
                              setSelectedProcesses(prev => prev.filter(p => p !== process.processType));
                            } else {
                              setSelectedProcesses(prev => [...prev, process.processType]);
                            }
                            // Keep backward compatibility
                            if (selectedProcesses.length === 0 && !isSelected) {
                              setSelectedProcess(process.processType);
                            } else if (selectedProcesses.length === 1 && isSelected) {
                              setSelectedProcess("");
                            }
                          }}
                          data-testid={`option-process-${process.processType}`}
                        >
                          <Checkbox
                            checked={selectedProcesses.includes(process.processType)}
                            className="mr-2"
                          />
                          {process.displayName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Dynamic Filter Selector */}
            <div>
              <Label htmlFor="filter" className="block text-sm font-medium mb-2">
                Add Dynamic Filter
              </Label>
              <div className="flex gap-2">
                <Select value={selectedDynamicFilterField} onValueChange={setSelectedDynamicFilterField}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Filter Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {effectiveAvailableFields
                      .filter((field: any) => {
                        // Get effective filters to check for duplicates
                        return !getEffectiveDynamicFilters().find(f => f.field === field.value);
                      })
                      .map((field: any) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={addDynamicFilter} 
                  size="icon" 
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={!selectedDynamicFilterField || getEffectiveProcesses().length === 0}
                  data-testid="button-add-dynamic-filter"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Available Columns - Drag and Drop */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Available Columns (Drag to Select) {effectiveAvailableFields.filter((field: any) => !columns.some(col => col.field === field.value)).length > 0 && `(${effectiveAvailableFields.filter((field: any) => !columns.some(col => col.field === field.value)).length} available)`}
              </Label>
              <div className={`bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-200 overflow-y-auto ${
                effectiveAvailableFields.filter((field: any) => !columns.some(col => col.field === field.value)).length <= 8 
                  ? 'max-h-32' 
                  : effectiveAvailableFields.filter((field: any) => !columns.some(col => col.field === field.value)).length <= 16
                  ? 'max-h-48'
                  : effectiveAvailableFields.filter((field: any) => !columns.some(col => col.field === field.value)).length <= 24
                  ? 'max-h-64'
                  : 'max-h-80'
              }`}>
                <div className={`grid gap-2 ${
                  effectiveAvailableFields.filter((field: any) => !columns.some(col => col.field === field.value)).length <= 6
                    ? 'grid-cols-2'
                    : effectiveAvailableFields.filter((field: any) => !columns.some(col => col.field === field.value)).length <= 12
                    ? 'grid-cols-3'
                    : 'grid-cols-4'
                }`}>
                  {effectiveAvailableFields.filter((field: any) => 
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
                {effectiveAvailableFields.filter((field: any) => 
                  !columns.some(col => col.field === field.value)
                ).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    <span className="text-green-600 font-medium">✓ All available columns selected</span>
                    <br />
                    <span className="text-xs">Remove columns from the right panel to add different ones</span>
                  </p>
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
                disabled={isGenerating || getEffectiveProcesses().length === 0 || columns.length === 0 || !reportName.trim()}
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
            {/* Dynamic Filters Panel */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Dynamic Filters</h3>
              {getEffectiveDynamicFilters().length > 0 ? (
                <div className="space-y-4">
                  {getEffectiveDynamicFilters().map(filter => (
                    <div key={filter.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {effectiveAvailableFields.find((f: any) => f.value === filter.field)?.label}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeDynamicFilter(filter.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {filter.isLoadingValues ? (
                        <div className="text-xs text-gray-500">Loading values...</div>
                      ) : filter.availableValues.length > 0 ? (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {filter.availableValues.map((value: string, idx: number) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <Checkbox
                                id={`filter-${filter.id}-${idx}`}
                                checked={filter.values.includes(value)}
                                onCheckedChange={(checked) => {
                                  const updatedValues = checked 
                                    ? [...filter.values, value]
                                    : filter.values.filter(v => v !== value);
                                  updateDynamicFilterValues(filter.id, updatedValues);
                                }}
                              />
                              <label 
                                htmlFor={`filter-${filter.id}-${idx}`}
                                className="text-xs cursor-pointer truncate flex-1"
                                title={value.toString()}
                              >
                                {value}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">No values available</div>
                      )}
                      
                      {filter.values.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-xs text-blue-600">
                            Selected: {filter.values.length} value{filter.values.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No filters added</p>
              )}
            </div>
            
            {/* Selected Columns - Drop Zone with Reordering */}
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200"
                 onDragOver={handleDragOver}
                 onDrop={handleDrop}
                 data-testid="drop-zone-columns">
              <h3 className="font-medium text-gray-900 mb-3">Selected Columns (Drop here) {columns.length > 0 && `- ${columns.length} selected`}</h3>
              <p className="text-xs text-gray-500 mb-3">💡 Drag columns to reorder them</p>
              {columns.length > 0 ? (
                <div className="space-y-2">
                  {columns.map((column, index) => (
                    <div 
                      key={column.id} 
                      draggable="true"
                      onDragStart={(e) => handleReorderDragStart(e, index)}
                      onDragOver={handleReorderDragOver}
                      onDrop={(e) => handleReorderDrop(e, index)}
                      onDragEnd={(e) => {
                        setDraggedColumnIndex(null);
                        (e.target as HTMLElement).style.opacity = '1';
                      }}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-move transition-all duration-200 ${
                        draggedColumnIndex === index 
                          ? 'border-blue-400 bg-blue-100 shadow-lg transform scale-105 opacity-75'
                          : ['employerName', 'employeeNumber', 'employeeEmail'].includes(column.field)
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md'
                          : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                      }`}
                      data-testid={`selected-column-${column.field}`}
                      style={{
                        opacity: draggedColumnIndex === index ? 0.75 : 1
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5 p-1 cursor-grab active:cursor-grabbing">
                          <div className={`w-3 h-0.5 rounded transition-colors ${
                            draggedColumnIndex === index ? 'bg-blue-600' : 'bg-gray-500'
                          }`}></div>
                          <div className={`w-3 h-0.5 rounded transition-colors ${
                            draggedColumnIndex === index ? 'bg-blue-600' : 'bg-gray-500'
                          }`}></div>
                          <div className={`w-3 h-0.5 rounded transition-colors ${
                            draggedColumnIndex === index ? 'bg-blue-600' : 'bg-gray-500'
                          }`}></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium transition-colors ${
                            draggedColumnIndex === index ? 'text-blue-600' : 'text-gray-700'
                          }`}>{index + 1}.</span>
                          <span className={`text-sm transition-colors ${
                            draggedColumnIndex === index ? 'text-blue-600' : 'text-gray-900'
                          }`}>{column.label}</span>
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
                
                {reportResults.isMultiProcess ? (
                  // Multi-Process Report: Separate tables for each process
                  <div className="space-y-6 p-4">
                    {Object.entries(reportResults.data).map(([processName, processData]: [string, any]) => {
                      // Include default employee columns and process-specific columns
                      const defaultColumns = ['employerName', 'employeeNumber', 'employeeEmail'];
                      const processSpecificColumns = reportResults.columns.filter((col: string) => 
                        col.startsWith(`${processName}.`)
                      );
                      // Always include default columns + process-specific columns
                      const processColumns = [
                        ...defaultColumns,
                        ...processSpecificColumns
                      ];
                      
                      return (
                        <div key={processName} className="border-2 border-gray-300 rounded-lg bg-white">
                          {/* Process Header */}
                          <div className="bg-blue-50 border-b-2 border-blue-200 px-4 py-3 rounded-t-lg">
                            <h4 className="font-semibold text-lg text-blue-900 capitalize">
                              {processName} Records
                            </h4>
                            <p className="text-sm text-blue-700">
                              {Array.isArray(processData) ? processData.length : 0} records found
                            </p>
                          </div>
                          
                          {/* Process Table */}
                          {Array.isArray(processData) && processData.length > 0 ? (
                            <div className="overflow-x-auto max-h-80">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                  <tr>
                                    {processColumns.map((col: string, index: number) => {
                                      const field = effectiveAvailableFields.find((f: any) => f.value === col);
                                      return (
                                        <th key={index} className="px-4 py-3 text-left font-medium text-gray-900 border-b">
                                          {field?.label || col}
                                        </th>
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {processData.map((row: any, rowIndex: number) => (
                                    <tr key={rowIndex} className="hover:bg-gray-50 border-b">
                                      {processColumns.map((col: string, colIndex: number) => (
                                        <td key={colIndex} className="px-4 py-3 text-gray-900">
                                          {formatCellValue(row[col], effectiveAvailableFields.find((f: any) => f.value === col)?.type)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              No {processName} records found for the selected criteria
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Single Process Report: Traditional single table
                  reportResults.data && reportResults.data.length > 0 ? (
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {reportResults.columns.map((col: string, index: number) => {
                              const field = effectiveAvailableFields.find((f: any) => f.value === col);
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
                                  {formatCellValue(row[col], effectiveAvailableFields.find((f: any) => f.value === col)?.type)}
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
                  )
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
                <SelectItem value="role-based">Role-based Access</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Role Selection for Role-based Access */}
          {saveReportVisibility === "role-based" && (
            <div>
              <Label className="block text-sm font-medium mb-2">
                Select Roles (Who can access this report)
              </Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                {workflowRoles.length > 0 ? (
                  <div className="space-y-2">
                    {workflowRoles.map(role => (
                      <div key={role.id} className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer ${
                            selectedRoles.includes(role.id)
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 hover:border-blue-500'
                          }`}
                          onClick={() => {
                            setSelectedRoles(prev => 
                              prev.includes(role.id)
                                ? prev.filter(id => id !== role.id)
                                : [...prev, role.id]
                            );
                          }}
                        >
                          {selectedRoles.includes(role.id) && (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                          {role.description && (
                            <div className="text-xs text-gray-500">{role.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No workflow roles available. Contact your administrator.
                  </div>
                )}
              </div>
              {selectedRoles.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">Selected roles:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedRoles.map(roleId => {
                      const role = workflowRoles.find(r => r.id === roleId);
                      return role ? (
                        <Badge key={roleId} variant="secondary" className="text-xs">
                          {role.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
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
                
                if (saveReportVisibility === "role-based" && selectedRoles.length === 0) {
                  toast({
                    title: "Error",
                    description: "Please select at least one role for role-based access",
                    variant: "destructive",
                  });
                  return;
                }
                
                // Get role names instead of IDs for backend
                const selectedRoleNames = saveReportVisibility === "role-based" 
                  ? selectedRoles.map(roleId => {
                      const role = workflowRoles.find(r => r.id === roleId);
                      return role ? role.name : roleId;
                    })
                  : [];

                const reportData = {
                  name: saveReportName.trim(),
                  description: saveReportDescription.trim(),
                  process: selectedProcess,
                  selectedColumns: columns.map(col => col.field),
                  filters: { period: selectedPeriod },
                  visibility: saveReportVisibility,
                  allowedRoles: selectedRoleNames,
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