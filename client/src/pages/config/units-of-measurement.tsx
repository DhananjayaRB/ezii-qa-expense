import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Pencil, Settings, Plus, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import type { UnitsOfMeasurement, UtilityCategory } from "@shared/schema";

type UpdateUnitsOfMeasurement = {
  name: string;
  abbreviation: string;
  utilityCategoryId: string;
  isActive: boolean;
};

type CreateUnitsOfMeasurement = {
  name: string;
  abbreviation: string;
  utilityCategoryId: string;
  isCustom: boolean;
  isActive: boolean;
};

// Default units of measurement for different categories
const DEFAULT_UNITS_BY_CATEGORY = {
  "Electricity": [
    { name: "Kilowatt Hours", abbreviation: "kWh" },
    { name: "Megawatt Hours", abbreviation: "MWh" },
  ],
  "Water": [
    { name: "Litres", abbreviation: "L" },
    { name: "Cubic Meters", abbreviation: "m³" },
    { name: "Gallons", abbreviation: "gal" },
  ],
  "Gas": [
    { name: "Cubic Feet", abbreviation: "ft³" },
    { name: "Cubic Meters", abbreviation: "m³" },
    { name: "Kilograms", abbreviation: "kg" },
  ],
  "Internet / Mobile Data": [
    { name: "Megabytes", abbreviation: "MB" },
    { name: "Gigabytes", abbreviation: "GB" },
    { name: "Terabytes", abbreviation: "TB" },
  ],
  "Telephone": [
    { name: "Minutes", abbreviation: "min" },
    { name: "Seconds", abbreviation: "sec" },
    { name: "SMS Count", abbreviation: "SMS" },
    { name: "Calls", abbreviation: "calls" },
  ],
  "Fuel": [
    { name: "Litres", abbreviation: "L" },
    { name: "Gallons", abbreviation: "gal" },
  ],
  "Others": [
    { name: "Units", abbreviation: "units" },
    { name: "Count", abbreviation: "count" },
    { name: "Hours", abbreviation: "hrs" },
  ],
};

