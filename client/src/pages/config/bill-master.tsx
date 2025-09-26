import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Pencil, Settings, Plus, Trash2, GripVertical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import type { BillMasterType, BillMasterField } from "@shared/schema";

// Default hardcoded bill types for reference
const DEFAULT_BILL_TYPES = [
  "Vendor Dues Form (for predictable expenses)",
  "Utility Bill Form (for consumption-based expenses)", 
  "Standard Vendor Bill Form",
  "Non-Registered Vendor Payment Form",
  "Purchase Order (PO) to Invoice Matching Form"
];

// Available field types with their properties
const FIELD_TYPES = [
  { value: "text", label: "Text", description: "Single line text input" },
  { value: "textarea", label: "Text Area", description: "Multi-line text input" },
  { value: "number", label: "Number", description: "Numeric input" },
  { value: "currency", label: "Currency", description: "Currency amount" },
  { value: "date", label: "Date", description: "Date picker" },
  { value: "email", label: "Email", description: "Email address" },
  { value: "phone", label: "Phone", description: "Phone number" },
  { value: "select", label: "Dropdown", description: "Single selection dropdown" },
  { value: "checkbox", label: "Checkbox", description: "Yes/No checkbox" },
  { value: "file", label: "File Upload", description: "File attachment" }
];

const FIELD_WIDTHS = [
  { value: "full", label: "Full Width" },
  { value: "half", label: "Half Width" },
  { value: "third", label: "One Third" },
  { value: "quarter", label: "One Quarter" }
];

type CreateBillType = {
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
};

type CreateBillField = {
  billTypeId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  isVisible: boolean;
  fieldOrder: number;
  placeholder: string;
  helperText: string;
  defaultValue: string;
  validationRules: any;
  fieldOptions: any;
  width: string;
};

