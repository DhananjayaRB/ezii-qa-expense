import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { ArrowLeft, Building2, Calculator, Upload, FileText, Receipt, Paperclip, Calendar, Plus, List } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorClaimSummary } from "@/components/vendors/VendorClaimSummary";
import type { Vendor, TdsMaster, BillMasterType, BillMasterField } from "@shared/schema";

interface VendorClaimFormData {
  title: string;
  description: string;
  vendorId: string;
  category: string;
  // Common fields
  amount: string;
  dueDate: string;
  invoiceNumber: string;
  invoiceDate: string;
  
  // Vendor Dues specific
  agreementReference: string;
  expenseType: string;
  period: string;
  
  // Utility Bill specific
  accountNumber: string;
  billingPeriod: string;
  openingReading: string;
  closingReading: string;
  consumptionUnits: string;
  billDate: string;
  
  // Standard Bill specific
  lineItems: Array<{
    description: string;
    quantity: string;
    rate: string;
    total: string;
  }>;
  gstDetails: {
    gstin: string;
    sgst: string;
    cgst: string;
    igst: string;
  };
  
  // Non-Registered Vendor specific
  transactionDetails: string;
  panNumber: string;
  tdsSection: string;
  
  // PO Matching specific
  poNumber: string;
  receivedQuantity: string;
  
  // Document uploads
  uploadedDocuments: any[];
}

// Default hardcoded bill types (system defaults)
const DEFAULT_BILL_CATEGORIES = [
  { value: 'vendor_dues', label: 'Vendor Dues Form (for predictable expenses)', isDefault: true },
  { value: 'utility_bill', label: 'Utility Bill Form (for consumption-based expenses)', isDefault: true },
  { value: 'standard_bill', label: 'Standard Vendor Bill Form', isDefault: true },
  { value: 'non_registered', label: 'Non-Registered Vendor Payment Form', isDefault: true },
  { value: 'po_matching', label: 'Invoice with Purchase order(PO)', isDefault: true },
];

