import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Pencil, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import type { TdsMaster } from "@shared/schema";

type UpdateTdsMaster = {
  defaultRate: string;
  description: string;
  isActive: boolean;
};

type CreateTdsMaster = {
  categoryName: string;
  category: string;
  defaultRate: string;
  description: string;
  isActive: boolean;
};

export default function TdsMasterConfig() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTds, setEditingTds] = useState<TdsMaster | null>(null);
  const [formData, setFormData] = useState<UpdateTdsMaster>({
    defaultRate: "",
    description: "",
    isActive: true,
  });
  const [addFormData, setAddFormData] = useState<CreateTdsMaster>({
    categoryName: "",
    category: "",
    defaultRate: "",
    description: "",
    isActive: true,
  });

  const { toast } = useToast();

  // Fetch TDS master data
  const { data: tdsData = [], isLoading } = useQuery<TdsMaster[]>({
    queryKey: ["/api/tds-master"],
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTdsMaster }) =>
      apiRequest(`/api/tds-master/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          defaultRate: parseFloat(data.defaultRate),
          description: data.description,
          isActive: data.isActive,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tds-master"] });
      setIsEditDialogOpen(false);
      setEditingTds(null);
      toast({ title: "Success", description: "TDS rate updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update TDS rate", variant: "destructive" });
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTdsMaster) =>
      apiRequest("/api/tds-master", {
        method: "POST",
        body: JSON.stringify({
          categoryName: data.categoryName,
          category: data.category.toLowerCase().replace(/\s+/g, '_'),
          defaultRate: parseFloat(data.defaultRate),
          description: data.description,
          isActive: data.isActive,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tds-master"] });
      setIsAddDialogOpen(false);
      setAddFormData({
        categoryName: "",
        category: "",
        defaultRate: "",
        description: "",
        isActive: true,
      });
      toast({ title: "Success", description: "TDS category created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create TDS category", variant: "destructive" });
    },
  });

  const filteredTdsData = tdsData.filter(tds =>
    tds.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tds.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (tds: TdsMaster) => {
    setEditingTds(tds);
    setFormData({ 
      defaultRate: tds.defaultRate.toString(), 
      description: tds.description || "",
      isActive: tds.isActive ?? true
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingTds) {
      // Validate rate
      const rate = parseFloat(formData.defaultRate);
      if (isNaN(rate) || rate < 0 || rate > 30) {
        toast({
          title: "Validation Error",
          description: "TDS Rate must be between 0% and 30%",
          variant: "destructive",
        });
        return;
      }

      updateMutation.mutate({ id: editingTds.id, data: formData });
    }
  };

  const handleAdd = () => {
    // Validate required fields
    if (!addFormData.categoryName.trim() || !addFormData.category.trim() || !addFormData.defaultRate.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name, category code, and TDS rate are required",
        variant: "destructive",
      });
      return;
    }

    // Validate rate
    const rate = parseFloat(addFormData.defaultRate);
    if (isNaN(rate) || rate < 0 || rate > 30) {
      toast({
        title: "Validation Error",
        description: "TDS Rate must be between 0% and 30%",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate category code
    const existingCategory = tdsData.find(tds => 
      tds.category.toLowerCase() === addFormData.category.toLowerCase().replace(/\s+/g, '_')
    );
    if (existingCategory) {
      toast({
        title: "Validation Error",
        description: "A TDS category with this code already exists",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(addFormData);
  };

  const handleOpenAddDialog = () => {
    setAddFormData({
      categoryName: "",
      category: "",
      defaultRate: "",
      description: "",
      isActive: true,
    });
    setIsAddDialogOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TDS Master Configuration</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage TDS rates for different categories</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                      <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    TDS Rate Configuration
                  </CardTitle>
                  <Button 
                    onClick={handleOpenAddDialog}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-add-tds"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New TDS Category
                  </Button>
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
                          placeholder="Search categories..."
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
                        <TableHead>Category</TableHead>
                        <TableHead>Rate (%)</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                        </TableRow>
                      ) : filteredTdsData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">No TDS categories found</TableCell>
                        </TableRow>
                      ) : (
                        filteredTdsData.map((tds, index) => (
                          <TableRow key={tds.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell data-testid={`text-category-${tds.id}`}>
                              <div>
                                <div className="font-medium">{tds.categoryName}</div>
                                <div className="text-sm text-gray-500">{tds.category}</div>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-rate-${tds.id}`}>
                              <span className="font-medium text-green-600">{Number(tds.defaultRate).toFixed(2)}%</span>
                            </TableCell>
                            <TableCell data-testid={`text-description-${tds.id}`}>
                              <div className="max-w-xs truncate">{tds.description}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={tds.isActive ? "default" : "secondary"} data-testid={`badge-status-${tds.id}`}>
                                {tds.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(tds)}
                                data-testid={`button-edit-${tds.id}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit TDS Rate</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={editingTds?.categoryName || ""}
                      readOnly
                      className="bg-gray-50"
                      data-testid="input-category-readonly"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRate">Default Rate (%) *</Label>
                    <Input
                      id="editRate"
                      type="number"
                      min="0"
                      max="30"
                      step="0.01"
                      value={formData.defaultRate}
                      onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                      placeholder="Enter TDS rate"
                      data-testid="input-edit-rate"
                    />
                    <p className="text-xs text-gray-500 mt-1">Rate should be between 0% and 30%</p>
                  </div>
                  <div>
                    <Label htmlFor="editDescription">Description</Label>
                    <Textarea
                      id="editDescription"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description for this TDS category"
                      data-testid="textarea-edit-description"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="switch-edit-status"
                    />
                    <Label htmlFor="editStatus">Active Status</Label>
                  </div>
                  <Button
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending || !formData.defaultRate.trim()}
                    className="w-full"
                    data-testid="button-update-tds"
                  >
                    {updateMutation.isPending ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New TDS Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="addCategoryName">Category Name *</Label>
                    <Input
                      id="addCategoryName"
                      value={addFormData.categoryName}
                      onChange={(e) => setAddFormData({ ...addFormData, categoryName: e.target.value })}
                      placeholder="Enter category display name (e.g., Professional Services)"
                      data-testid="input-add-category-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="addCategory">Category Code *</Label>
                    <Input
                      id="addCategory"
                      value={addFormData.category}
                      onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                      placeholder="Enter category code (e.g., professional)"
                      data-testid="input-add-category-code"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be used internally for identification</p>
                  </div>
                  <div>
                    <Label htmlFor="addRate">Default Rate (%) *</Label>
                    <Input
                      id="addRate"
                      type="number"
                      min="0"
                      max="30"
                      step="0.01"
                      value={addFormData.defaultRate}
                      onChange={(e) => setAddFormData({ ...addFormData, defaultRate: e.target.value })}
                      placeholder="Enter TDS rate"
                      data-testid="input-add-rate"
                    />
                    <p className="text-xs text-gray-500 mt-1">Rate should be between 0% and 30%</p>
                  </div>
                  <div>
                    <Label htmlFor="addDescription">Description</Label>
                    <Textarea
                      id="addDescription"
                      value={addFormData.description}
                      onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                      placeholder="Enter description for this TDS category"
                      data-testid="textarea-add-description"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={addFormData.isActive}
                      onCheckedChange={(checked) => setAddFormData({ ...addFormData, isActive: checked })}
                      data-testid="switch-add-status"
                    />
                    <Label htmlFor="addStatus">Active Status</Label>
                  </div>
                  <Button
                    onClick={handleAdd}
                    disabled={createMutation.isPending || !addFormData.categoryName.trim() || !addFormData.category.trim() || !addFormData.defaultRate.trim()}
                    className="w-full"
                    data-testid="button-create-tds"
                  >
                    {createMutation.isPending ? "Creating..." : "Create TDS Category"}
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