export default function BillMasterConfig() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddBillTypeDialogOpen, setIsAddBillTypeDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [selectedBillType, setSelectedBillType] = useState<BillMasterType | null>(null);
  const [editingField, setEditingField] = useState<BillMasterField | null>(null);
  const [activeTab, setActiveTab] = useState("custom");

  const [billTypeFormData, setBillTypeFormData] = useState<CreateBillType>({
    name: "",
    description: "",
    isActive: true,
    displayOrder: 1,
  });

  const [fieldFormData, setFieldFormData] = useState<CreateBillField>({
    billTypeId: "",
    fieldName: "",
    fieldLabel: "",
    fieldType: "text",
    isRequired: false,
    isVisible: true,
    fieldOrder: 1,
    placeholder: "",
    helperText: "",
    defaultValue: "",
    validationRules: {},
    fieldOptions: {},
    width: "full",
  });

  const { toast } = useToast();

  // Fetch bill master types
  const { data: billTypes = [], isLoading } = useQuery<(BillMasterType & { fields: BillMasterField[] })[]>({
    queryKey: ["/api/bill-master/types"],
  });

  // Create bill type mutation
  const createBillTypeMutation = useMutation({
    mutationFn: (data: CreateBillType) =>
      apiRequest("/api/bill-master/types", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-master/types"] });
      setIsAddBillTypeDialogOpen(false);
      setBillTypeFormData({
        name: "",
        description: "",
        isActive: true,
        displayOrder: 1,
      });
      toast({ title: "Success", description: "Bill type created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create bill type", variant: "destructive" });
    },
  });

  // Update bill type mutation
  const updateBillTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BillMasterType> }) =>
      apiRequest(`/api/bill-master/types/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-master/types"] });
      toast({ title: "Success", description: "Bill type updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update bill type", variant: "destructive" });
    },
  });

  // Delete bill type mutation
  const deleteBillTypeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/bill-master/types/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-master/types"] });
      toast({ title: "Success", description: "Bill type deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete bill type", variant: "destructive" });
    },
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: (data: CreateBillField) =>
      apiRequest("/api/bill-master/fields", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-master/types"] });
      setIsFieldDialogOpen(false);
      resetFieldForm();
      toast({ title: "Success", description: "Field created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create field", variant: "destructive" });
    },
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BillMasterField> }) =>
      apiRequest(`/api/bill-master/fields/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-master/types"] });
      setIsFieldDialogOpen(false);
      setEditingField(null);
      resetFieldForm();
      toast({ title: "Success", description: "Field updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update field", variant: "destructive" });
    },
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/bill-master/fields/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-master/types"] });
      toast({ title: "Success", description: "Field deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete field", variant: "destructive" });
    },
  });

  const filteredBillTypes = billTypes.filter(billType =>
    billType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    billType.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetFieldForm = () => {
    setFieldFormData({
      billTypeId: "",
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      isRequired: false,
      isVisible: true,
      fieldOrder: 1,
      placeholder: "",
      helperText: "",
      defaultValue: "",
      validationRules: {},
      fieldOptions: {},
      width: "full",
    });
  };

  const handleAddField = (billType: BillMasterType) => {
    setSelectedBillType(billType);
    setFieldFormData({
      ...fieldFormData,
      billTypeId: billType.id,
      fieldOrder: billType.fields.length + 1,
    });
    setIsFieldDialogOpen(true);
  };

  const handleEditField = (field: BillMasterField) => {
    setEditingField(field);
    setFieldFormData({
      billTypeId: field.billTypeId,
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      isVisible: field.isVisible,
      fieldOrder: field.fieldOrder,
      placeholder: field.placeholder || "",
      helperText: field.helperText || "",
      defaultValue: field.defaultValue || "",
      validationRules: field.validationRules || {},
      fieldOptions: field.fieldOptions || {},
      width: field.width,
    });
    setIsFieldDialogOpen(true);
  };

  const handleSaveField = () => {
    if (editingField) {
      updateFieldMutation.mutate({
        id: editingField.id,
        data: fieldFormData,
      });
    } else {
      createFieldMutation.mutate(fieldFormData);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bill Master Configuration</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage bill types and their custom fields for vendor claims
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="defaults" data-testid="tab-defaults">Default Bill Types</TabsTrigger>
                <TabsTrigger value="custom" data-testid="tab-custom">Custom Bill Types</TabsTrigger>
              </TabsList>

              <TabsContent value="defaults" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Default Bill Types (Read-Only)
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      These are the standard bill types that come with the system. They cannot be modified.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {DEFAULT_BILL_TYPES.map((billType, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          data-testid={`default-bill-type-${index}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{billType}</p>
                            <Badge variant="secondary" className="mt-1">
                              System Default
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Custom Bill Types</CardTitle>
                      <Button 
                        onClick={() => setIsAddBillTypeDialogOpen(true)}
                        data-testid="button-add-bill-type"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Bill Type
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search bill types..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="max-w-sm"
                          data-testid="input-search"
                        />
                      </div>

                      {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                      ) : filteredBillTypes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {searchTerm ? "No bill types found matching your search." : "No custom bill types created yet."}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredBillTypes.map((billType) => (
                            <Card key={billType.id} className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg">{billType.name}</CardTitle>
                                    {billType.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {billType.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={billType.isActive ? "default" : "secondary"}>
                                      {billType.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddField(billType)}
                                      data-testid={`button-add-field-${billType.id}`}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Field
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateBillTypeMutation.mutate({
                                        id: billType.id,
                                        data: { isActive: !billType.isActive }
                                      })}
                                      data-testid={`button-toggle-${billType.id}`}
                                    >
                                      {billType.isActive ? "Deactivate" : "Activate"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deleteBillTypeMutation.mutate(billType.id)}
                                      className="text-red-600 hover:text-red-700"
                                      data-testid={`button-delete-${billType.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              {billType.fields.length > 0 && (
                                <CardContent className="pt-0">
                                  <Separator className="mb-4" />
                                  <h4 className="font-semibold mb-3">Fields ({billType.fields.length})</h4>
                                  <div className="space-y-2">
                                    {billType.fields
                                      .sort((a, b) => a.fieldOrder - b.fieldOrder)
                                      .map((field) => (
                                        <div
                                          key={field.id}
                                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                          data-testid={`field-${field.id}`}
                                        >
                                          <div className="flex items-center space-x-3">
                                            <GripVertical className="h-4 w-4 text-gray-400" />
                                            <div>
                                              <p className="font-medium">{field.fieldLabel}</p>
                                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                <Badge variant="outline" className="text-xs">
                                                  {FIELD_TYPES.find(t => t.value === field.fieldType)?.label}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                  {FIELD_WIDTHS.find(w => w.value === field.width)?.label}
                                                </Badge>
                                                {field.isRequired && (
                                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                                )}
                                                {!field.isVisible && (
                                                  <Badge variant="secondary" className="text-xs">Hidden</Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditField(field)}
                                              data-testid={`button-edit-field-${field.id}`}
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => deleteFieldMutation.mutate(field.id)}
                                              className="text-red-600 hover:text-red-700"
                                              data-testid={`button-delete-field-${field.id}`}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Add Bill Type Dialog */}
            <Dialog open={isAddBillTypeDialogOpen} onOpenChange={setIsAddBillTypeDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Bill Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Bill Type Name *</Label>
                    <Input
                      id="name"
                      value={billTypeFormData.name}
                      onChange={(e) => setBillTypeFormData({ ...billTypeFormData, name: e.target.value })}
                      placeholder="e.g., Custom Vendor Bill Form"
                      data-testid="input-bill-type-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={billTypeFormData.description}
                      onChange={(e) => setBillTypeFormData({ ...billTypeFormData, description: e.target.value })}
                      placeholder="Brief description of this bill type..."
                      data-testid="textarea-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={billTypeFormData.displayOrder}
                      onChange={(e) => setBillTypeFormData({ ...billTypeFormData, displayOrder: parseInt(e.target.value) || 1 })}
                      min="1"
                      data-testid="input-display-order"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={billTypeFormData.isActive}
                      onCheckedChange={(checked) => setBillTypeFormData({ ...billTypeFormData, isActive: checked })}
                      data-testid="switch-is-active"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddBillTypeDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createBillTypeMutation.mutate(billTypeFormData)}
                      disabled={!billTypeFormData.name.trim()}
                      data-testid="button-save-bill-type"
                    >
                      Create Bill Type
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add/Edit Field Dialog */}
            <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingField ? "Edit Field" : "Add New Field"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fieldName">Field Name (Internal) *</Label>
                      <Input
                        id="fieldName"
                        value={fieldFormData.fieldName}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, fieldName: e.target.value })}
                        placeholder="e.g., vendor_name"
                        data-testid="input-field-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fieldLabel">Field Label (Display) *</Label>
                      <Input
                        id="fieldLabel"
                        value={fieldFormData.fieldLabel}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, fieldLabel: e.target.value })}
                        placeholder="e.g., Vendor Name"
                        data-testid="input-field-label"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fieldType">Field Type *</Label>
                      <Select
                        value={fieldFormData.fieldType}
                        onValueChange={(value) => setFieldFormData({ ...fieldFormData, fieldType: value })}
                      >
                        <SelectTrigger data-testid="select-field-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="width">Field Width</Label>
                      <Select
                        value={fieldFormData.width}
                        onValueChange={(value) => setFieldFormData({ ...fieldFormData, width: value })}
                      >
                        <SelectTrigger data-testid="select-width">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_WIDTHS.map((width) => (
                            <SelectItem key={width.value} value={width.value}>
                              {width.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="placeholder">Placeholder Text</Label>
                      <Input
                        id="placeholder"
                        value={fieldFormData.placeholder}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                        placeholder="Enter placeholder text..."
                        data-testid="input-placeholder"
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultValue">Default Value</Label>
                      <Input
                        id="defaultValue"
                        value={fieldFormData.defaultValue}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, defaultValue: e.target.value })}
                        placeholder="Enter default value..."
                        data-testid="input-default-value"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="helperText">Helper Text</Label>
                    <Textarea
                      id="helperText"
                      value={fieldFormData.helperText}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, helperText: e.target.value })}
                      placeholder="Additional help text for this field..."
                      data-testid="textarea-helper-text"
                    />
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isRequired"
                        checked={fieldFormData.isRequired}
                        onCheckedChange={(checked) => setFieldFormData({ ...fieldFormData, isRequired: checked })}
                        data-testid="switch-required"
                      />
                      <Label htmlFor="isRequired">Required Field</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isVisible"
                        checked={fieldFormData.isVisible}
                        onCheckedChange={(checked) => setFieldFormData({ ...fieldFormData, isVisible: checked })}
                        data-testid="switch-visible"
                      />
                      <Label htmlFor="isVisible">Visible</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fieldOrder">Display Order</Label>
                    <Input
                      id="fieldOrder"
                      type="number"
                      value={fieldFormData.fieldOrder}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, fieldOrder: parseInt(e.target.value) || 1 })}
                      min="1"
                      data-testid="input-field-order"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsFieldDialogOpen(false);
                        setEditingField(null);
                        resetFieldForm();
                      }}
                      data-testid="button-cancel-field"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveField}
                      disabled={!fieldFormData.fieldName.trim() || !fieldFormData.fieldLabel.trim()}
                      data-testid="button-save-field"
                    >
                      {editingField ? "Update Field" : "Add Field"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}