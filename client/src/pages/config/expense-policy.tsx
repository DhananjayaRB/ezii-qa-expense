import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { filterDataService } from "@/services/filterDataService";
import { ExpensePolicy as ExpensePolicyType, InsertExpensePolicy, ExpenseHead } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

type FilterItem = {
  id: string;
  name: string;
};

export default function ExpensePolicy() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ExpensePolicyType | null>(null);
  const [formData, setFormData] = useState<InsertExpensePolicy>({
    expenseHeadId: "",
    ruleType: "fixed",
    class: "All Class",
    dayLimitPerTransaction: false,
    isRestricted: false,
    status: true,
    limitAmount: null,
    limitCurrency: "INR",
    locationId: null,
    locationName: null,
    departmentId: null,
    departmentName: null,
    divisionId: null,
    divisionName: null,
    levelId: null,
    levelName: null,
    programId: null,
    programName: null,
    projectId: null,
    projectName: null,
  });

  // Dynamic external API data for criteria-based rules
  const [availableFilterTypes, setAvailableFilterTypes] = useState<FilterItem[]>([]);
  const [filterTypeValues, setFilterTypeValues] = useState<Record<string, FilterItem[]>>({});
  const [loadingExternalData, setLoadingExternalData] = useState(false);

  const { toast } = useToast();

  // Fetch expense heads for dropdown
  const { data: expenseHeads = [] } = useQuery<ExpenseHead[]>({
    queryKey: ["/api/expense-heads"],
  });

  // Fetch expense policies
  const { data: policies = [], isLoading } = useQuery<ExpensePolicyType[]>({
    queryKey: ["/api/expense-policies"],
  });

  // Load external API data for criteria-based rules
  useEffect(() => {
    if (formData.ruleType === "criteria_based") {
      loadExternalData();
    }
  }, [formData.ruleType]);

  const loadExternalData = async () => {
    setLoadingExternalData(true);
    try {
      // Step 1: Get available filter types (Location, Department, etc.)
      const filterTypes = await filterDataService.getFilterTypes();
      console.log('Available filter types:', filterTypes);
      setAvailableFilterTypes(filterTypes);
      
      // Step 2: For each filter type, load its values dynamically
      const valuesMap: Record<string, FilterItem[]> = {};
      
      for (const filterType of filterTypes) {
        try {
          console.log(`Loading values for ${filterType.name} (ID: ${filterType.id})`);
          const values = await filterDataService.getFilterTypeValues(filterType.id);
          valuesMap[filterType.id] = values;
          console.log(`Loaded ${values.length} values for ${filterType.name}`);
        } catch (error) {
          console.error(`Failed to load values for ${filterType.name}:`, error);
          valuesMap[filterType.id] = []; // Set empty array on error
        }
      }
      
      setFilterTypeValues(valuesMap);
      console.log('All filter type values loaded:', valuesMap);
      
    } catch (error) {
      console.error('Failed to load external data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load external data for criteria-based rules."
      });
    } finally {
      setLoadingExternalData(false);
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertExpensePolicy) => apiRequest("/api/expense-policies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-policies"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Expense policy created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create expense policy", variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpensePolicyType> }) =>
      apiRequest(`/api/expense-policies/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-policies"] });
      setIsEditDialogOpen(false);
      setEditingPolicy(null);
      toast({ title: "Success", description: "Expense policy updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update expense policy", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/expense-policies/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-policies"] });
      toast({ title: "Success", description: "Expense policy deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete expense policy", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      expenseHeadId: "",
      ruleType: "fixed",
      class: "All Class",
      dayLimitPerTransaction: false,
      isRestricted: false,
      status: true,
      limitAmount: null,
      limitCurrency: "INR",
      locationId: null,
      locationName: null,
      departmentId: null,
      departmentName: null,
      divisionId: null,
      divisionName: null,
      levelId: null,
      levelName: null,
      programId: null,
      programName: null,
      projectId: null,
      projectName: null,
    });
  };

  const filteredPolicies = policies.filter(policy => {
    const expenseHead = expenseHeads.find(h => h.id === policy.expenseHeadId);
    return expenseHead?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getExpenseHeadName = (headId: string) => {
    const head = expenseHeads.find(h => h.id === headId);
    return head?.name || "Unknown";
  };

  const handleCreate = () => {
    // Clean up criteria-based fields if rule type is fixed
    const cleanedData = { ...formData };
    if (formData.ruleType === "fixed") {
      delete cleanedData.locationId;
      delete cleanedData.locationName;
      delete cleanedData.departmentId;
      delete cleanedData.departmentName;
      delete cleanedData.divisionId;
      delete cleanedData.divisionName;
      delete cleanedData.levelId;
      delete cleanedData.levelName;
      delete cleanedData.programId;
      delete cleanedData.programName;
      delete cleanedData.projectId;
      delete cleanedData.projectName;
    }
    
    createMutation.mutate(cleanedData);
  };

  const handleEdit = (policy: ExpensePolicyType) => {
    setEditingPolicy(policy);
    setFormData({
      expenseHeadId: policy.expenseHeadId,
      ruleType: policy.ruleType,
      class: policy.class || "All Class",
      dayLimitPerTransaction: policy.dayLimitPerTransaction,
      isRestricted: policy.isRestricted,
      status: policy.status,
      limitAmount: policy.limitAmount || null,
      limitCurrency: policy.limitCurrency,
      locationId: policy.locationId || null,
      locationName: policy.locationName || null,
      departmentId: policy.departmentId || null,
      departmentName: policy.departmentName || null,
      divisionId: policy.divisionId || null,
      divisionName: policy.divisionName || null,
      levelId: policy.levelId || null,
      levelName: policy.levelName || null,
      programId: policy.programId || null,
      programName: policy.programName || null,
      projectId: policy.projectId || null,
      projectName: policy.projectName || null,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingPolicy) {
      // Clean up criteria-based fields if rule type is fixed
      const cleanedData = { ...formData };
      if (formData.ruleType === "fixed") {
        delete cleanedData.locationId;
        delete cleanedData.locationName;
        delete cleanedData.departmentId;
        delete cleanedData.departmentName;
        delete cleanedData.divisionId;
        delete cleanedData.divisionName;
        delete cleanedData.levelId;
        delete cleanedData.levelName;
        delete cleanedData.programId;
        delete cleanedData.programName;
        delete cleanedData.projectId;
        delete cleanedData.projectName;
      }
      
      updateMutation.mutate({ id: editingPolicy.id, data: cleanedData });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense policy?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDropdownChange = (type: string, selectedId: string | null, selectedName: string) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Id`]: selectedId,
      [`${type}Name`]: selectedName,
    }));
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="expenseHead">Expense Head *</Label>
        <Select value={formData.expenseHeadId} onValueChange={(value) => setFormData({ ...formData, expenseHeadId: value })}>
          <SelectTrigger data-testid="select-expense-head">
            <SelectValue placeholder="Select Expense Head" />
          </SelectTrigger>
          <SelectContent>
            {expenseHeads.filter(head => head.status).map((head) => (
              <SelectItem key={head.id} value={head.id} data-testid={`option-head-${head.id}`}>
                {head.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="ruleType">Rule Type *</Label>
        <Select value={formData.ruleType} onValueChange={(value: "fixed" | "criteria_based") => setFormData({ ...formData, ruleType: value })}>
          <SelectTrigger data-testid="select-rule-type">
            <SelectValue placeholder="Select Rule Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed" data-testid="option-fixed-rule">Fixed Rule</SelectItem>
            <SelectItem value="criteria_based" data-testid="option-criteria-rule">Criteria Based Rule</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic Criteria-based rule fields */}
      {formData.ruleType === "criteria_based" && (
        <div className="border rounded-lg p-4 space-y-4">
          {loadingExternalData && (
            <div className="text-sm text-gray-500">Loading external data...</div>
          )}
          
          {availableFilterTypes.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {availableFilterTypes.map((filterType) => {
                const fieldName = filterType.name.toLowerCase();
                const fieldKey = `${fieldName}Id` as keyof typeof formData;
                const currentValue = formData[fieldKey] as string | null;
                const values = filterTypeValues[filterType.id] || [];
                
                return (
                  <div key={filterType.id}>
                    <Label>{filterType.name}</Label>
                    <Select 
                      value={currentValue || "all"} 
                      onValueChange={(value) => {
                        if (value === "all") {
                          handleDropdownChange(fieldName, null, `All ${filterType.name}`);
                        } else {
                          const item = values.find(v => v.id === value);
                          handleDropdownChange(fieldName, value, item?.name || '');
                        }
                      }}
                    >
                      <SelectTrigger data-testid={`select-${fieldName}`}>
                        <SelectValue placeholder={`All ${filterType.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" data-testid={`option-all-${fieldName}`}>
                          All {filterType.name}
                        </SelectItem>
                        {values.map((item) => (
                          <SelectItem 
                            key={item.id} 
                            value={item.id} 
                            data-testid={`option-${fieldName}-${item.id}`}
                          >
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div>
        <Label>Class *</Label>
        <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
          <SelectTrigger data-testid="select-class">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Class" data-testid="option-all-class">All Class</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.dayLimitPerTransaction}
          onCheckedChange={(checked) => setFormData({ ...formData, dayLimitPerTransaction: checked })}
          data-testid="switch-day-limit"
        />
        <Label>Day Limit Per transaction</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isRestricted}
          onCheckedChange={(checked) => setFormData({ ...formData, isRestricted: checked })}
          data-testid="switch-restricted"
        />
        <Label>Is Restricted</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.status}
          onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
          data-testid="switch-status"
        />
        <Label>Status</Label>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="limitAmount">Limit</Label>
          <Input
            id="limitAmount"
            type="number"
            step="0.01"
            value={formData.limitAmount || ""}
            onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value || null })}
            placeholder="Enter limit amount"
            data-testid="input-limit-amount"
          />
        </div>
        <div className="w-24">
          <Label htmlFor="limitCurrency">Currency</Label>
          <Select value={formData.limitCurrency} onValueChange={(value) => setFormData({ ...formData, limitCurrency: value })}>
            <SelectTrigger data-testid="select-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR" data-testid="option-inr">INR</SelectItem>
              <SelectItem value="USD" data-testid="option-usd">USD</SelectItem>
              <SelectItem value="EUR" data-testid="option-eur">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expense Policy</h1>
              <p className="text-gray-600 dark:text-gray-400">Configure multi-level approval rules for expense management</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Expense Policies
                  </CardTitle>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-add-rule">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Rule</DialogTitle>
                      </DialogHeader>
                      <FormFields />
                      <Button
                        onClick={handleCreate}
                        disabled={createMutation.isPending || !formData.expenseHeadId}
                        className="w-full"
                        data-testid="button-save-rule"
                      >
                        {createMutation.isPending ? "Saving..." : "Save changes"}
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>Show</span>
                      <select className="border rounded px-2 py-1" defaultValue="25">
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <span>entries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Search:</span>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                          data-testid="input-search"
                        />
                      </div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">ID</TableHead>
                        <TableHead>Expense Head</TableHead>
                        <TableHead>Rule Type</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Limit</TableHead>
                        <TableHead>Restrictions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                        </TableRow>
                      ) : filteredPolicies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">No expense policies found</TableCell>
                        </TableRow>
                      ) : (
                        filteredPolicies.map((policy, index) => (
                          <TableRow key={policy.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell data-testid={`text-expense-head-${policy.id}`}>
                              {getExpenseHeadName(policy.expenseHeadId)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-rule-type-${policy.id}`}>
                                {policy.ruleType === "fixed" ? "Fixed Rule" : "Criteria Based"}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-class-${policy.id}`}>
                              {policy.class || "All Class"}
                            </TableCell>
                            <TableCell data-testid={`text-limit-${policy.id}`}>
                              {policy.limitAmount ? `₹${policy.limitAmount}` : "No Limit"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {policy.dayLimitPerTransaction && (
                                  <Badge variant="secondary" className="text-xs">Day Limit</Badge>
                                )}
                                {policy.isRestricted && (
                                  <Badge variant="destructive" className="text-xs">Restricted</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={policy.status ? "default" : "secondary"} data-testid={`badge-status-${policy.id}`}>
                                {policy.status ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(policy)}
                                  data-testid={`button-edit-${policy.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(policy.id)}
                                  data-testid={`button-delete-${policy.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Rule</DialogTitle>
                </DialogHeader>
                <FormFields />
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending || !formData.expenseHeadId}
                  className="w-full"
                  data-testid="button-update-rule"
                >
                  {updateMutation.isPending ? "Updating..." : "Save changes"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}