export default function VendorClaim() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  
  const [formData, setFormData] = useState<VendorClaimFormData>({
    title: "",
    description: "",
    vendorId: "",
    category: "",
    amount: "",
    dueDate: "",
    invoiceNumber: "",
    invoiceDate: "",
    agreementReference: "",
    expenseType: "",
    period: "",
    accountNumber: "",
    billingPeriod: "",
    openingReading: "",
    closingReading: "",
    consumptionUnits: "",
    billDate: "",
    lineItems: [{ description: "", quantity: "", rate: "", total: "" }],
    gstDetails: { gstin: "", sgst: "", cgst: "", igst: "" },
    transactionDetails: "",
    panNumber: "",
    tdsSection: "",
    poNumber: "",
    receivedQuantity: "",
    uploadedDocuments: [],
  });

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [tdsAmount, setTdsAmount] = useState(0);
  const [netPayable, setNetPayable] = useState(0);
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);

  // Fetch vendors
  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Fetch TDS master data
  const { data: tdsMasterData = [], isLoading: isLoadingTds } = useQuery<TdsMaster[]>({
    queryKey: ["/api/tds-master"],
  });

  // Fetch custom bill master types
  const { data: customBillTypes = [], isLoading: isLoadingBillTypes } = useQuery<(BillMasterType & { fields: BillMasterField[] })[]>({
    queryKey: ["/api/bill-master/types"],
  });

  // Combine default and custom bill types for dropdown
  const allBillCategories = [
    ...DEFAULT_BILL_CATEGORIES,
    ...customBillTypes.filter(bt => bt.isActive).map(bt => ({
      value: bt.id,
      label: bt.name,
      isDefault: false,
      customType: bt,
    }))
  ];

  // Calculate TDS when amount or vendor changes
  useEffect(() => {
    if (formData.amount && selectedVendor?.tdsCategory) {
      const amount = parseFloat(formData.amount);
      const tdsRate = tdsMasterData.find(tds => tds.category === selectedVendor.tdsCategory);
      
      if (tdsRate && !isNaN(amount)) {
        const tdsAmount = (amount * parseFloat(tdsRate.defaultRate.toString())) / 100;
        const netPayable = amount - tdsAmount;
        
        setTdsAmount(tdsAmount);
        setNetPayable(netPayable);
      } else {
        setTdsAmount(0);
        setNetPayable(parseFloat(formData.amount) || 0);
      }
    } else {
      setTdsAmount(0);
      setNetPayable(parseFloat(formData.amount) || 0);
    }
  }, [formData.amount, selectedVendor, tdsMasterData]);

  // Calculate consumption units for utility bills
  useEffect(() => {
    if (formData.category === 'utility_bill' && formData.openingReading && formData.closingReading) {
      const opening = parseFloat(formData.openingReading);
      const closing = parseFloat(formData.closingReading);
      if (!isNaN(opening) && !isNaN(closing)) {
        setFormData(prev => ({ ...prev, consumptionUnits: (closing - opening).toString() }));
      }
    }
  }, [formData.openingReading, formData.closingReading, formData.category]);

  const handleInputChange = (field: keyof VendorClaimFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    setSelectedVendor(vendor || null);
    setFormData(prev => ({ 
      ...prev, 
      vendorId,
      // Auto-populate GSTIN from selected vendor
      gstDetails: {
        ...prev.gstDetails,
        gstin: vendor?.gstin || ''
      }
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: "", quantity: "", rate: "", total: "" }]
    }));
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newLineItems = [...prev.lineItems];
      newLineItems[index] = { ...newLineItems[index], [field]: value };
      
      // Auto-calculate total if quantity and rate are provided
      if (field === 'quantity' || field === 'rate') {
        const quantity = parseFloat(newLineItems[index].quantity);
        const rate = parseFloat(newLineItems[index].rate);
        if (!isNaN(quantity) && !isNaN(rate)) {
          newLineItems[index].total = (quantity * rate).toFixed(2);
        }
      }
      
      return { ...prev, lineItems: newLineItems };
    });
  };

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const handleCreateContract = async () => {
    if (!selectedVendor || !formData.expenseType || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in vendor, expense type, and amount first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create contract from vendor dues data
      const contractData = {
        title: `${formData.expenseType.replace('_', ' ').toUpperCase()} - ${selectedVendor.name}`,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        agreementReference: formData.agreementReference || undefined,
        expenseType: formData.expenseType,
        agreementStartDate: new Date(), // Set as current date
        agreementEndDate: undefined, // Leave open for recurring contracts
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        amount: parseFloat(formData.amount),
        frequency: "monthly", // Default to monthly for vendor dues
        supportingDocuments: formData.uploadedDocuments || [],
        status: "active",
        isAutoPopulated: true, // Mark as auto-populated from vendor claim
        expenseClaimId: submittedClaimId, // Link to the expense claim if available
      };

      await apiRequest("/api/contracts", {
        method: "POST",
        body: JSON.stringify(contractData),
      });

      // Invalidate contracts cache
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });

      toast({
        title: "Success",
        description: "Contract created successfully from vendor claim data",
      });

      // Optionally redirect to contract master or show success message
    } catch (error) {
      console.error("Error creating contract:", error);
      toast({
        title: "Error", 
        description: "Failed to create contract. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.vendorId || !formData.category || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const claimData = {
        ...formData,
        tdsAmount,
        netPayable,
        vendorTdsCategory: selectedVendor?.tdsCategory,
      };

      console.log("Submitting vendor claim data:", claimData);

      const response = await apiRequest("/api/vendor-claims", {
        method: "POST",
        body: JSON.stringify(claimData),
      });

      const responseData = await response.json();
      console.log("Vendor claim response:", responseData);

      // Capture the created claim ID for contract linking
      if (responseData.id) {
        setSubmittedClaimId(responseData.id);
      }

      toast({
        title: "Success",
        description: responseData.message || "Vendor claim created successfully",
      });

      setLocation("/vendors");
    } catch (error) {
      console.error("Vendor claim submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create vendor claim";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const renderCategorySpecificFields = () => {
    switch (formData.category) {
      case 'vendor_dues':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Vendor Dues Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agreementReference">Agreement/Contract Reference *</Label>
                  <Input
                    id="agreementReference"
                    value={formData.agreementReference}
                    onChange={(e) => handleInputChange('agreementReference', e.target.value)}
                    placeholder="Enter contract reference"
                    data-testid="input-agreement-reference"
                  />
                </div>
                <div>
                  <Label htmlFor="expenseType">Expense Type *</Label>
                  <Select onValueChange={(value) => handleInputChange('expenseType', value)}>
                    <SelectTrigger data-testid="select-expense-type">
                      <SelectValue placeholder="Select expense type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="lease">Lease</SelectItem>
                      <SelectItem value="subscription_fee">Subscription Fee</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="period">Period *</Label>
                  <Input
                    id="period"
                    value={formData.period}
                    onChange={(e) => handleInputChange('period', e.target.value)}
                    placeholder="e.g., September 2025"
                    data-testid="input-period"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    data-testid="input-due-date"
                  />
                </div>
              </div>
              
              {/* GST Details */}
              <div>
                <Label>GST Details</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="gstin-vendor-dues">GSTIN</Label>
                    <Input
                      id="gstin-vendor-dues"
                      placeholder="GSTIN"
                      value={formData.gstDetails.gstin}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, gstin: e.target.value } 
                      }))}
                      data-testid="input-gstin-vendor-dues"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sgst-vendor-dues">SGST Amount</Label>
                    <Input
                      id="sgst-vendor-dues"
                      placeholder="SGST Amount"
                      type="number"
                      value={formData.gstDetails.sgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, sgst: e.target.value } 
                      }))}
                      data-testid="input-sgst-vendor-dues"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cgst-vendor-dues">CGST Amount</Label>
                    <Input
                      id="cgst-vendor-dues"
                      placeholder="CGST Amount"
                      type="number"
                      value={formData.gstDetails.cgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, cgst: e.target.value } 
                      }))}
                      data-testid="input-cgst-vendor-dues"
                    />
                  </div>
                  <div>
                    <Label htmlFor="igst-vendor-dues">IGST Amount</Label>
                    <Input
                      id="igst-vendor-dues"
                      placeholder="IGST Amount"
                      type="number"
                      value={formData.gstDetails.igst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, igst: e.target.value } 
                      }))}
                      data-testid="input-igst-vendor-dues"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Creation Button */}
              <div className="border-t pt-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Contract Management</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    This appears to be a recurring vendor expense. You can create a contract to automate future payments.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateContract}
                    disabled={!selectedVendor || !formData.expenseType || !formData.amount}
                    data-testid="button-create-contract"
                    className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Contract from this Claim
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'utility_bill':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Utility Bill Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountNumber">Account/Consumer Number *</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="Enter account number"
                    data-testid="input-account-number"
                  />
                </div>
                <div>
                  <Label htmlFor="billingPeriod">Billing Period *</Label>
                  <Input
                    id="billingPeriod"
                    value={formData.billingPeriod}
                    onChange={(e) => handleInputChange('billingPeriod', e.target.value)}
                    placeholder="e.g., 01/09/2025 - 30/09/2025"
                    data-testid="input-billing-period"
                  />
                </div>
                <div>
                  <Label htmlFor="openingReading">Opening Meter Reading</Label>
                  <Input
                    id="openingReading"
                    type="number"
                    value={formData.openingReading}
                    onChange={(e) => handleInputChange('openingReading', e.target.value)}
                    placeholder="Enter opening reading"
                    data-testid="input-opening-reading"
                  />
                </div>
                <div>
                  <Label htmlFor="closingReading">Closing Meter Reading</Label>
                  <Input
                    id="closingReading"
                    type="number"
                    value={formData.closingReading}
                    onChange={(e) => handleInputChange('closingReading', e.target.value)}
                    placeholder="Enter closing reading"
                    data-testid="input-closing-reading"
                  />
                </div>
                <div>
                  <Label htmlFor="consumptionUnits">Consumption Units</Label>
                  <Input
                    id="consumptionUnits"
                    value={formData.consumptionUnits}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Auto-calculated"
                    data-testid="input-consumption-units"
                  />
                </div>
                <div>
                  <Label htmlFor="billDate">Bill Date *</Label>
                  <Input
                    id="billDate"
                    type="date"
                    value={formData.billDate}
                    onChange={(e) => handleInputChange('billDate', e.target.value)}
                    data-testid="input-bill-date"
                  />
                </div>
              </div>

              {/* GST Details */}
              <div>
                <Label>GST Details</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="gstin-utility-bill">GSTIN</Label>
                    <Input
                      id="gstin-utility-bill"
                      placeholder="GSTIN"
                      value={formData.gstDetails.gstin}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, gstin: e.target.value } 
                      }))}
                      data-testid="input-gstin-utility-bill"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sgst-utility-bill">SGST Amount</Label>
                    <Input
                      id="sgst-utility-bill"
                      placeholder="SGST Amount"
                      type="number"
                      value={formData.gstDetails.sgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, sgst: e.target.value } 
                      }))}
                      data-testid="input-sgst-utility-bill"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cgst-utility-bill">CGST Amount</Label>
                    <Input
                      id="cgst-utility-bill"
                      placeholder="CGST Amount"
                      type="number"
                      value={formData.gstDetails.cgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, cgst: e.target.value } 
                      }))}
                      data-testid="input-cgst-utility-bill"
                    />
                  </div>
                  <div>
                    <Label htmlFor="igst-utility-bill">IGST Amount</Label>
                    <Input
                      id="igst-utility-bill"
                      placeholder="IGST Amount"
                      type="number"
                      value={formData.gstDetails.igst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, igst: e.target.value } 
                      }))}
                      data-testid="input-igst-utility-bill"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'standard_bill':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Standard Bill Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    placeholder="Enter invoice number"
                    data-testid="input-invoice-number"
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceDate">Invoice Date *</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                    data-testid="input-invoice-date"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Line Items *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem} data-testid="button-add-line-item">
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        data-testid={`input-line-description-${index}`}
                      />
                      <Input
                        placeholder="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        data-testid={`input-line-quantity-${index}`}
                      />
                      <Input
                        placeholder="Rate"
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                        data-testid={`input-line-rate-${index}`}
                      />
                      <Input
                        placeholder="Total"
                        value={item.total}
                        readOnly
                        className="bg-gray-50"
                        data-testid={`input-line-total-${index}`}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeLineItem(index)}
                        data-testid={`button-remove-line-${index}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST Details */}
              <div>
                <Label>GST Details</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      placeholder="GSTIN"
                      value={formData.gstDetails.gstin}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, gstin: e.target.value } 
                      }))}
                      data-testid="input-gstin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sgst">SGST Amount</Label>
                    <Input
                      id="sgst"
                      placeholder="SGST Amount"
                      type="number"
                      value={formData.gstDetails.sgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, sgst: e.target.value } 
                      }))}
                      data-testid="input-sgst"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cgst">CGST Amount</Label>
                    <Input
                      id="cgst"
                      placeholder="CGST Amount"
                      type="number"
                      value={formData.gstDetails.cgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, cgst: e.target.value } 
                      }))}
                      data-testid="input-cgst"
                    />
                  </div>
                  <div>
                    <Label htmlFor="igst">IGST Amount</Label>
                    <Input
                      id="igst"
                      placeholder="IGST Amount"
                      type="number"
                      value={formData.gstDetails.igst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, igst: e.target.value } 
                      }))}
                      data-testid="input-igst"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'non_registered':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Non-Registered Vendor Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transactionDetails">Transaction Details *</Label>
                <Textarea
                  id="transactionDetails"
                  value={formData.transactionDetails}
                  onChange={(e) => handleInputChange('transactionDetails', e.target.value)}
                  placeholder="Describe the service or goods received"
                  data-testid="textarea-transaction-details"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => handleInputChange('panNumber', e.target.value)}
                    placeholder="Enter PAN number"
                    data-testid="input-pan-number"
                  />
                </div>
                <div>
                  <Label htmlFor="tdsSection">TDS Section *</Label>
                  <Select onValueChange={(value) => handleInputChange('tdsSection', value)}>
                    <SelectTrigger data-testid="select-tds-section">
                      <SelectValue placeholder="Select TDS section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="194C">194C - Payments to contractors</SelectItem>
                      <SelectItem value="194J">194J - Professional fees</SelectItem>
                      <SelectItem value="194I">194I - Rent payments</SelectItem>
                      <SelectItem value="194H">194H - Commission payments</SelectItem>
                      <SelectItem value="194E">194E - Payments to non-residents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* GST Details */}
              <div>
                <Label>GST Details</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="gstin-non-registered">GSTIN</Label>
                    <Input
                      id="gstin-non-registered"
                      placeholder="GSTIN"
                      value={formData.gstDetails.gstin}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, gstin: e.target.value } 
                      }))}
                      data-testid="input-gstin-non-registered"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sgst-non-registered">SGST Amount</Label>
                    <Input
                      id="sgst-non-registered"
                      placeholder="SGST Amount"
                      type="number"
                      value={formData.gstDetails.sgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, sgst: e.target.value } 
                      }))}
                      data-testid="input-sgst-non-registered"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cgst-non-registered">CGST Amount</Label>
                    <Input
                      id="cgst-non-registered"
                      placeholder="CGST Amount"
                      type="number"
                      value={formData.gstDetails.cgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, cgst: e.target.value } 
                      }))}
                      data-testid="input-cgst-non-registered"
                    />
                  </div>
                  <div>
                    <Label htmlFor="igst-non-registered">IGST Amount</Label>
                    <Input
                      id="igst-non-registered"
                      placeholder="IGST Amount"
                      type="number"
                      value={formData.gstDetails.igst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, igst: e.target.value } 
                      }))}
                      data-testid="input-igst-non-registered"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'po_matching':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Purchase Order Matching Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="poNumber">PO Number *</Label>
                  <Input
                    id="poNumber"
                    value={formData.poNumber}
                    onChange={(e) => handleInputChange('poNumber', e.target.value)}
                    placeholder="Enter PO number"
                    data-testid="input-po-number"
                  />
                </div>
                <div>
                  <Label htmlFor="receivedQuantity">Received Quantity *</Label>
                  <Input
                    id="receivedQuantity"
                    type="number"
                    value={formData.receivedQuantity}
                    onChange={(e) => handleInputChange('receivedQuantity', e.target.value)}
                    placeholder="Enter received quantity"
                    data-testid="input-received-quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    placeholder="Enter invoice number"
                    data-testid="input-po-invoice-number"
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceDate">Invoice Date *</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                    data-testid="input-po-invoice-date"
                  />
                </div>
              </div>

              {/* GST Details */}
              <div>
                <Label>GST Details</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="gstin-po-matching">GSTIN</Label>
                    <Input
                      id="gstin-po-matching"
                      placeholder="GSTIN"
                      value={formData.gstDetails.gstin}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, gstin: e.target.value } 
                      }))}
                      data-testid="input-gstin-po-matching"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sgst-po-matching">SGST Amount</Label>
                    <Input
                      id="sgst-po-matching"
                      placeholder="SGST Amount"
                      type="number"
                      value={formData.gstDetails.sgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, sgst: e.target.value } 
                      }))}
                      data-testid="input-sgst-po-matching"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cgst-po-matching">CGST Amount</Label>
                    <Input
                      id="cgst-po-matching"
                      placeholder="CGST Amount"
                      type="number"
                      value={formData.gstDetails.cgst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, cgst: e.target.value } 
                      }))}
                      data-testid="input-cgst-po-matching"
                    />
                  </div>
                  <div>
                    <Label htmlFor="igst-po-matching">IGST Amount</Label>
                    <Input
                      id="igst-po-matching"
                      placeholder="IGST Amount"
                      type="number"
                      value={formData.gstDetails.igst}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        gstDetails: { ...prev.gstDetails, igst: e.target.value } 
                      }))}
                      data-testid="input-igst-po-matching"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Claim</h1>
              <p className="text-gray-600 dark:text-gray-400">Create and manage vendor payment claims</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" className="flex items-center gap-2" data-testid="tab-create">
                  <Plus className="h-4 w-4" />
                  Create Claim
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center gap-2" data-testid="tab-summary">
                  <List className="h-4 w-4" />
                  Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
                {/* Basic Information */}
                <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Claim Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter claim title"
                      data-testid="input-claim-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor">Select Vendor *</Label>
                    <Select onValueChange={handleVendorChange} disabled={isLoadingVendors}>
                      <SelectTrigger data-testid="select-vendor">
                        <SelectValue placeholder={isLoadingVendors ? "Loading vendors..." : "Select vendor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.filter(vendor => vendor.status === 'active').map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter claim description"
                    data-testid="textarea-description"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vendor Details Display */}
            {selectedVendor && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Selected Vendor Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedVendor.name}</p>
                      <p className="text-gray-600 dark:text-gray-400">{selectedVendor.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">TDS Category</p>
                      <Badge variant="secondary" data-testid="badge-vendor-tds-category">
                        {tdsMasterData.find(tds => tds.category === selectedVendor.tdsCategory)?.categoryName || selectedVendor.tdsCategory || 'Not specified'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Current TDS Rate</p>
                      <p className="font-medium" data-testid="text-vendor-tds-rate">
                        {tdsMasterData.find(tds => tds.category === selectedVendor.tdsCategory)?.defaultRate}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Bill Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="category">Select Bill Type *</Label>
                  <Select onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Choose the type of vendor bill" />
                    </SelectTrigger>
                    <SelectContent>
                      {allBillCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                          {category.isDefault && (
                            <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Category-specific fields */}
            {formData.category && renderCategorySpecificFields()}

            {/* Document Upload Section */}
            {formData.category && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="w-5 h-5" />
                    Supporting Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Upload Invoice & Supporting Documents</Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload invoice, receipts, agreements, or other supporting documents (PDF, JPG, PNG - Max 5MB each)
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
            )}

            {/* Amount and TDS Calculation */}
            {formData.category && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Amount & TDS Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Bill Amount (₹) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        placeholder="Enter bill amount"
                        data-testid="input-amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">TDS Amount:</span>
                        <span className="font-medium" data-testid="text-tds-amount">₹{tdsAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Net Payable:</span>
                        <span className="text-green-600" data-testid="text-net-payable">₹{netPayable.toFixed(2)}</span>
                      </div>
                      {selectedVendor?.tdsCategory && (
                        <p className="text-xs text-gray-500">
                          TDS @ {tdsMasterData.find(tds => tds.category === selectedVendor.tdsCategory)?.defaultRate}% 
                          for {tdsMasterData.find(tds => tds.category === selectedVendor.tdsCategory)?.categoryName || selectedVendor.tdsCategory} category
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setLocation("/vendors")} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} data-testid="button-submit-claim">
                    Create Vendor Claim
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-6">
                <VendorClaimSummary 
                  onViewClaim={(claimId) => {
                    // TODO: Add view claim functionality
                    console.log('View claim:', claimId);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}