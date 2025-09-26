import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Save, User, FileText, Building2, CheckCircle, Paperclip } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import FileUpload from "@/components/ui/file-upload";
import type { TdsMaster } from "@shared/schema";

const stepIcons = [
  { icon: User, label: "Basic Info" },
  { icon: FileText, label: "Tax & Legal" },
  { icon: Building2, label: "Bank Details" },
  { icon: Paperclip, label: "Documents" },
  { icon: CheckCircle, label: "Complete" },
];

export default function AddVendor() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple form state
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
    totalPaid: "0",
    uploadedDocuments: [] as any[],
    // Document specific fields
    panCardDocuments: [] as any[],
    gstinCertificateDocuments: [] as any[],
    bankStatementDocuments: [] as any[],
    msmeCertificateDocuments: [] as any[],
    otherDocuments: [] as any[],
  });

  // Fetch TDS master data
  const { data: tdsMasterData = [], isLoading: isLoadingTds } = useQuery<TdsMaster[]>({
    queryKey: ["/api/tds-master"],
  });

  // Auto-populate TDS category and rate when data loads
  useEffect(() => {
    if (tdsMasterData.length > 0 && !formData.tdsCategory) {
      const firstCategory = tdsMasterData[0];
      setFormData(prev => ({
        ...prev,
        tdsCategory: firstCategory.category,
        tdsRate: firstCategory.defaultRate.toString(),
      }));
    }
  }, [tdsMasterData]);

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
      console.error("Error fetching TDS rate:", error);
      toast({
        title: "Error",
        description: "Failed to fetch TDS rate",
        variant: "destructive",
      });
    }
  };

  // Validation function for TDS custom fields
  const validateTdsFields = () => {
    const errors: string[] = [];
    
    if (formData.isLessRates) {
      // Validate custom TDS rate
      if (!formData.customTdsRate) {
        errors.push("Custom TDS Rate is required when using reduced rates");
      } else {
        const rate = parseFloat(formData.customTdsRate);
        if (isNaN(rate) || rate <= 0 || rate > 30) {
          errors.push("Custom TDS Rate must be between 0.01% and 30%");
        }
      }
      
      // Validate date fields
      if (!formData.tdsRateFromDate) {
        errors.push("From Date is required when using reduced rates");
      }
      if (!formData.tdsRateToDate) {
        errors.push("To Date is required when using reduced rates");
      }
      
      // Validate date range
      if (formData.tdsRateFromDate && formData.tdsRateToDate) {
        const fromDate = new Date(formData.tdsRateFromDate);
        const toDate = new Date(formData.tdsRateToDate);
        if (fromDate >= toDate) {
          errors.push("From Date must be earlier than To Date");
        }
      }
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validate TDS fields if needed
      const tdsErrors = validateTdsFields();
      if (tdsErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: tdsErrors.join(". "),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Vendor created successfully",
        });
        setLocation("/vendors");
      } else {
        const error = await response.json();
        toast({
          title: "Error", 
          description: error.message || "Failed to create vendor",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create vendor", 
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < stepIcons.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Name *</label>
                <Input 
                  placeholder="Enter Vendor Name" 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  data-testid="input-vendor-name" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>
                <Input 
                  placeholder="Contact Person Name" 
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  data-testid="input-contact-person" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email" 
                  placeholder="Enter Email" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  data-testid="input-email" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  placeholder="Enter Phone Number" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  data-testid="input-phone" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Textarea 
                  placeholder="Enter complete address" 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  data-testid="input-address"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tax & Legal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">PAN Number *</label>
                <Input 
                  placeholder="Enter PAN Number" 
                  value={formData.pan}
                  onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                  data-testid="input-pan" 
                />
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Upload PAN Card</label>
                  <FileUpload
                    endpoint="/api/receipts/upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={5 * 1024 * 1024}
                    onUploadComplete={(file) => {
                      setFormData(prev => ({
                        ...prev,
                        panCardDocuments: [...prev.panCardDocuments, file]
                      }));
                    }}
                    data-testid="upload-pan-card-inline"
                  />
                  {formData.panCardDocuments.length > 0 && (
                    <div className="text-xs text-green-600">
                      ✓ {formData.panCardDocuments.length} PAN document(s) uploaded
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">GSTIN</label>
                <Input 
                  placeholder="Enter GSTIN" 
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value)}
                  data-testid="input-gstin" 
                />
                {formData.gstin && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Upload GSTIN Certificate</label>
                    <FileUpload
                      endpoint="/api/receipts/upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={5 * 1024 * 1024}
                      onUploadComplete={(file) => {
                        setFormData(prev => ({
                          ...prev,
                          gstinCertificateDocuments: [...prev.gstinCertificateDocuments, file]
                        }));
                      }}
                      data-testid="upload-gstin-certificate-inline"
                    />
                    {formData.gstinCertificateDocuments.length > 0 && (
                      <div className="text-xs text-green-600">
                        ✓ {formData.gstinCertificateDocuments.length} GSTIN document(s) uploaded
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">TDS Category</label>
                <Select value={formData.tdsCategory} onValueChange={handleTdsCategoryChange}>
                  <SelectTrigger data-testid="select-tds-category">
                    <SelectValue placeholder="Select TDS Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTds ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : tdsMasterData.length === 0 ? (
                      <SelectItem value="no-data" disabled>No TDS categories configured</SelectItem>
                    ) : (
                      tdsMasterData.map((tds) => (
                        <SelectItem key={tds.id} value={tds.category}>
                          {tds.categoryName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">TDS Rate (%)</label>
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
                  placeholder="TDS Rate" 
                  value={formData.tdsRate}
                  readOnly
                  className="bg-gray-50"
                  data-testid="input-tds-rate" 
                />
                <p className="text-xs text-gray-500">Rate is automatically populated based on selected TDS category</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is-less-rates"
                    checked={formData.isLessRates}
                    onCheckedChange={(checked) => handleCheckboxChange('isLessRates', checked as boolean)}
                    data-testid="checkbox-is-less-rates"
                  />
                  <label 
                    htmlFor="is-less-rates" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Apply reduced TDS rates (Lower rates for specific period)
                  </label>
                </div>

                {formData.isLessRates && (
                  <div className="ml-6 space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Custom TDS Rate (%)</label>
                      <Input 
                        placeholder="Enter custom TDS rate" 
                        value={formData.customTdsRate}
                        onChange={(e) => handleInputChange('customTdsRate', e.target.value)}
                        type="number"
                        min="0"
                        max="30"
                        step="0.01"
                        data-testid="input-custom-tds-rate" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">From Date</label>
                        <Input 
                          placeholder="From Date" 
                          value={formData.tdsRateFromDate}
                          onChange={(e) => handleInputChange('tdsRateFromDate', e.target.value)}
                          type="date"
                          data-testid="input-tds-from-date" 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">To Date</label>
                        <Input 
                          placeholder="To Date" 
                          value={formData.tdsRateToDate}
                          onChange={(e) => handleInputChange('tdsRateToDate', e.target.value)}
                          type="date"
                          data-testid="input-tds-to-date" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">TDS Exemption Certificates</label>
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

                    <p className="text-xs text-gray-600">
                      When enabled, this custom rate will be applied instead of the standard rate during the specified period.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">MSME Status</label>
                <Select value={formData.msmeStatus} onValueChange={(value) => handleInputChange('msmeStatus', value)}>
                  <SelectTrigger data-testid="select-msme-status">
                    <SelectValue placeholder="Select MSME Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">Micro Enterprise</SelectItem>
                    <SelectItem value="small">Small Enterprise</SelectItem>
                    <SelectItem value="medium">Medium Enterprise</SelectItem>
                    <SelectItem value="not_applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">MSME Registration Number</label>
                <Input 
                  placeholder="Enter MSME Number (if applicable)" 
                  value={formData.msmeNumber}
                  onChange={(e) => handleInputChange('msmeNumber', e.target.value)}
                  data-testid="input-msme-number" 
                />
                {formData.msmeStatus !== "not_applicable" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Upload MSME Certificate</label>
                    <FileUpload
                      endpoint="/api/receipts/upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={5 * 1024 * 1024}
                      onUploadComplete={(file) => {
                        setFormData(prev => ({
                          ...prev,
                          msmeCertificateDocuments: [...prev.msmeCertificateDocuments, file]
                        }));
                      }}
                      data-testid="upload-msme-certificate-inline"
                    />
                    {formData.msmeCertificateDocuments.length > 0 && (
                      <div className="text-xs text-green-600">
                        ✓ {formData.msmeCertificateDocuments.length} MSME document(s) uploaded
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Banking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank Name</label>
                <Input 
                  placeholder="Enter Bank Name" 
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  data-testid="input-bank-name" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Branch</label>
                <Input 
                  placeholder="Enter Branch Name" 
                  value={formData.bankBranch}
                  onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                  data-testid="input-bank-branch" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Account Number</label>
                <Input 
                  placeholder="Enter Account Number" 
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  data-testid="input-account-number" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">IFSC Code</label>
                <Input 
                  placeholder="Enter IFSC Code" 
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  data-testid="input-ifsc" 
                />
              </div>
            </div>
            
            {/* Bank Statement Upload */}
            <div className="space-y-3 mt-6">
              <label className="text-sm font-medium text-gray-800">Bank Statement / Cancelled Cheque *</label>
              <p className="text-xs text-gray-500">Upload cancelled cheque or bank statement for account verification</p>
              <FileUpload
                endpoint="/api/receipts/upload"
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={5 * 1024 * 1024}
                onUploadComplete={(file) => {
                  setFormData(prev => ({
                    ...prev,
                    bankStatementDocuments: [...prev.bankStatementDocuments, file]
                  }));
                }}
                data-testid="upload-bank-statement-inline"
              />
              {formData.bankStatementDocuments.length > 0 && (
                <div className="text-xs text-green-600">
                  ✓ {formData.bankStatementDocuments.length} bank document(s) uploaded
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Documents Summary</h3>
              <p className="text-gray-600">Review all uploaded documents. Documents are uploaded inline in their respective form sections.</p>
            </div>

            {/* Upload Instructions */}
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">📄 How to Upload Documents</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Upload <strong>PAN Card</strong> in the <strong>Tax & Legal</strong> section (next to PAN field)</li>
                <li>• Upload <strong>GSTIN Certificate</strong> in the <strong>Tax & Legal</strong> section (next to GSTIN field)</li>
                <li>• Upload <strong>MSME Certificate</strong> in the <strong>Tax & Legal</strong> section (next to MSME field)</li>
                <li>• Upload <strong>Bank Statement/Cancelled Cheque</strong> in the <strong>Bank Details</strong> section</li>
              </ul>
            </div>

            {/* PAN Card Documents Summary */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-800">PAN Card Documents</h4>
                <span className="text-xs text-gray-500">Upload in Tax & Legal section</span>
              </div>
              {formData.panCardDocuments.length > 0 ? (
                <div className="space-y-2">
                  {formData.panCardDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded border">
                      <span className="text-sm" data-testid={`pan-doc-${index}`}>
                        {doc.originalName || doc.fileName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            panCardDocuments: prev.panCardDocuments.filter((_, i) => i !== index)
                          }));
                        }}
                        data-testid={`remove-pan-doc-${index}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-500">⚠ No PAN documents uploaded yet</p>
              )}
            </div>

            {/* GSTIN Certificate Summary */}
            {formData.gstin && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">GSTIN Certificate</h4>
                  <span className="text-xs text-gray-500">Upload in Tax & Legal section</span>
                </div>
                {formData.gstinCertificateDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {formData.gstinCertificateDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded border">
                        <span className="text-sm" data-testid={`gstin-doc-${index}`}>
                          {doc.originalName || doc.fileName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              gstinCertificateDocuments: prev.gstinCertificateDocuments.filter((_, i) => i !== index)
                            }));
                          }}
                          data-testid={`remove-gstin-doc-${index}`}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-yellow-600">⚠ No GSTIN documents uploaded yet</p>
                )}
              </div>
            )}

            {/* Bank Statement Summary */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-800">Bank Statement / Cancelled Cheque</h4>
                <span className="text-xs text-gray-500">Upload in Bank Details section</span>
              </div>
              {formData.bankStatementDocuments.length > 0 ? (
                <div className="space-y-2">
                  {formData.bankStatementDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-orange-50 p-2 rounded border">
                      <span className="text-sm" data-testid={`bank-doc-${index}`}>
                        {doc.originalName || doc.fileName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            bankStatementDocuments: prev.bankStatementDocuments.filter((_, i) => i !== index)
                          }));
                        }}
                        data-testid={`remove-bank-doc-${index}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-500">⚠ No bank documents uploaded yet</p>
              )}
            </div>

            {/* TDS Exemption Certificates */}
            {formData.isLessRates && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">TDS Exemption Certificates</h4>
                <p className="text-xs text-gray-500">Upload Form 15G, 15H, exemption certificates, etc.</p>
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
                {formData.tdsCertificates.length > 0 && (
                  <div className="space-y-2">
                    {formData.tdsCertificates.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-yellow-50 p-2 rounded border">
                        <span className="text-sm" data-testid={`tds-doc-${index}`}>
                          {doc.originalName || doc.fileName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              tdsCertificates: prev.tdsCertificates.filter((_, i) => i !== index)
                            }));
                          }}
                          data-testid={`remove-tds-doc-${index}`}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MSME Certificate Summary */}
            {formData.msmeStatus !== "not_applicable" && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">MSME Certificate</h4>
                  <span className="text-xs text-gray-500">Upload in Tax & Legal section</span>
                </div>
                {formData.msmeCertificateDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {formData.msmeCertificateDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-purple-50 p-2 rounded border">
                        <span className="text-sm" data-testid={`msme-doc-${index}`}>
                          {doc.originalName || doc.fileName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              msmeCertificateDocuments: prev.msmeCertificateDocuments.filter((_, i) => i !== index)
                            }));
                          }}
                          data-testid={`remove-msme-doc-${index}`}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-yellow-600">⚠ No MSME documents uploaded yet</p>
                )}
              </div>
            )}

            {/* Other Supporting Documents */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800">Other Supporting Documents</h4>
              <p className="text-xs text-gray-500">Upload contracts, agreements, incorporation certificate, or other relevant documents</p>
              <FileUpload
                endpoint="/api/receipts/upload"
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={5 * 1024 * 1024}
                onUploadComplete={(file) => {
                  setFormData(prev => ({
                    ...prev,
                    otherDocuments: [...prev.otherDocuments, file]
                  }));
                }}
                data-testid="upload-other-documents"
              />
              {formData.otherDocuments.length > 0 && (
                <div className="space-y-2">
                  {formData.otherDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                      <span className="text-sm" data-testid={`other-doc-${index}`}>
                        {doc.originalName || doc.fileName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            otherDocuments: prev.otherDocuments.filter((_, i) => i !== index)
                          }));
                        }}
                        data-testid={`remove-other-doc-${index}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Name</label>
                <p className="text-sm text-gray-600">{formData.name || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>
                <p className="text-sm text-gray-600">{formData.contactPerson || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-gray-600">{formData.email || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <p className="text-sm text-gray-600">{formData.phone || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PAN</label>
                <p className="text-sm text-gray-600">{formData.pan || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">GSTIN</label>
                <p className="text-sm text-gray-600">{formData.gstin || "Not provided"}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/vendors")}
              className="mb-4"
              data-testid="button-back-to-vendors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Add New Vendor</h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vendor Information</CardTitle>
                <div className="flex items-center space-x-2">
                  {stepIcons.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                          index === currentStep
                            ? "bg-blue-100 text-blue-700"
                            : index < currentStep
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {renderStepContent()}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    data-testid="button-prev-step"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {currentStep === stepIcons.length - 1 ? (
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      data-testid="button-submit-vendor"
                    >
                      {isSubmitting ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Vendor
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      data-testid="button-next-step"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}