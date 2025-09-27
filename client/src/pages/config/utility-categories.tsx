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
import type { UtilityCategory } from "@shared/schema";

type UpdateUtilityCategory = {
  name: string;
  description: string;
  isActive: boolean;
};

type CreateUtilityCategory = {
  name: string;
  description: string;
  isCustom: boolean;
  isActive: boolean;
};

// Default utility categories with examples
const DEFAULT_CATEGORIES = [
  { name: "Electricity", description: "Electric power consumption bills (kWh, MWh)" },
  { name: "Water", description: "Water utility bills (Litres, Cubic Meters)" },
  { name: "Gas", description: "Gas utility bills (Cubic Feet, Cubic Meters, KG)" },
  { name: "Internet / Mobile Data", description: "Internet and mobile data bills (MB, GB, TB)" },
  { name: "Telephone", description: "Telephone services (Minutes, Calls, SMS Count)" },
  { name: "Fuel", description: "Fuel consumption (Litres, Gallons)" },
  { name: "Others", description: "Generic utility category (Units, Count, Hours)" },
];

export default function UtilityCategoriesConfig() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UtilityCategory | null>(null);
  const [formData, setFormData] = useState<UpdateUtilityCategory>({
    name: "",
    description: "",
    isActive: true,
  });
  const [addFormData, setAddFormData] = useState<CreateUtilityCategory>({
    name: "",
    description: "",
    isCustom: true,
    isActive: true,
  });

  const { toast } = useToast();

  // Fetch utility categories data
  const { data: categoriesData = [], isLoading } = useQuery<UtilityCategory[]>({
    queryKey: ["/api/utility-categories"],
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUtilityCategory }) =>
      apiRequest(`/api/utility-categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility-categories"] });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      toast({ title: "Success", description: "Utility category updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update utility category", variant: "destructive" });
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUtilityCategory) =>
      apiRequest("/api/utility-categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility-categories"] });
      setIsAddDialogOpen(false);
      setAddFormData({
        name: "",
        description: "",
        isCustom: true,
        isActive: true,
      });
      toast({ title: "Success", description: "Utility category created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create utility category", variant: "destructive" });
    },
  });

  // Setup default categories mutation
  const setupDefaultsMutation = useMutation({
    mutationFn: async () => {
      const promises = DEFAULT_CATEGORIES.map(category =>
        apiRequest("/api/utility-categories", {
          method: "POST",
          body: JSON.stringify({
            ...category,
            isCustom: false,
            isActive: true,
          }),
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility-categories"] });
      setIsSetupDialogOpen(false);
      toast({ title: "Success", description: "Default utility categories setup successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to setup default categories", variant: "destructive" });
    },
  });

  const filteredCategories = categoriesData.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (category: UtilityCategory) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name,
      description: category.description || "",
      isActive: category.isActive ?? true
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCategory) return;
    updateMutation.mutate({ id: editingCategory.id, data: formData });
  };

  const handleCreate = () => {
    createMutation.mutate(addFormData);
  };

  const handleSetupDefaults = () => {
    setupDefaultsMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-gray-50" data-testid="page-utility-categories">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">Utility Categories</h1>
                <p className="text-gray-600 mt-1">Manage utility bill categories for consumption-based expenses</p>
              </div>
              <div className="flex gap-2">
                {categoriesData.length === 0 && (
                  <Button 
                    onClick={() => setIsSetupDialogOpen(true)}
                    variant="outline"
                    data-testid="button-setup-defaults"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Setup Defaults
                  </Button>
                )}
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  data-testid="button-add-category"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Categories ({filteredCategories.length})</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading utility categories...</p>
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No utility categories found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {categoriesData.length === 0 ? "Get started by setting up default categories" : "Try adjusting your search"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category) => (
                        <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-gray-600 max-w-md truncate">{category.description}</TableCell>
                          <TableCell>
                            <Badge variant={category.isCustom ? "secondary" : "default"}>
                              {category.isCustom ? "Custom" : "Default"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.isActive ? "success" : "destructive"}>
                              {category.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(category)}
                              data-testid={`button-edit-${category.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Setup Defaults Dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent data-testid="dialog-setup-defaults">
          <DialogHeader>
            <DialogTitle>Setup Default Utility Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              This will create the following default utility categories:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {DEFAULT_CATEGORIES.map((category, index) => (
                <div key={index} className="border p-3 rounded-lg">
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-gray-600">{category.description}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsSetupDialogOpen(false)}
                data-testid="button-cancel-setup"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSetupDefaults}
                disabled={setupDefaultsMutation.isPending}
                data-testid="button-confirm-setup"
              >
                {setupDefaultsMutation.isPending ? "Setting up..." : "Setup Categories"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent data-testid="dialog-add-category">
          <DialogHeader>
            <DialogTitle>Add Utility Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-name">Category Name *</Label>
              <Input
                id="add-name"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                placeholder="e.g., Solar Power, Waste Management"
                data-testid="input-add-name"
              />
            </div>
            <div>
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                placeholder="Describe the utility category and suggested units"
                rows={3}
                data-testid="input-add-description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="add-active"
                checked={addFormData.isActive}
                onCheckedChange={(checked) => setAddFormData({ ...addFormData, isActive: checked })}
                data-testid="switch-add-active"
              />
              <Label htmlFor="add-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={createMutation.isPending || !addFormData.name.trim()}
                data-testid="button-save-add"
              >
                {createMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-category">
          <DialogHeader>
            <DialogTitle>Edit Utility Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="input-edit-description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-edit-active"
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={updateMutation.isPending || !formData.name.trim()}
                data-testid="button-save-edit"
              >
                {updateMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}