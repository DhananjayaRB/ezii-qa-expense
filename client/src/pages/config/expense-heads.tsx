import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

type ExpenseGroup = {
  id: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

type ExpenseHead = {
  id: string;
  name: string;
  expenseGroupId: string;
  accountingCode?: string;
  accountingLedger?: string;
  status: boolean;
  supportingRequired: boolean;
  claimForm: string;
  applicableFor: string;
  createdAt: string;
  updatedAt: string;
};

type InsertExpenseHead = {
  name: string;
  expenseGroupId: string;
  accountingCode?: string;
  accountingLedger?: string;
  status: boolean;
  supportingRequired: boolean;
  claimForm: string;
  applicableFor: string;
};

export default function ExpenseHeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHead, setEditingHead] = useState<ExpenseHead | null>(null);
  const [formData, setFormData] = useState<InsertExpenseHead>({
    name: "",
    expenseGroupId: "",
    accountingCode: "",
    accountingLedger: "",
    status: true,
    supportingRequired: false,
    claimForm: "expense",
    applicableFor: "both",
  });

  const { toast } = useToast();

  // Fetch expense groups for dropdown
  const { data: groups = [] } = useQuery<ExpenseGroup[]>({
    queryKey: ["/api/expense-groups"],
  });

  // Fetch expense heads
  const { data: heads = [], isLoading } = useQuery<ExpenseHead[]>({
    queryKey: ["/api/expense-heads"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertExpenseHead) => apiRequest("/api/expense-heads", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-heads"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Expense head created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create expense head", variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseHead> }) =>
      apiRequest(`/api/expense-heads/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-heads"] });
      setIsEditDialogOpen(false);
      setEditingHead(null);
      toast({ title: "Success", description: "Expense head updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update expense head", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/expense-heads/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-heads"] });
      toast({ title: "Success", description: "Expense head deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete expense head", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      expenseGroupId: "",
      accountingCode: "",
      accountingLedger: "",
      status: true,
      supportingRequired: false,
      claimForm: "expense",
      applicableFor: "both",
    });
  };

  const filteredHeads = heads.filter(head =>
    head.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.name || "Unknown Group";
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (head: ExpenseHead) => {
    setEditingHead(head);
    setFormData({
      name: head.name,
      expenseGroupId: head.expenseGroupId,
      accountingCode: head.accountingCode || "",
      accountingLedger: head.accountingLedger || "",
      status: head.status,
      supportingRequired: head.supportingRequired,
      claimForm: head.claimForm,
      applicableFor: head.applicableFor,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingHead) {
      updateMutation.mutate({ id: editingHead.id, data: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense head?")) {
      deleteMutation.mutate(id);
    }
  };


  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expense Head Master</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage expense head categories under expense groups</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Expense Heads
                  </CardTitle>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-add-expense-head">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Expense Head
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Expense Head</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="headName">Expense Head *</Label>
                          <Input
                            id="headName"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter expense head name"
                            data-testid="input-head-name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="expenseGroup">Expense Group *</Label>
                          <Select value={formData.expenseGroupId} onValueChange={(value) => setFormData({ ...formData, expenseGroupId: value })}>
                            <SelectTrigger data-testid="select-expense-group">
                              <SelectValue placeholder="-- Select Expense Group --" />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.filter(group => group.status).map((group) => (
                                <SelectItem key={group.id} value={group.id} data-testid={`option-group-${group.id}`}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="accountingCode">Accounting Code</Label>
                          <Input
                            id="accountingCode"
                            value={formData.accountingCode}
                            onChange={(e) => setFormData({ ...formData, accountingCode: e.target.value })}
                            placeholder="Enter accounting code"
                            data-testid="input-accounting-code"
                          />
                        </div>

                        <div>
                          <Label htmlFor="accountingLedger">Accounting Ledger</Label>
                          <Input
                            id="accountingLedger"
                            value={formData.accountingLedger}
                            onChange={(e) => setFormData({ ...formData, accountingLedger: e.target.value })}
                            placeholder="Enter accounting ledger"
                            data-testid="input-accounting-ledger"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.status}
                            onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                            data-testid="switch-head-status"
                          />
                          <Label>Status</Label>
                        </div>

                        <div>
                          <Label>Supporting Required for Each Transaction</Label>
                          <RadioGroup
                            value={formData.supportingRequired ? "yes" : "no"}
                            onValueChange={(value) => setFormData({ ...formData, supportingRequired: value === "yes" })}
                            className="flex gap-4 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="supporting-yes" data-testid="radio-supporting-yes" />
                              <Label htmlFor="supporting-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="supporting-no" data-testid="radio-supporting-no" />
                              <Label htmlFor="supporting-no">No</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label>Claim Form</Label>
                          <RadioGroup
                            value={formData.claimForm}
                            onValueChange={(value) => setFormData({ ...formData, claimForm: value })}
                            className="flex gap-4 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ticket" id="claim-ticket" data-testid="radio-claim-ticket" />
                              <Label htmlFor="claim-ticket">Ticket</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="accommodation" id="claim-accommodation" data-testid="radio-claim-accommodation" />
                              <Label htmlFor="claim-accommodation">Accommodation</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="conveyance" id="claim-conveyance" data-testid="radio-claim-conveyance" />
                              <Label htmlFor="claim-conveyance">Conveyance</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="expense" id="claim-expense" data-testid="radio-claim-expense" />
                              <Label htmlFor="claim-expense">Expense</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label>Applicable For *</Label>
                          <RadioGroup
                            value={formData.applicableFor}
                            onValueChange={(value) => setFormData({ ...formData, applicableFor: value })}
                            className="flex gap-4 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="employee_only" id="applicable-employee" data-testid="radio-applicable-employee" />
                              <Label htmlFor="applicable-employee">Employee Only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="vendor_only" id="applicable-vendor" data-testid="radio-applicable-vendor" />
                              <Label htmlFor="applicable-vendor">Vendor Only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="both" id="applicable-both" data-testid="radio-applicable-both" />
                              <Label htmlFor="applicable-both">Both</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                      <Button
                        onClick={handleCreate}
                        disabled={createMutation.isPending || !formData.name.trim() || !formData.expenseGroupId}
                        className="w-full"
                        data-testid="button-save-head"
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
                        <TableHead>Expense Group</TableHead>
                        <TableHead>Claim Form</TableHead>
                        <TableHead>Applicable For</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                        </TableRow>
                      ) : filteredHeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">No expense heads found</TableCell>
                        </TableRow>
                      ) : (
                        filteredHeads.map((head, index) => (
                          <TableRow key={head.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell data-testid={`text-head-name-${head.id}`}>{head.name}</TableCell>
                            <TableCell data-testid={`text-group-name-${head.id}`}>{getGroupName(head.expenseGroupId)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-claim-form-${head.id}`}>
                                {head.claimForm.charAt(0).toUpperCase() + head.claimForm.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" data-testid={`badge-applicable-for-${head.id}`}>
                                {head.applicableFor === "employee_only" ? "Employee Only" : 
                                 head.applicableFor === "vendor_only" ? "Vendor Only" : "Both"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={head.status ? "default" : "secondary"} data-testid={`badge-status-${head.id}`}>
                                {head.status ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(head)}
                                  data-testid={`button-edit-${head.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(head.id)}
                                  data-testid={`button-delete-${head.id}`}
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Expense Head</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="headNameEdit">Expense Head *</Label>
                    <Input
                      id="headNameEdit"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter expense head name"
                      data-testid="input-head-name-edit"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expenseGroupEdit">Expense Group *</Label>
                    <Select value={formData.expenseGroupId} onValueChange={(value) => setFormData({ ...formData, expenseGroupId: value })}>
                      <SelectTrigger data-testid="select-expense-group-edit">
                        <SelectValue placeholder="-- Select Expense Group --" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.filter(group => group.status).map((group) => (
                          <SelectItem key={group.id} value={group.id} data-testid={`option-group-edit-${group.id}`}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="accountingCodeEdit">Accounting Code</Label>
                    <Input
                      id="accountingCodeEdit"
                      value={formData.accountingCode}
                      onChange={(e) => setFormData({ ...formData, accountingCode: e.target.value })}
                      placeholder="Enter accounting code"
                      data-testid="input-accounting-code-edit"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountingLedgerEdit">Accounting Ledger</Label>
                    <Input
                      id="accountingLedgerEdit"
                      value={formData.accountingLedger}
                      onChange={(e) => setFormData({ ...formData, accountingLedger: e.target.value })}
                      placeholder="Enter accounting ledger"
                      data-testid="input-accounting-ledger-edit"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.status}
                      onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                      data-testid="switch-head-status-edit"
                    />
                    <Label>Status</Label>
                  </div>

                  <div>
                    <Label>Supporting Required for Each Transaction</Label>
                    <RadioGroup
                      value={formData.supportingRequired ? "yes" : "no"}
                      onValueChange={(value) => setFormData({ ...formData, supportingRequired: value === "yes" })}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="supporting-yes-edit" data-testid="radio-supporting-yes-edit" />
                        <Label htmlFor="supporting-yes-edit">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="supporting-no-edit" data-testid="radio-supporting-no-edit" />
                        <Label htmlFor="supporting-no-edit">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Claim Form</Label>
                    <RadioGroup
                      value={formData.claimForm}
                      onValueChange={(value) => setFormData({ ...formData, claimForm: value })}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ticket" id="claim-ticket-edit" data-testid="radio-claim-ticket-edit" />
                        <Label htmlFor="claim-ticket-edit">Ticket</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="accommodation" id="claim-accommodation-edit" data-testid="radio-claim-accommodation-edit" />
                        <Label htmlFor="claim-accommodation-edit">Accommodation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="conveyance" id="claim-conveyance-edit" data-testid="radio-claim-conveyance-edit" />
                        <Label htmlFor="claim-conveyance-edit">Conveyance</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expense" id="claim-expense-edit" data-testid="radio-claim-expense-edit" />
                        <Label htmlFor="claim-expense-edit">Expense</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Applicable For *</Label>
                    <RadioGroup
                      value={formData.applicableFor}
                      onValueChange={(value) => setFormData({ ...formData, applicableFor: value })}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="employee_only" id="applicable-employee-edit" data-testid="radio-applicable-employee-edit" />
                        <Label htmlFor="applicable-employee-edit">Employee Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vendor_only" id="applicable-vendor-edit" data-testid="radio-applicable-vendor-edit" />
                        <Label htmlFor="applicable-vendor-edit">Vendor Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="applicable-both-edit" data-testid="radio-applicable-both-edit" />
                        <Label htmlFor="applicable-both-edit">Both</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending || !formData.name.trim() || !formData.expenseGroupId}
                  className="w-full"
                  data-testid="button-update-head"
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