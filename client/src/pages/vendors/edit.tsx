import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { ArrowLeft, Building2, Save, Paperclip } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import type { Vendor, TdsMaster } from "@shared/schema";

export default function EditVendor() {
  const [, params] = useRoute("/vendors/:id/edit");
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    accountNumber: "",
    ifscCode: "", 
    bankName: "",
    bankBranch: "",
    gstin: "",
    pan: "",
    tdsCategory: "",
    tdsRate: "",
    isLessRates: false,
    customTdsRate: "",
    tdsRateFromDate: "",
    tdsRateToDate: "",
    tdsCertificates: [] as any[],
    msmeStatus: "not_applicable", 
    msmeNumber: "",
    status: "active",
    uploadedDocuments: [] as any[],
  });

  // Fetch vendor data
  const { data: vendor, isLoading: isLoadingVendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${id}`],
    enabled: !!id,
  });

  // Fetch TDS master data
  const { data: tdsMasterData = [], isLoading: isLoadingTds } = useQuery<TdsMaster[]>({
    queryKey: ["/api/tds-master"],
  });

  // Load vendor data into form when fetched - this should be the MAIN effect
  useEffect(() => {
    if (vendor) {
      console.log("Loading vendor data into form:", vendor);
      setFormData({
        name: vendor.name || "",
        address: vendor.address || "",
        contactPerson: vendor.contactPerson || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        accountNumber: vendor.accountNumber || "",
        ifscCode: vendor.ifscCode || "",
        bankName: vendor.bankName || "",
        bankBranch: vendor.bankBranch || "",
        gstin: vendor.gstin || "",
        pan: vendor.pan || "",
        tdsCategory: vendor.tdsCategory || "",
        tdsRate: vendor.tdsRate?.toString() || "",
        isLessRates: vendor.isLessRates || false,
        customTdsRate: vendor.customTdsRate?.toString() || "",
        tdsRateFromDate: vendor.tdsRateFromDate ? new Date(vendor.tdsRateFromDate).toISOString().split('T')[0] : "",
        tdsRateToDate: vendor.tdsRateToDate ? new Date(vendor.tdsRateToDate).toISOString().split('T')[0] : "",
        tdsCertificates: [] as any[],
        msmeStatus: vendor.msmeStatus || "not_applicable",
        msmeNumber: vendor.msmeNumber || "",
        status: vendor.status || "active",
        uploadedDocuments: [] as any[],
      });
    }
  }, [vendor]);

  // Auto-populate TDS rate when category changes
  useEffect(() => {
    if (tdsMasterData.length > 0 && formData.tdsCategory && !formData.tdsRate) {
      const tdsRate = tdsMasterData.find((tds) => tds.category === formData.tdsCategory);
      if (tdsRate) {
        setFormData(prev => ({
          ...prev,
          tdsRate: tdsRate.defaultRate.toString(),
        }));
      }
    }
  }, [formData.tdsCategory, tdsMasterData]);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: checked
      };
      
      // Clear custom TDS fields when isLessRates is disabled
      if (field === 'isLessRates' && !checked) {
        newData.customTdsRate = "";
        newData.tdsRateFromDate = "";
        newData.tdsRateToDate = "";
        newData.tdsCertificates = [];
      }
      
      return newData;
    });
  };

  // Handle TDS Category change with rate fetching
  const handleTdsCategoryChange = async (category: string) => {
    setFormData(prev => ({
      ...prev,
      tdsCategory: category,
      tdsRate: "", // Reset rate initially
    }));

    // Fetch rate for selected category
    try {
      const tdsRate = tdsMasterData.find((tds) => tds.category === category);
      if (tdsRate) {
        setFormData(prev => ({
          ...prev,
          tdsRate: tdsRate.defaultRate.toString(),
        }));
      } else {
        toast({
          title: "Warning",
          description: "TDS rate not found for selected category",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch TDS rate",
        variant: "destructive",
      });
    }
  };

  const updateVendorMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/vendors/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", id] });
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
      setLocation("/vendors");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Name, email, and phone are required fields",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      tdsRate: formData.tdsRate ? parseFloat(formData.tdsRate) : null,
      customTdsRate: formData.customTdsRate ? parseFloat(formData.customTdsRate) : null,
      tdsRateFromDate: formData.tdsRateFromDate || null,
      tdsRateToDate: formData.tdsRateToDate || null,
    };

    updateVendorMutation.mutate(submitData);
  };

  if (isLoadingVendor) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Not Found</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">The vendor you're looking for doesn't exist.</p>
              <Button onClick={() => setLocation("/vendors")} className="mt-4">
                Back to Vendors
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/vendors")}
                className="mb-4"
                data-testid="button-back-to-vendors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vendors
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Vendor</h1>
              <p className="text-gray-600 dark:text-gray-400">Update vendor information</p>
            </div>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vendor Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter vendor name"
                      data-testid="input-vendor-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      placeholder="Enter contact person name"
                      data-testid="input-contact-person"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter complete address"
                    data-testid="textarea-address"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      placeholder="Enter account number"
                      data-testid="input-account-number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code *</Label>
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                      placeholder="Enter IFSC code"
                      data-testid="input-ifsc-code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      placeholder="Enter bank name"
                      data-testid="input-bank-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankBranch">Bank Branch *</Label>
                    <Input
                      id="bankBranch"
                      value={formData.bankBranch}
                      onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                      placeholder="Enter bank branch"
                      data-testid="input-bank-branch"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Details */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin}
                      onChange={(e) => handleInputChange('gstin', e.target.value)}
                      placeholder="Enter GSTIN"
                      data-testid="input-gstin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pan">PAN *</Label>
                    <Input
                      id="pan"
                      value={formData.pan}
                      onChange={(e) => handleInputChange('pan', e.target.value)}
                      placeholder="Enter PAN"
                      data-testid="input-pan"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TDS Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>TDS Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tdsCategory">TDS Category *</Label>
                    <Select value={formData.tdsCategory} onValueChange={handleTdsCategoryChange} disabled={isLoadingTds}>
                      <SelectTrigger data-testid="select-tds-category">
                        <SelectValue placeholder={isLoadingTds ? "Loading categories..." : "Select TDS category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {tdsMasterData.map((tds) => (
                          <SelectItem key={tds.id} value={tds.category}>
                            {tds.categoryName} ({tds.defaultRate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tdsRate">TDS Rate (%)</Label>
                      <Button 
                        type="button"
                        variant="link" 
                        size="sm"
                        onClick={() => setLocation('/config/tds-master')}
                        className="text-xs p-0 h-auto"
                        data-testid="link-configure-tds"
                      >
                        Manage TDS Rates
                      </Button>
                    </div>
                    <Input 
                      id="tdsRate"
                      placeholder="TDS Rate" 
                      value={formData.tdsRate}
                      readOnly
                      className="bg-gray-50"
                      data-testid="input-tds-rate" 
                    />
                    <p className="text-xs text-gray-500">Rate is automatically populated based on selected TDS category</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isLessRates"
                      checked={formData.isLessRates}
                      onCheckedChange={(checked) => handleCheckboxChange('isLessRates', checked as boolean)}
                      data-testid="checkbox-less-rates"
                    />
                    <Label htmlFor="isLessRates">Apply reduced TDS rates (for specified period)</Label>
                  </div>

                  {formData.isLessRates && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label htmlFor="customTdsRate">Custom TDS Rate (%) *</Label>
                        <Input
                          id="customTdsRate"
                          type="number"
                          min="0.01"
                          max="30"
                          step="0.01"
                          value={formData.customTdsRate}
                          onChange={(e) => handleInputChange('customTdsRate', e.target.value)}
                          placeholder="Enter custom rate"
                          data-testid="input-custom-tds-rate"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tdsRateFromDate">Valid From *</Label>
                        <Input
                          id="tdsRateFromDate"
                          type="date"
                          value={formData.tdsRateFromDate}
                          onChange={(e) => handleInputChange('tdsRateFromDate', e.target.value)}
                          data-testid="input-tds-from-date"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tdsRateToDate">Valid To *</Label>
                        <Input
                          id="tdsRateToDate"
                          type="date"
                          value={formData.tdsRateToDate}
                          onChange={(e) => handleInputChange('tdsRateToDate', e.target.value)}
                          data-testid="input-tds-to-date"
                        />
                      </div>
                      
                      <div className="col-span-3 space-y-2">
                        <Label>TDS Exemption Certificates</Label>
                        <p className="text-xs text-gray-600 mb-2">
                          Upload supporting certificates (Form 15G, 15H, exemption certificates, etc.)
                        </p>
                        <FileUpload
                          endpoint="/api/receipts/upload"
                          accept=".pdf,.jpg,.jpeg,.png"
                          maxSize={5 * 1024 * 1024}
                          onUploadComplete={(file) => {
                            setFormData(prev => ({
                              ...prev,
                              tdsCertificates: [...prev.tdsCertificates, file]
                            }));
                          }}
                          data-testid="upload-tds-certificates"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* MSME Details */}
            <Card>
              <CardHeader>
                <CardTitle>MSME Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="msmeStatus">MSME Status</Label>
                    <Select value={formData.msmeStatus} onValueChange={(value) => handleInputChange('msmeStatus', value)}>
                      <SelectTrigger data-testid="select-msme-status">
                        <SelectValue placeholder="Select MSME status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_applicable">Not Applicable</SelectItem>
                        <SelectItem value="msme">MSME Registered</SelectItem>
                        <SelectItem value="non_msme">Non-MSME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.msmeStatus === 'msme' && (
                    <div>
                      <Label htmlFor="msmeNumber">MSME Number *</Label>
                      <Input
                        id="msmeNumber"
                        value={formData.msmeNumber}
                        onChange={(e) => handleInputChange('msmeNumber', e.target.value)}
                        placeholder="Enter MSME registration number"
                        data-testid="input-msme-number"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Document Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Supporting Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Upload Vendor Contracts & Documents</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload contracts, agreements, or other vendor-related documents (PDF, JPG, PNG - Max 5MB each)
                  </p>
                  <FileUpload
                    endpoint="/api/receipts/upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={5 * 1024 * 1024}
                    onUploadComplete={(file) => {
                      setFormData(prev => ({
                        ...prev,
                        uploadedDocuments: [...prev.uploadedDocuments, file]
                      }));
                    }}
                    data-testid="upload-vendor-documents"
                  />
                  {formData.uploadedDocuments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Uploaded Documents:</h4>
                      <div className="space-y-2">
                        {formData.uploadedDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm" data-testid={`uploaded-doc-${index}`}>
                              {doc.originalName || doc.fileName}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  uploadedDocuments: prev.uploadedDocuments.filter((_, i) => i !== index)
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
              <Button variant="outline" onClick={() => setLocation("/vendors")} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={updateVendorMutation.isPending}
                data-testid="button-update-vendor"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateVendorMutation.isPending ? "Updating..." : "Update Vendor"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}