import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

type InsertExpenseGroup = {
  name: string;
  status: boolean;
};

export default function ExpenseGroups() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExpenseGroup | null>(null);
  const [formData, setFormData] = useState<InsertExpenseGroup>({
    name: "",
    status: true,
  });

  const { toast } = useToast();

  // Fetch expense groups
  const { data: groups = [], isLoading } = useQuery<ExpenseGroup[]>({
    queryKey: ["/api/expense-groups"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertExpenseGroup) => apiRequest("/api/expense-groups", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", status: true });
      toast({ title: "Success", description: "Expense group created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create expense group", variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseGroup> }) =>
      apiRequest(`/api/expense-groups/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups"] });
      setIsEditDialogOpen(false);
      setEditingGroup(null);
      toast({ title: "Success", description: "Expense group updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update expense group", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/expense-groups/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups"] });
      toast({ title: "Success", description: "Expense group deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete expense group", variant: "destructive" });
    },
  });

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (group: ExpenseGroup) => {
    setEditingGroup(group);
    setFormData({ name: group.name, status: group.status });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense group?")) {
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expense Group Master</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage expense group categories</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                      <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Expense Groups
                  </CardTitle>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-add-expense-group">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Expense Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Expense Group</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="groupName">Expense Group Name *</Label>
                          <Input
                            id="groupName"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter expense group name"
                            data-testid="input-group-name"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.status}
                            onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                            data-testid="switch-group-status"
                          />
                          <Label htmlFor="status">Status</Label>
                        </div>
                        <Button
                          onClick={handleCreate}
                          disabled={createMutation.isPending || !formData.name.trim()}
                          className="w-full"
                          data-testid="button-save-group"
                        >
                          {createMutation.isPending ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
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
                        <TableHead>Expense Group Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                        </TableRow>
                      ) : filteredGroups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">No expense groups found</TableCell>
                        </TableRow>
                      ) : (
                        filteredGroups.map((group, index) => (
                          <TableRow key={group.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell data-testid={`text-group-name-${group.id}`}>{group.name}</TableCell>
                            <TableCell>
                              <Badge variant={group.status ? "default" : "secondary"} data-testid={`badge-status-${group.id}`}>
                                {group.status ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(group)}
                                  data-testid={`button-edit-${group.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(group.id)}
                                  data-testid={`button-delete-${group.id}`}
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Expense Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editGroupName">Expense Group Name *</Label>
                    <Input
                      id="editGroupName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter expense group name"
                      data-testid="input-edit-group-name"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.status}
                      onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                      data-testid="switch-edit-group-status"
                    />
                    <Label htmlFor="editStatus">Status</Label>
                  </div>
                  <Button
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending || !formData.name.trim()}
                    className="w-full"
                    data-testid="button-update-group"
                  >
                    {updateMutation.isPending ? "Updating..." : "Save changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}