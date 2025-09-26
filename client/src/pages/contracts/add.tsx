import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import FileUpload from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save, Building2, FileText, Calendar, DollarSign, Paperclip } from "lucide-react";
import type { Vendor, InsertContract } from "@shared/schema";

export default function AddContract() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    vendorId: "",
    vendorName: "",
    agreementReference: "",
    expenseType: "",
    agreementStartDate: "",
    agreementEndDate: "",
    dueDate: "",
    amount: "",
    frequency: "",
    supportingDocuments: [] as any[],
    status: "active",
  });

  // Fetch vendors for dropdown
  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-populate vendor name when vendor is selected
    if (field === "vendorId") {
      const selectedVendor = vendors.find(v => v.id === value);
      if (selectedVendor) {
        setFormData(prev => ({ ...prev, vendorName: selectedVendor.name }));
      }
    }

    // Auto-calculate due date based on start date and frequency
    if (field === "agreementStartDate" || field === "frequency") {
      setTimeout(() => calculateDueDate(), 100);
    }
  };

  const calculateDueDate = () => {
    if (formData.agreementStartDate && formData.frequency) {
      const startDate = new Date(formData.agreementStartDate);
      let dueDate = new Date(startDate);

      switch (formData.frequency) {
        case "monthly":
          dueDate.setMonth(startDate.getMonth() + 1);
          break;
        case "quarterly":
          dueDate.setMonth(startDate.getMonth() + 3);
          break;
        case "annually":
          dueDate.setFullYear(startDate.getFullYear() + 1);
          break;
        default:
          dueDate = startDate;
      }

      setFormData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    }
  };

  useEffect(() => {
    calculateDueDate();
  }, [formData.agreementStartDate, formData.frequency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!formData.title || !formData.vendorId || !formData.expenseType || 
          !formData.agreementStartDate || !formData.amount || !formData.frequency) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const contractData: InsertContract = {
        title: formData.title,
        vendorId: formData.vendorId,
        vendorName: formData.vendorName,
        agreementReference: formData.agreementReference || undefined,
        expenseType: formData.expenseType,
        agreementStartDate: new Date(formData.agreementStartDate),
        agreementEndDate: formData.agreementEndDate ? new Date(formData.agreementEndDate) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        supportingDocuments: formData.supportingDocuments,
        status: formData.status,
        isAutoPopulated: false,
      };

      await apiRequest("/api/contracts", {
        method: "POST",
        body: JSON.stringify(contractData),
      });

      // Invalidate contracts cache
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });

      toast({
        title: "Success",
        description: "Contract created successfully",
      });

      setLocation("/contracts");
    } catch (error) {
      console.error("Error creating contract:", error);
      toast({
        title: "Error",
        description: "Failed to create contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-8 max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/contracts")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Contract</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Create a new vendor contract or agreement
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Contract Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter contract title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      data-testid="input-contract-title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) => handleInputChange("vendorId", value)}
                      disabled={isLoadingVendors}
                    >
                      <SelectTrigger data-testid="select-vendor">
                        <SelectValue placeholder={isLoadingVendors ? "Loading vendors..." : "Select vendor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agreementReference">Agreement/Contract Reference</Label>
                    <Input
                      id="agreementReference"
                      placeholder="Enter reference number"
                      value={formData.agreementReference}
                      onChange={(e) => handleInputChange("agreementReference", e.target.value)}
                      data-testid="input-agreement-reference"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expenseType">Expense Type *</Label>
                    <Select
                      value={formData.expenseType}
                      onValueChange={(value) => handleInputChange("expenseType", value)}
                    >
                      <SelectTrigger data-testid="select-expense-type">
                        <SelectValue placeholder="Select expense type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="lease">Lease</SelectItem>
                        <SelectItem value="subscription_fee">Subscription Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates and Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Dates and Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agreementStartDate">Agreement Start Date *</Label>
                    <Input
                      id="agreementStartDate"
                      type="date"
                      value={formData.agreementStartDate}
                      onChange={(e) => handleInputChange("agreementStartDate", e.target.value)}
                      data-testid="input-start-date"
                      required
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Format: DD-MM-YYYY
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agreementEndDate">Agreement End Date (Optional)</Label>
                    <Input
                      id="agreementEndDate"
                      type="date"
                      value={formData.agreementEndDate}
                      onChange={(e) => handleInputChange("agreementEndDate", e.target.value)}
                      data-testid="input-end-date"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Format: DD-MM-YYYY
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Payment Frequency *</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => handleInputChange("frequency", value)}
                    >
                      <SelectTrigger data-testid="select-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Next Due Date (Auto-calculated)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange("dueDate", e.target.value)}
                      data-testid="input-due-date"
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Auto-populated based on start date and frequency • Format: DD-MM-YYYY
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="amount">Contract Amount (₹) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={(e) => handleInputChange("amount", e.target.value)}
                        className="pl-10"
                        data-testid="input-amount"
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Supporting Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Upload Agreement & Supporting Documents</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Upload contracts, agreements, or addendums (PDF, JPG, PNG - Max 5MB each)
                  </p>
                  <FileUpload
                    endpoint="/api/receipts/upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={5 * 1024 * 1024}
                    onUploadComplete={(file) => {
                      setFormData(prev => ({
                        ...prev,
                        supportingDocuments: [...prev.supportingDocuments, file]
                      }));
                    }}
                    data-testid="upload-contract-documents"
                  />
                  {formData.supportingDocuments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Uploaded Documents:</h4>
                      <div className="space-y-2">
                        {formData.supportingDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <span className="text-sm" data-testid={`uploaded-doc-${index}`}>
                              {doc.originalName || doc.fileName}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  supportingDocuments: prev.supportingDocuments.filter((_, i) => i !== index)
                                }));
                              }}
                              data-testid={`remove-doc-${index}`}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setLocation("/contracts")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-save-contract"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Creating..." : "Create Contract"}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}