export default function UnitsOfMeasurementConfig() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitsOfMeasurement | null>(null);
  const [formData, setFormData] = useState<UpdateUnitsOfMeasurement>({
    name: "",
    abbreviation: "",
    utilityCategoryId: "",
    isActive: true,
  });
  const [addFormData, setAddFormData] = useState<CreateUnitsOfMeasurement>({
    name: "",
    abbreviation: "",
    utilityCategoryId: "",
    isCustom: true,
    isActive: true,
  });

  const { toast } = useToast();

  // Fetch utility categories for dropdowns
  const { data: categoriesData = [] } = useQuery<UtilityCategory[]>({
    queryKey: ["/api/utility-categories"],
  });

  // Fetch units of measurement data
  const { data: unitsData = [], isLoading } = useQuery<UnitsOfMeasurement[]>({
    queryKey: ["/api/units-of-measurement"],
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUnitsOfMeasurement }) =>
      apiRequest(`/api/units-of-measurement/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units-of-measurement"] });
      setIsEditDialogOpen(false);
      setEditingUnit(null);
      toast({ title: "Success", description: "Unit of measurement updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update unit of measurement", variant: "destructive" });
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUnitsOfMeasurement) =>
      apiRequest("/api/units-of-measurement", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units-of-measurement"] });
      setIsAddDialogOpen(false);
      setAddFormData({
        name: "",
        abbreviation: "",
        utilityCategoryId: "",
        isCustom: true,
        isActive: true,
      });
      toast({ title: "Success", description: "Unit of measurement created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create unit of measurement", variant: "destructive" });
    },
  });

  // Setup default units mutation
  const setupDefaultsMutation = useMutation({
    mutationFn: async () => {
      const promises: Promise<any>[] = [];
      
      categoriesData.forEach(category => {
        const defaultUnits = DEFAULT_UNITS_BY_CATEGORY[category.name as keyof typeof DEFAULT_UNITS_BY_CATEGORY] || [];
        defaultUnits.forEach(unit => {
          promises.push(
            apiRequest("/api/units-of-measurement", {
              method: "POST",
              body: JSON.stringify({
                name: unit.name,
                abbreviation: unit.abbreviation,
                utilityCategoryId: category.id,
                isCustom: false,
                isActive: true,
              }),
            })
          );
        });
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units-of-measurement"] });
      setIsSetupDialogOpen(false);
      toast({ title: "Success", description: "Default units of measurement setup successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to setup default units", variant: "destructive" });
    },
  });

  // Create category lookup for display
  const categoryLookup = Object.fromEntries(
    categoriesData.map(cat => [cat.id, cat])
  );

  const filteredUnits = unitsData.filter(unit => {
    const matchesSearch = 
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (categoryLookup[unit.utilityCategoryId || ""]?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategoryFilter === "all" || unit.utilityCategoryId === selectedCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (unit: UnitsOfMeasurement) => {
    setEditingUnit(unit);
    setFormData({ 
      name: unit.name,
      abbreviation: unit.abbreviation,
      utilityCategoryId: unit.utilityCategoryId || "",
      isActive: unit.isActive ?? true
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingUnit) return;
    updateMutation.mutate({ id: editingUnit.id, data: formData });
  };

  const handleCreate = () => {
    createMutation.mutate(addFormData);
  };

  const handleSetupDefaults = () => {
    setupDefaultsMutation.mutate();
  };

  // Get preview of what will be created
  const getSetupPreview = () => {
    const preview: { categoryName: string; units: { name: string; abbreviation: string }[] }[] = [];
    categoriesData.forEach(category => {
      const defaultUnits = DEFAULT_UNITS_BY_CATEGORY[category.name as keyof typeof DEFAULT_UNITS_BY_CATEGORY] || [];
      if (defaultUnits.length > 0) {
        preview.push({
          categoryName: category.name,
          units: defaultUnits,
        });
      }
    });
    return preview;
  };

  return (
    <div className="flex h-screen bg-gray-50" data-testid="page-units-of-measurement">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">Units of Measurement</h1>
                <p className="text-gray-600 mt-1">Manage units of measurement linked to utility categories</p>
              </div>
              <div className="flex gap-2">
                {unitsData.length === 0 && categoriesData.length > 0 && (
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
                  disabled={categoriesData.length === 0}
                  data-testid="button-add-unit"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Unit
                </Button>
              </div>
            </div>

            {categoriesData.length === 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Link className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">No utility categories found</span>
                  </div>
                  <p className="text-orange-700 mt-1">
                    You need to create utility categories first before adding units of measurement.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Units ({filteredUnits.length})</CardTitle>
                  <div className="flex gap-4">
                    <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                      <SelectTrigger className="w-48" data-testid="select-category-filter">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categoriesData.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search units..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading units of measurement...</p>
                  </div>
                ) : filteredUnits.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No units of measurement found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {unitsData.length === 0 ? "Get started by setting up default units" : "Try adjusting your search or filters"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit Name</TableHead>
                        <TableHead>Abbreviation</TableHead>
                        <TableHead>Utility Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnits.map((unit) => (
                        <TableRow key={unit.id} data-testid={`row-unit-${unit.id}`}>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {unit.abbreviation}
                            </Badge>
                          </TableCell>
                          <TableCell>{categoryLookup[unit.utilityCategoryId || ""]?.name || "Unknown"}</TableCell>
                          <TableCell>
                            <Badge variant={unit.isCustom ? "secondary" : "default"}>
                              {unit.isCustom ? "Custom" : "Default"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={unit.isActive ? "success" : "destructive"}>
                              {unit.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(unit)}
                              data-testid={`button-edit-${unit.id}`}
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
        <DialogContent className="max-w-2xl" data-testid="dialog-setup-defaults">
          <DialogHeader>
            <DialogTitle>Setup Default Units of Measurement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              This will create default units of measurement for your utility categories:
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {getSetupPreview().map((category, index) => (
                <div key={index} className="border p-3 rounded-lg">
                  <div className="font-medium text-blue-700 mb-2">{category.categoryName}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {category.units.map((unit, unitIndex) => (
                      <div key={unitIndex} className="text-sm text-gray-600 flex justify-between">
                        <span>{unit.name}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {unit.abbreviation}
                        </Badge>
                      </div>
                    ))}
                  </div>
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
                {setupDefaultsMutation.isPending ? "Setting up..." : "Setup Units"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Unit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent data-testid="dialog-add-unit">
          <DialogHeader>
            <DialogTitle>Add Unit of Measurement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-category">Utility Category *</Label>
              <Select value={addFormData.utilityCategoryId} onValueChange={(value) => setAddFormData({ ...addFormData, utilityCategoryId: value })}>
                <SelectTrigger data-testid="select-add-category">
                  <SelectValue placeholder="Select utility category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-name">Unit Name *</Label>
              <Input
                id="add-name"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                placeholder="e.g., Kilowatt Hours, Cubic Meters"
                data-testid="input-add-name"
              />
            </div>
            <div>
              <Label htmlFor="add-abbreviation">Abbreviation *</Label>
              <Input
                id="add-abbreviation"
                value={addFormData.abbreviation}
                onChange={(e) => setAddFormData({ ...addFormData, abbreviation: e.target.value })}
                placeholder="e.g., kWh, m³"
                data-testid="input-add-abbreviation"
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
                disabled={createMutation.isPending || !addFormData.name.trim() || !addFormData.abbreviation.trim() || !addFormData.utilityCategoryId}
                data-testid="button-save-add"
              >
                {createMutation.isPending ? "Creating..." : "Create Unit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-unit">
          <DialogHeader>
            <DialogTitle>Edit Unit of Measurement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category">Utility Category *</Label>
              <Select value={formData.utilityCategoryId} onValueChange={(value) => setFormData({ ...formData, utilityCategoryId: value })}>
                <SelectTrigger data-testid="select-edit-category">
                  <SelectValue placeholder="Select utility category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-name">Unit Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-abbreviation">Abbreviation *</Label>
              <Input
                id="edit-abbreviation"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                data-testid="input-edit-abbreviation"
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
                disabled={updateMutation.isPending || !formData.name.trim() || !formData.abbreviation.trim() || !formData.utilityCategoryId}
                data-testid="button-save-edit"
              >
                {updateMutation.isPending ? "Updating..." : "Update Unit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}