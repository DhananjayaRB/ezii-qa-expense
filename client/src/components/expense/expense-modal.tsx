import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { X, CloudUpload, ChevronDown, ChevronUp } from "lucide-react";
import CostDistribution, { CostDistributionItem } from "@/components/expense/CostDistribution";

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  "data-testid"?: string;
}

interface ExpenseItem {
  // Common fields
  date: string;
  categoryId: string;
  description: string;
  amount: string;
  currency: string;
  receiptFile?: File;
  section?: string; // Dynamic section based on expense head claim forms
  
  // Expense-specific fields
  fromDate?: string;
  toDate?: string;
  cityPlace?: string;
  class?: string;
  expenseType?: string;
  policy?: string;
  supportingDocumentAvailable?: 'yes' | 'no';
  // Supporting Document fields (when supportingDocumentAvailable is 'yes')
  billNo?: string;
  billDate?: string;
  documentFile?: File;
  vendorId?: string;
  paidBy?: 'self' | 'companyCard';
  vendorName?: string;
  spentDate?: string;
  billableToCustomer?: 'yes' | 'no';
  distributeCost?: 'yes' | 'no';
  notes?: string;
  
  // Ticket-specific fields
  journeyDate?: string;
  journeyType?: string;
  fromPlace?: string;
  toPlace?: string;
  travelMode?: string;
  travelClass?: string;
  
  // Accommodation-specific fields
  accommodation?: string;
  
  // Conveyance-specific fields
  city?: string;
  conveyanceMode?: string;
  estimatedDistance?: string;
  organization?: string;
  person?: string;
  purpose?: string;
}

export default function ExpenseModal({ 
  open, 
  onOpenChange,
  "data-testid": testId,
}: ExpenseModalProps) {
  const { toast } = useToast();
  const [claimTitle, setClaimTitle] = useState("");
  const [claimDescription, setClaimDescription] = useState("");
  const [isTravelClaim, setIsTravelClaim] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedVendorDetails, setSelectedVendorDetails] = useState<any>(null);
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [originalRequestAmount, setOriginalRequestAmount] = useState(0);
  const [items, setItems] = useState<ExpenseItem[]>([{
    date: "",
    categoryId: "",
    description: "",
    amount: "",
    currency: "INR",
    section: "expense", // Default section to prevent syncing issues
  }]);

  // Cost Distribution state
  const [distributeCost, setDistributeCost] = useState(false);
  const [costDistributions, setCostDistributions] = useState<CostDistributionItem[]>([]);


  // Track which sections are collapsed (for non-travel claims)
  const [sectionCollapsed, setSectionCollapsed] = useState<Record<string, boolean>>({});

  const { data: categories } = useQuery({
    queryKey: ["/api/expense-categories"],
    retry: false,
  });

  // Fetch expense heads to determine available claim form types
  const { data: expenseHeads = [] } = useQuery<any[]>({
    queryKey: ["/api/expense-heads"],
    retry: false,
  });

  // Get unique claim form types from expense heads
  const availableClaimFormTypes = Array.from(
    new Set(
      expenseHeads
        .filter((head: any) => head.status) // Only active expense heads
        .map((head: any) => head.claimForm)
        .filter(Boolean) // Remove null/undefined values
    )
  ).sort();

  // Fetch approved expense requests for linking to claims
  const { data: approvedRequests = [] } = useQuery({
    queryKey: ["/api/expense-requests/approved"],
    retry: false,
  });


  // Fetch active vendors for selection
  const { data: allVendors = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
    retry: false,
  });

  // Filter only active vendors
  const activeVendors = Array.isArray(allVendors) ? allVendors.filter((vendor: any) => vendor.status === 'active') : [];

  // Fetch cost center configuration 
  const { data: costCenterConfig = {} } = useQuery<any>({
    queryKey: ["/api/cost-center-config"],
    retry: false,
  });

  const createClaimMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the claim with cost distribution data
      const claimResponse = await apiRequest("POST", "/api/expense-claims", {
        title: data.title,
        description: data.description,
        requestId: data.requestId || null,
        vendorId: data.vendorId || null,
        vendorInvoiceNumber: data.vendorInvoiceNumber || null,
        totalAmount: data.totalAmount,
        originalRequestAmount: data.originalRequestAmount || 0,
        extraAmount: data.extraAmount || 0,
        currency: data.currency,
        items: data.items,
        // Include cost distribution data
        distributeCost: data.distributeCost,
        costDistributions: data.costDistributions,
      });
      return claimResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims/pending-approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/pending-approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      onOpenChange(false);
      resetForm();
      toast({
        title: "Success",
        description: "Expense claim submitted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit expense claim",
        variant: "destructive",
      });
    },
  });

  const handleVendorSelection = (value: string) => {
    if (value === "none" || value === "no-vendors") {
      setSelectedVendorId("");
      setSelectedVendorDetails(null);
      setVendorInvoiceNumber("");
    } else {
      setSelectedVendorId(value);
      const selectedVendor = activeVendors.find((vendor: any) => vendor.id === value);
      if (selectedVendor) {
        setSelectedVendorDetails(selectedVendor);
      }
    }
  };

  // Helper functions for managing items by section
  const getItemsBySection = (section: string) => {
    if (isTravelClaim) {
      return items.filter(item => item.section === section);
    } else {
      // For non-travel claims, each section should only show its own items
      return items.filter(item => item.section === section);
    }
  };

  // Helper function to get items with their global indexes for a section
  const getItemsWithGlobalIndexBySection = (section: string) => {
    if (isTravelClaim) {
      return items
        .map((item, globalIndex) => ({ item, globalIndex }))
        .filter(({ item }) => item.section === section);
    } else {
      // For non-travel claims, each section should only show its own items
      return items
        .map((item, globalIndex) => ({ item, globalIndex }))
        .filter(({ item }) => item.section === section);
    }
  };

  const addItemToSection = (section?: string) => {
    const newItem: ExpenseItem = {
      date: "",
      categoryId: "",
      description: "",
      amount: "",
      currency: "INR",
      ...(section ? { section } : {}), // Always add section if provided
    };
    setItems([...items, newItem]);
  };

  const removeItemFromSection = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const toggleSectionCollapsed = (section: string) => {
    setSectionCollapsed(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const resetForm = () => {
    setClaimTitle("");
    setClaimDescription("");
    setIsTravelClaim(false);
    setSelectedRequestId("");
    setSelectedVendorId("");
    setSelectedVendorDetails(null);
    setVendorInvoiceNumber("");
    setOriginalRequestAmount(0);
    const firstSection = availableClaimFormTypes[0] || 'expense';
    setItems([{
      date: "",
      categoryId: "",
      description: "",
      amount: "",
      currency: "INR",
      section: firstSection,
    }]);
    // Reset cost distribution state
    setDistributeCost(false);
    setCostDistributions([]);
    // Reset section collapsed state
    setSectionCollapsed({
      conveyance: false,
      expense: false
    });
  };

  const handleRequestSelection = (requestId: string) => {
    setSelectedRequestId(requestId === 'none' ? '' : requestId);
    if (requestId && requestId !== 'none' && Array.isArray(approvedRequests)) {
      const selectedRequest = approvedRequests.find((req: any) => req.id === requestId);
      if (selectedRequest) {
        setClaimTitle(selectedRequest.title);
        setClaimDescription(selectedRequest.description || "");
        setOriginalRequestAmount(parseFloat(selectedRequest.estimatedAmount || "0"));
      }
    } else {
      setOriginalRequestAmount(0);
    }
  };


  const addItem = () => {
    // For the generic addItem function, default to expense section
    setItems([...items, {
      date: "",
      categoryId: "",
      description: "",
      amount: "",
      currency: "INR",
      section: "expense",
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ExpenseItem, value: string | File) => {
    const updatedItems = [...items];
    if ((field === "receiptFile" || field === "documentFile") && value instanceof File) {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value as string };
    }
    setItems(updatedItems);
  };

  const validateItemByType = (item: ExpenseItem): { isValid: boolean; missingFields: string[] } => {
    const section = item.section || 'expense';
    const missingFields: string[] = [];
    
    // Common validation for amount
    if (!item.amount || parseFloat(item.amount) <= 0) missingFields.push('Valid Amount');
    
    switch (section) {
      case 'expense':
        if (!item.fromDate) missingFields.push('From Date');
        if (!item.toDate) missingFields.push('To Date');
        if (!item.cityPlace) missingFields.push('City/Place');
        if (!item.expenseType) missingFields.push('Expense Type');
        if (!item.class) missingFields.push('Class');
        // Validate Bill Details required fields
        if (!item.supportingDocumentAvailable) missingFields.push('Supporting Document Available');
        if (!item.paidBy) missingFields.push('Paid By');
        if (!item.billableToCustomer) missingFields.push('Billable to Customer');
        if (!item.distributeCost) missingFields.push('Distribute Cost');
        break;
        
      case 'ticket':
        if (!item.journeyDate) missingFields.push('Journey Date');
        if (!item.fromPlace) missingFields.push('From Place');
        if (!item.toPlace) missingFields.push('To Place');
        if (!item.travelMode) missingFields.push('Travel Mode');
        // Travel Class should be required based on screenshot
        if (!item.travelClass) missingFields.push('Travel Class');
        // Validate Bill Details required fields
        if (!item.supportingDocumentAvailable) missingFields.push('Supporting Document Available');
        if (!item.paidBy) missingFields.push('Paid By');
        if (!item.billableToCustomer) missingFields.push('Billable to Customer');
        if (!item.distributeCost) missingFields.push('Distribute Cost');
        break;
        
      case 'accommodation':
        if (!item.fromDate) missingFields.push('From Date');
        if (!item.toDate) missingFields.push('To Date');
        if (!item.accommodation) missingFields.push('Accommodation');
        if (!item.class) missingFields.push('Class');
        if (!item.cityPlace) missingFields.push('City/Place');
        // Validate Bill Details required fields
        if (!item.supportingDocumentAvailable) missingFields.push('Supporting Document Available');
        if (!item.paidBy) missingFields.push('Paid By');
        if (!item.billableToCustomer) missingFields.push('Billable to Customer');
        if (!item.distributeCost) missingFields.push('Distribute Cost');
        break;
        
      case 'conveyance':
        if (!item.fromDate) missingFields.push('Date/From Date');
        if (!item.fromPlace) missingFields.push('From Place');
        if (!item.toPlace) missingFields.push('To Place');
        if (!item.conveyanceMode) missingFields.push('Conveyance Mode');
        if (!item.class) missingFields.push('Class');
        // Estimated Distance should be validated as numeric and > 0
        if (!item.estimatedDistance || parseFloat(item.estimatedDistance) <= 0) {
          missingFields.push('Valid Estimated Distance');
        }
        // Validate Bill Details required fields
        if (!item.supportingDocumentAvailable) missingFields.push('Supporting Document Available');
        if (!item.paidBy) missingFields.push('Paid By');
        break;
    }
    
    return { isValid: missingFields.length === 0, missingFields };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate items based on their type
    const validationErrors: string[] = [];
    
    items.forEach((item, index) => {
      const validation = validateItemByType(item);
      if (!validation.isValid) {
        const section = item.section || 'expense';
        const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
        validationErrors.push(`${sectionName} #${index + 1}: Missing ${validation.missingFields.join(', ')}`);
      }
    });
    
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join('\n'),
        variant: "destructive",
      });
      return;
    }
    
    // Filter valid items that have the required amount
    const validItems = items.filter(item => item.amount && parseFloat(item.amount) > 0);
    
    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item with a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate total amount from all valid items
    const totalAmount = validItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const primaryCurrency = validItems[0]?.currency || "INR";

    // Validate cost distribution if enabled
    if (distributeCost && costDistributions.length > 0) {
      const distributedTotal = costDistributions.reduce((sum, dist) => sum + parseFloat(dist.amount || '0'), 0);
      if (Math.abs(distributedTotal - totalAmount) > 0.01) {
        toast({
          title: "Validation Error",
          description: `Cost distribution total (₹${distributedTotal.toFixed(2)}) must equal claim total (₹${totalAmount.toFixed(2)})`,
          variant: "destructive",
        });
        return;
      }
    }

    // Prepare items for submission - map specialized fields to backend format
    const itemsForSubmission = validItems.map(item => {
      const section = item.section || 'expense';
      let mappedItem: any = {
        amount: parseFloat(item.amount) || 0,
        currency: item.currency,
        section: section,
      };

      // Map type-specific fields to common backend fields and preserve specialized data
      switch (section) {
        case 'expense':
          mappedItem = {
            ...mappedItem,
            date: new Date(item.fromDate || ''),
            categoryId: item.expenseType || null,
            description: `${item.cityPlace || ''} - Expense`,
            // Store all expense-specific data
            metadata: {
              fromDate: item.fromDate,
              toDate: item.toDate,
              cityPlace: item.cityPlace,
              expenseType: item.expenseType,
              class: item.class,
              policy: item.policy,
              supportingDocumentAvailable: item.supportingDocumentAvailable,
              // Supporting document fields
              billNo: item.billNo,
              billDate: item.billDate,
              vendorId: item.vendorId,
              documentFile: item.documentFile?.name,
              paidBy: item.paidBy,
              vendorName: item.vendorName,
              spentDate: item.spentDate,
              billableToCustomer: item.billableToCustomer,
              distributeCost: item.distributeCost,
              notes: item.notes,
              receiptFile: item.receiptFile?.name,
            }
          };
          break;
          
        case 'ticket':
          mappedItem = {
            ...mappedItem,
            date: new Date(item.journeyDate || ''),
            categoryId: item.travelMode || null,
            description: `${item.fromPlace || ''} to ${item.toPlace || ''} - Ticket`,
            // Store all ticket-specific data
            metadata: {
              journeyDate: item.journeyDate,
              journeyType: item.journeyType,
              fromPlace: item.fromPlace,
              toPlace: item.toPlace,
              travelMode: item.travelMode,
              travelClass: item.travelClass,
              policy: item.policy,
              supportingDocumentAvailable: item.supportingDocumentAvailable,
              // Supporting document fields
              billNo: item.billNo,
              billDate: item.billDate,
              vendorId: item.vendorId,
              documentFile: item.documentFile?.name,
              paidBy: item.paidBy,
              vendorName: item.vendorName,
              spentDate: item.spentDate,
              billableToCustomer: item.billableToCustomer,
              distributeCost: item.distributeCost,
              notes: item.notes,
              receiptFile: item.receiptFile?.name,
            }
          };
          break;
          
        case 'accommodation':
          mappedItem = {
            ...mappedItem,
            date: new Date(item.fromDate || ''),
            categoryId: item.accommodation || null,
            description: `${item.cityPlace || ''} - Accommodation`,
            // Store all accommodation-specific data
            metadata: {
              fromDate: item.fromDate,
              toDate: item.toDate,
              accommodation: item.accommodation,
              class: item.class,
              cityPlace: item.cityPlace,
              policy: item.policy,
              supportingDocumentAvailable: item.supportingDocumentAvailable,
              // Supporting document fields
              billNo: item.billNo,
              billDate: item.billDate,
              vendorId: item.vendorId,
              documentFile: item.documentFile?.name,
              paidBy: item.paidBy,
              vendorName: item.vendorName,
              spentDate: item.spentDate,
              billableToCustomer: item.billableToCustomer,
              distributeCost: item.distributeCost,
              notes: item.notes,
              receiptFile: item.receiptFile?.name,
            }
          };
          break;
          
        case 'conveyance':
          mappedItem = {
            ...mappedItem,
            date: new Date(item.fromDate || ''),
            categoryId: item.conveyanceMode || null,
            description: `${item.fromPlace || ''} to ${item.toPlace || ''} - Conveyance`,
            // Store all conveyance-specific data
            metadata: {
              fromDate: item.fromDate,
              toDate: item.toDate,
              city: item.city,
              fromPlace: item.fromPlace,
              toPlace: item.toPlace,
              conveyanceMode: item.conveyanceMode,
              journeyType: item.journeyType,
              estimatedDistance: item.estimatedDistance,
              class: item.class,
              organization: item.organization,
              person: item.person,
              purpose: item.purpose,
              policy: item.policy,
              supportingDocumentAvailable: item.supportingDocumentAvailable,
              // Supporting document fields
              billNo: item.billNo,
              billDate: item.billDate,
              vendorId: item.vendorId,
              documentFile: item.documentFile?.name,
              paidBy: item.paidBy,
              receiptFile: item.receiptFile?.name,
            }
          };
          break;
      }

      return mappedItem;
    });

    const extraAmount = Math.max(0, totalAmount - originalRequestAmount);

    // Prepare cost distributions for submission
    const distributionsForSubmission = distributeCost && costDistributions.length > 0
      ? costDistributions.filter(dist => dist.costCenterId && dist.amount).map(dist => ({
          costCenterId: dist.costCenterId,
          costCenterName: dist.costCenterName,
          costCenterType: dist.costCenterType,
          amount: parseFloat(dist.amount),
        }))
      : [];

    createClaimMutation.mutate({
      title: claimTitle,
      description: claimDescription,
      requestId: selectedRequestId || undefined,
      vendorId: selectedVendorId || undefined,
      vendorInvoiceNumber: vendorInvoiceNumber || undefined,
      totalAmount,
      originalRequestAmount,
      extraAmount,
      currency: primaryCurrency,
      items: itemsForSubmission,
      // Add cost distribution data
      distributeCost,
      costDistributions: distributionsForSubmission,
    });
  };

  const handleFileUpload = (index: number, file: File) => {
    updateItem(index, "receiptFile", file);
  };

  // Helper component for rendering expense form
  const renderExpenseForm = (item: ExpenseItem, globalIndex: number, sectionPrefix: string = '', sectionItemsLength: number = 1) => (
    <div key={`${sectionPrefix}item-${globalIndex}`} className="p-4 border border-gray-200 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Expense #{globalIndex + 1}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeItemFromSection(globalIndex)}
          data-testid={`button-remove-${sectionPrefix}item-${globalIndex}`}
          disabled={isTravelClaim ? sectionItemsLength === 1 && items.length === 1 : items.length === 1}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* From Date and To Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}fromDate-${globalIndex}`}>From Date</Label>
          <Input
            id={`${sectionPrefix}fromDate-${globalIndex}`}
            type="date"
            value={item.fromDate || ''}
            onChange={(e) => updateItem(globalIndex, "fromDate", e.target.value)}
            required
            data-testid={`input-${sectionPrefix}fromDate-${globalIndex}`}
          />
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}toDate-${globalIndex}`}>To Date</Label>
          <Input
            id={`${sectionPrefix}toDate-${globalIndex}`}
            type="date"
            value={item.toDate || ''}
            onChange={(e) => updateItem(globalIndex, "toDate", e.target.value)}
            required
            data-testid={`input-${sectionPrefix}toDate-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* City/Place and Expense Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}cityPlace-${globalIndex}`}>City / Place</Label>
          <Input
            id={`${sectionPrefix}cityPlace-${globalIndex}`}
            value={item.cityPlace || ''}
            onChange={(e) => updateItem(globalIndex, "cityPlace", e.target.value)}
            placeholder="City / Place"
            required
            data-testid={`input-${sectionPrefix}cityPlace-${globalIndex}`}
          />
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}expenseType-${globalIndex}`}>Expense Type *</Label>
          <Select
            value={item.expenseType || ''}
            onValueChange={(value) => updateItem(globalIndex, "expenseType", value)}
          >
            <SelectTrigger data-testid={`select-${sectionPrefix}expenseType-${globalIndex}`}>
              <SelectValue placeholder="-- Expense Heads--" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(expenseHeads) ? expenseHeads.map((head: any) => (
                <SelectItem key={head.id} value={head.id}>
                  {head.name}
                </SelectItem>
              )) : (
                <SelectItem value="loading" disabled>Loading expense heads...</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Class */}
      <div>
        <Label htmlFor={`${sectionPrefix}class-${globalIndex}`}>Class *</Label>
        <Select
          value={item.class || ''}
          onValueChange={(value) => updateItem(globalIndex, "class", value)}
        >
          <SelectTrigger data-testid={`select-${sectionPrefix}class-${globalIndex}`}>
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="economy">Economy</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Incurred Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}amount-${globalIndex}`}>Incurred Amount *</Label>
          <div className="flex">
            <Select
              value={item.currency}
              onValueChange={(value) => updateItem(globalIndex, "currency", value)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id={`${sectionPrefix}amount-${globalIndex}`}
              type="number"
              step="0.01"
              value={item.amount}
              onChange={(e) => updateItem(globalIndex, "amount", e.target.value)}
              placeholder="Amount"
              required
              data-testid={`input-${sectionPrefix}amount-${globalIndex}`}
            />
          </div>
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}policy-${globalIndex}`}>Policy</Label>
          <Input
            id={`${sectionPrefix}policy-${globalIndex}`}
            value={item.policy || ''}
            onChange={(e) => updateItem(globalIndex, "policy", e.target.value)}
            placeholder="Policy"
            data-testid={`input-${sectionPrefix}policy-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* Bill Details Section */}
      <div className="border-t pt-4">
        <h4 className="text-base font-medium mb-4">Bill Details</h4>
        
        {/* Supporting Document Available */}
        <div className="mb-4">
          <Label className="text-sm font-medium">Supporting Document Available</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}supportDoc-yes-${globalIndex}`}
                name={`${sectionPrefix}supportDoc-${globalIndex}`}
                value="yes"
                checked={item.supportingDocumentAvailable === 'yes'}
                onChange={(e) => updateItem(globalIndex, "supportingDocumentAvailable", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}supportDoc-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}supportDoc-no-${globalIndex}`}
                name={`${sectionPrefix}supportDoc-${globalIndex}`}
                value="no"
                checked={item.supportingDocumentAvailable === 'no'}
                onChange={(e) => updateItem(globalIndex, "supportingDocumentAvailable", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}supportDoc-no-${globalIndex}`}>No</Label>
            </div>
            <span className="text-sm text-gray-500">(If Self Attested, select 'No')</span>
          </div>
          
          {/* Supporting Document Details - Shows when Supporting Document is "Yes" */}
          {item.supportingDocumentAvailable === 'yes' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
              <h5 className="text-sm font-medium text-blue-800 mb-3">Supporting Document Details</h5>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${sectionPrefix}bill-no-${globalIndex}`} className="text-sm font-medium">
                    Bill No
                  </Label>
                  <Input
                    id={`${sectionPrefix}bill-no-${globalIndex}`}
                    value={item.billNo || ''}
                    onChange={(e) => updateItem(globalIndex, "billNo", e.target.value)}
                    placeholder="Bill No."
                    className="mt-1"
                    data-testid={`input-${sectionPrefix}bill-no-${globalIndex}`}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`${sectionPrefix}bill-date-${globalIndex}`} className="text-sm font-medium">
                    Bill Date
                  </Label>
                  <Input
                    id={`${sectionPrefix}bill-date-${globalIndex}`}
                    type="date"
                    value={item.billDate || ''}
                    onChange={(e) => updateItem(globalIndex, "billDate", e.target.value)}
                    className="mt-1"
                    data-testid={`input-${sectionPrefix}bill-date-${globalIndex}`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${sectionPrefix}document-file-${globalIndex}`} className="text-sm font-medium">
                    Document/Bill
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id={`${sectionPrefix}document-file-${globalIndex}`}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateItem(globalIndex, "documentFile", file);
                      }}
                      className="hidden"
                      data-testid={`input-${sectionPrefix}document-file-${globalIndex}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fileInput = document.getElementById(`${sectionPrefix}document-file-${globalIndex}`) as HTMLInputElement;
                        fileInput?.click();
                      }}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Browse
                    </Button>
                    {item.documentFile && (
                      <span className="text-xs text-green-600 truncate max-w-32">
                        {item.documentFile.name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`${sectionPrefix}vendor-select-${globalIndex}`} className="text-sm font-medium">
                    Vendor
                  </Label>
                  <Select
                    value={item.vendorId || ''}
                    onValueChange={(value) => updateItem(globalIndex, "vendorId", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid={`select-${sectionPrefix}vendor-${globalIndex}`}>
                      <SelectValue placeholder="--select vendor--" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeVendors.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor={`${sectionPrefix}choose-file-${globalIndex}`} className="text-sm font-medium">
                  Choose File
                </Label>
                <div className="mt-1">
                  <Input
                    id={`${sectionPrefix}choose-file-${globalIndex}`}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (4MB = 4 * 1024 * 1024 bytes)
                        if (file.size > 4 * 1024 * 1024) {
                          toast({
                            title: "File too large",
                            description: "Please select a file smaller than 4MB",
                            variant: "destructive"
                          });
                          return;
                        }
                        handleFileUpload(globalIndex, file);
                      }
                    }}
                    data-testid={`input-${sectionPrefix}choose-file-${globalIndex}`}
                  />
                  <p className="text-xs text-blue-600 mt-1">Max 4MB file upload!!!</p>
                  {item.receiptFile && (
                    <p className="text-xs text-green-600 mt-1">
                      File selected: {item.receiptFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Paid by */}
        <div className="mb-4">
          <Label className="text-sm font-medium">Paid by</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}paidBy-self-${globalIndex}`}
                name={`${sectionPrefix}paidBy-${globalIndex}`}
                value="self"
                checked={item.paidBy === 'self'}
                onChange={(e) => updateItem(globalIndex, "paidBy", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}paidBy-self-${globalIndex}`}>Self</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}paidBy-company-${globalIndex}`}
                name={`${sectionPrefix}paidBy-${globalIndex}`}
                value="companyCard"
                checked={item.paidBy === 'companyCard'}
                onChange={(e) => updateItem(globalIndex, "paidBy", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}paidBy-company-${globalIndex}`}>Company Card</Label>
            </div>
          </div>
        </div>
        
        {/* Vendor Name and Spent Date */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor={`${sectionPrefix}vendorName-${globalIndex}`}>Vendor Name</Label>
            <Input
              id={`${sectionPrefix}vendorName-${globalIndex}`}
              value={item.vendorName || ''}
              onChange={(e) => updateItem(globalIndex, "vendorName", e.target.value)}
              placeholder="Vendor Name"
              data-testid={`input-${sectionPrefix}vendorName-${globalIndex}`}
            />
          </div>
          <div>
            <Label htmlFor={`${sectionPrefix}spentDate-${globalIndex}`}>Spent Date</Label>
            <Input
              id={`${sectionPrefix}spentDate-${globalIndex}`}
              type="date"
              value={item.spentDate || ''}
              onChange={(e) => updateItem(globalIndex, "spentDate", e.target.value)}
              data-testid={`input-${sectionPrefix}spentDate-${globalIndex}`}
            />
          </div>
        </div>
        
        {/* Billable to Customer */}
        <div className="mb-4">
          <Label className="text-sm font-medium">Billable to Customer?</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}billable-yes-${globalIndex}`}
                name={`${sectionPrefix}billable-${globalIndex}`}
                value="yes"
                checked={item.billableToCustomer === 'yes'}
                onChange={(e) => updateItem(globalIndex, "billableToCustomer", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}billable-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}billable-no-${globalIndex}`}
                name={`${sectionPrefix}billable-${globalIndex}`}
                value="no"
                checked={item.billableToCustomer === 'no'}
                onChange={(e) => updateItem(globalIndex, "billableToCustomer", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}billable-no-${globalIndex}`}>No</Label>
            </div>
          </div>
        </div>
        
        {/* Distribute Cost */}
        <div className="mb-4">
          <Label className="text-sm font-medium">Distribute Cost?</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}distribute-yes-${globalIndex}`}
                name={`${sectionPrefix}distribute-${globalIndex}`}
                value="yes"
                checked={item.distributeCost === 'yes'}
                onChange={(e) => updateItem(globalIndex, "distributeCost", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}distribute-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}distribute-no-${globalIndex}`}
                name={`${sectionPrefix}distribute-${globalIndex}`}
                value="no"
                checked={item.distributeCost === 'no'}
                onChange={(e) => updateItem(globalIndex, "distributeCost", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}distribute-no-${globalIndex}`}>No</Label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes */}
      <div>
        <Label htmlFor={`${sectionPrefix}notes-${globalIndex}`}>Notes</Label>
        <Textarea
          id={`${sectionPrefix}notes-${globalIndex}`}
          value={item.notes || ''}
          onChange={(e) => updateItem(globalIndex, "notes", e.target.value)}
          placeholder="Notes"
          rows={3}
          data-testid={`textarea-${sectionPrefix}notes-${globalIndex}`}
        />
      </div>
    </div>
  );

  // Helper component for rendering ticket form
  const renderTicketForm = (item: ExpenseItem, globalIndex: number, sectionPrefix: string = '', sectionItemsLength: number = 1) => (
    <div key={`${sectionPrefix}item-${globalIndex}`} className="p-4 border border-gray-200 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Ticket #{globalIndex + 1}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeItemFromSection(globalIndex)}
          data-testid={`button-remove-${sectionPrefix}item-${globalIndex}`}
          disabled={isTravelClaim ? sectionItemsLength === 1 && items.length === 1 : items.length === 1}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Journey Date and Journey Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}journeyDate-${globalIndex}`}>Journey Date</Label>
          <Input
            id={`${sectionPrefix}journeyDate-${globalIndex}`}
            type="date"
            value={item.journeyDate || ''}
            onChange={(e) => updateItem(globalIndex, "journeyDate", e.target.value)}
            required
            data-testid={`input-${sectionPrefix}journeyDate-${globalIndex}`}
          />
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}journeyType-${globalIndex}`}>Journey Type</Label>
          <Select
            value={item.journeyType || ''}
            onValueChange={(value) => updateItem(globalIndex, "journeyType", value)}
          >
            <SelectTrigger data-testid={`select-${sectionPrefix}journeyType-${globalIndex}`}>
              <SelectValue placeholder="One Way Trip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oneWay">One Way Trip</SelectItem>
              <SelectItem value="roundTrip">Round Trip</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* From Place and To Place */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}fromPlace-${globalIndex}`}>From Place *</Label>
          <Input
            id={`${sectionPrefix}fromPlace-${globalIndex}`}
            value={item.fromPlace || ''}
            onChange={(e) => updateItem(globalIndex, "fromPlace", e.target.value)}
            placeholder="From Place"
            required
            data-testid={`input-${sectionPrefix}fromPlace-${globalIndex}`}
          />
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}toPlace-${globalIndex}`}>To Place *</Label>
          <Input
            id={`${sectionPrefix}toPlace-${globalIndex}`}
            value={item.toPlace || ''}
            onChange={(e) => updateItem(globalIndex, "toPlace", e.target.value)}
            placeholder="To Place"
            required
            data-testid={`input-${sectionPrefix}toPlace-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* Travel Mode and Travel Class */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}travelMode-${globalIndex}`}>Travel Mode *</Label>
          <Select
            value={item.travelMode || ''}
            onValueChange={(value) => updateItem(globalIndex, "travelMode", value)}
          >
            <SelectTrigger data-testid={`select-${sectionPrefix}travelMode-${globalIndex}`}>
              <SelectValue placeholder="--Expense Head--" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(expenseHeads) ? expenseHeads.map((head: any) => (
                <SelectItem key={head.id} value={head.id}>
                  {head.name}
                </SelectItem>
              )) : (
                <SelectItem value="loading" disabled>Loading expense heads...</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}travelClass-${globalIndex}`}>Travel Class</Label>
          <Select
            value={item.travelClass || ''}
            onValueChange={(value) => updateItem(globalIndex, "travelClass", value)}
          >
            <SelectTrigger data-testid={`select-${sectionPrefix}travelClass-${globalIndex}`}>
              <SelectValue placeholder="Select travel class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Incurred Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}amount-${globalIndex}`}>Incurred Amount *</Label>
          <div className="flex">
            <Select
              value={item.currency}
              onValueChange={(value) => updateItem(globalIndex, "currency", value)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id={`${sectionPrefix}amount-${globalIndex}`}
              type="number"
              step="0.01"
              value={item.amount}
              onChange={(e) => updateItem(globalIndex, "amount", e.target.value)}
              placeholder="Amount"
              required
              data-testid={`input-${sectionPrefix}amount-${globalIndex}`}
            />
          </div>
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}policy-${globalIndex}`}>Policy</Label>
          <Input
            id={`${sectionPrefix}policy-${globalIndex}`}
            value={item.policy || ''}
            onChange={(e) => updateItem(globalIndex, "policy", e.target.value)}
            placeholder="Policy"
            data-testid={`input-${sectionPrefix}policy-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* Bill Details Section - Same as Expense */}
      <div className="border-t pt-4">
        <h4 className="text-base font-medium mb-4">Bill Details</h4>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Supporting Document Available</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}supportDoc-yes-${globalIndex}`}
                name={`${sectionPrefix}supportDoc-${globalIndex}`}
                value="yes"
                checked={item.supportingDocumentAvailable === 'yes'}
                onChange={(e) => updateItem(globalIndex, "supportingDocumentAvailable", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}supportDoc-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}supportDoc-no-${globalIndex}`}
                name={`${sectionPrefix}supportDoc-${globalIndex}`}
                value="no"
                checked={item.supportingDocumentAvailable === 'no'}
                onChange={(e) => updateItem(globalIndex, "supportingDocumentAvailable", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}supportDoc-no-${globalIndex}`}>No</Label>
            </div>
            <span className="text-sm text-gray-500">(If Self Attested, select 'No')</span>
          </div>
          
          {/* Supporting Document Details - Shows when Supporting Document is "Yes" */}
          {item.supportingDocumentAvailable === 'yes' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
              <h5 className="text-sm font-medium text-blue-800 mb-3">Supporting Document Details</h5>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${sectionPrefix}bill-no-${globalIndex}`} className="text-sm font-medium">
                    Bill No
                  </Label>
                  <Input
                    id={`${sectionPrefix}bill-no-${globalIndex}`}
                    value={item.billNo || ''}
                    onChange={(e) => updateItem(globalIndex, "billNo", e.target.value)}
                    placeholder="Bill No."
                    className="mt-1"
                    data-testid={`input-${sectionPrefix}bill-no-${globalIndex}`}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`${sectionPrefix}bill-date-${globalIndex}`} className="text-sm font-medium">
                    Bill Date
                  </Label>
                  <Input
                    id={`${sectionPrefix}bill-date-${globalIndex}`}
                    type="date"
                    value={item.billDate || ''}
                    onChange={(e) => updateItem(globalIndex, "billDate", e.target.value)}
                    className="mt-1"
                    data-testid={`input-${sectionPrefix}bill-date-${globalIndex}`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${sectionPrefix}document-file-${globalIndex}`} className="text-sm font-medium">
                    Document/Bill
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id={`${sectionPrefix}document-file-${globalIndex}`}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateItem(globalIndex, "documentFile", file);
                      }}
                      className="hidden"
                      data-testid={`input-${sectionPrefix}document-file-${globalIndex}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fileInput = document.getElementById(`${sectionPrefix}document-file-${globalIndex}`) as HTMLInputElement;
                        fileInput?.click();
                      }}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Browse
                    </Button>
                    {item.documentFile && (
                      <span className="text-xs text-green-600 truncate max-w-32">
                        {item.documentFile.name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`${sectionPrefix}vendor-select-${globalIndex}`} className="text-sm font-medium">
                    Vendor
                  </Label>
                  <Select
                    value={item.vendorId || ''}
                    onValueChange={(value) => updateItem(globalIndex, "vendorId", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid={`select-${sectionPrefix}vendor-${globalIndex}`}>
                      <SelectValue placeholder="--select vendor--" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeVendors.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor={`${sectionPrefix}choose-file-${globalIndex}`} className="text-sm font-medium">
                  Choose File
                </Label>
                <div className="mt-1">
                  <Input
                    id={`${sectionPrefix}choose-file-${globalIndex}`}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (4MB = 4 * 1024 * 1024 bytes)
                        if (file.size > 4 * 1024 * 1024) {
                          toast({
                            title: "File too large",
                            description: "Please select a file smaller than 4MB",
                            variant: "destructive"
                          });
                          return;
                        }
                        handleFileUpload(globalIndex, file);
                      }
                    }}
                    data-testid={`input-${sectionPrefix}choose-file-${globalIndex}`}
                  />
                  <p className="text-xs text-blue-600 mt-1">Max 4MB file upload!!!</p>
                  {item.receiptFile && (
                    <p className="text-xs text-green-600 mt-1">
                      File selected: {item.receiptFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Paid by</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}paidBy-self-${globalIndex}`}
                name={`${sectionPrefix}paidBy-${globalIndex}`}
                value="self"
                checked={item.paidBy === 'self'}
                onChange={(e) => updateItem(globalIndex, "paidBy", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}paidBy-self-${globalIndex}`}>Self</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}paidBy-company-${globalIndex}`}
                name={`${sectionPrefix}paidBy-${globalIndex}`}
                value="companyCard"
                checked={item.paidBy === 'companyCard'}
                onChange={(e) => updateItem(globalIndex, "paidBy", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}paidBy-company-${globalIndex}`}>Company Card</Label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor={`${sectionPrefix}vendorName-${globalIndex}`}>Vendor Name</Label>
            <Input
              id={`${sectionPrefix}vendorName-${globalIndex}`}
              value={item.vendorName || ''}
              onChange={(e) => updateItem(globalIndex, "vendorName", e.target.value)}
              placeholder="Vendor Name"
              data-testid={`input-${sectionPrefix}vendorName-${globalIndex}`}
            />
          </div>
          <div>
            <Label htmlFor={`${sectionPrefix}spentDate-${globalIndex}`}>Spent Date</Label>
            <Input
              id={`${sectionPrefix}spentDate-${globalIndex}`}
              type="date"
              value={item.spentDate || ''}
              onChange={(e) => updateItem(globalIndex, "spentDate", e.target.value)}
              data-testid={`input-${sectionPrefix}spentDate-${globalIndex}`}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Billable to Customer?</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}billable-yes-${globalIndex}`}
                name={`${sectionPrefix}billable-${globalIndex}`}
                value="yes"
                checked={item.billableToCustomer === 'yes'}
                onChange={(e) => updateItem(globalIndex, "billableToCustomer", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}billable-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}billable-no-${globalIndex}`}
                name={`${sectionPrefix}billable-${globalIndex}`}
                value="no"
                checked={item.billableToCustomer === 'no'}
                onChange={(e) => updateItem(globalIndex, "billableToCustomer", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}billable-no-${globalIndex}`}>No</Label>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Distribute Cost?</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}distribute-yes-${globalIndex}`}
                name={`${sectionPrefix}distribute-${globalIndex}`}
                value="yes"
                checked={item.distributeCost === 'yes'}
                onChange={(e) => updateItem(globalIndex, "distributeCost", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}distribute-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}distribute-no-${globalIndex}`}
                name={`${sectionPrefix}distribute-${globalIndex}`}
                value="no"
                checked={item.distributeCost === 'no'}
                onChange={(e) => updateItem(globalIndex, "distributeCost", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}distribute-no-${globalIndex}`}>No</Label>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor={`${sectionPrefix}notes-${globalIndex}`}>Notes</Label>
        <Textarea
          id={`${sectionPrefix}notes-${globalIndex}`}
          value={item.notes || ''}
          onChange={(e) => updateItem(globalIndex, "notes", e.target.value)}
          placeholder="Notes"
          rows={3}
          data-testid={`textarea-${sectionPrefix}notes-${globalIndex}`}
        />
      </div>
    </div>
  );

  // Helper component for rendering accommodation form
  const renderAccommodationForm = (item: ExpenseItem, globalIndex: number, sectionPrefix: string = '', sectionItemsLength: number = 1) => (
    <div key={`${sectionPrefix}item-${globalIndex}`} className="p-4 border border-gray-200 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Accommodation #{globalIndex + 1}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeItemFromSection(globalIndex)}
          data-testid={`button-remove-${sectionPrefix}item-${globalIndex}`}
          disabled={isTravelClaim ? sectionItemsLength === 1 && items.length === 1 : items.length === 1}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* From Date and To Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}fromDate-${globalIndex}`}>From Date</Label>
          <Input
            id={`${sectionPrefix}fromDate-${globalIndex}`}
            type="date"
            value={item.fromDate || ''}
            onChange={(e) => updateItem(globalIndex, "fromDate", e.target.value)}
            required
            data-testid={`input-${sectionPrefix}fromDate-${globalIndex}`}
          />
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}toDate-${globalIndex}`}>To Date</Label>
          <Input
            id={`${sectionPrefix}toDate-${globalIndex}`}
            type="date"
            value={item.toDate || ''}
            onChange={(e) => updateItem(globalIndex, "toDate", e.target.value)}
            required
            data-testid={`input-${sectionPrefix}toDate-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* Accommodation and Class */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}accommodation-${globalIndex}`}>Accommodation *</Label>
          <Select
            value={item.accommodation || ''}
            onValueChange={(value) => updateItem(globalIndex, "accommodation", value)}
          >
            <SelectTrigger data-testid={`select-${sectionPrefix}accommodation-${globalIndex}`}>
              <SelectValue placeholder="-- Accommodation--" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(expenseHeads) ? expenseHeads.map((head: any) => (
                <SelectItem key={head.id} value={head.id}>
                  {head.name}
                </SelectItem>
              )) : (
                <SelectItem value="loading" disabled>Loading expense heads...</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}class-${globalIndex}`}>Class *</Label>
          <Select
            value={item.class || ''}
            onValueChange={(value) => updateItem(globalIndex, "class", value)}
          >
            <SelectTrigger data-testid={`select-${sectionPrefix}class-${globalIndex}`}>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* City/Place */}
      <div>
        <Label htmlFor={`${sectionPrefix}cityPlace-${globalIndex}`}>City / Place</Label>
        <Input
          id={`${sectionPrefix}cityPlace-${globalIndex}`}
          value={item.cityPlace || ''}
          onChange={(e) => updateItem(globalIndex, "cityPlace", e.target.value)}
          placeholder="City / Place"
          required
          data-testid={`input-${sectionPrefix}cityPlace-${globalIndex}`}
        />
      </div>
      
      {/* Incurred Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}amount-${globalIndex}`}>Incurred Amount *</Label>
          <div className="flex">
            <Select
              value={item.currency}
              onValueChange={(value) => updateItem(globalIndex, "currency", value)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id={`${sectionPrefix}amount-${globalIndex}`}
              type="number"
              step="0.01"
              value={item.amount}
              onChange={(e) => updateItem(globalIndex, "amount", e.target.value)}
              placeholder="Amount"
              required
              data-testid={`input-${sectionPrefix}amount-${globalIndex}`}
            />
          </div>
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}policy-${globalIndex}`}>Policy</Label>
          <Input
            id={`${sectionPrefix}policy-${globalIndex}`}
            value={item.policy || ''}
            onChange={(e) => updateItem(globalIndex, "policy", e.target.value)}
            placeholder="Policy"
            data-testid={`input-${sectionPrefix}policy-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* Bill Details Section - Same as others */}
      <div className="border-t pt-4">
        <h4 className="text-base font-medium mb-4">Bill Details</h4>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Supporting Document Available</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}supportDoc-yes-${globalIndex}`}
                name={`${sectionPrefix}supportDoc-${globalIndex}`}
                value="yes"
                checked={item.supportingDocumentAvailable === 'yes'}
                onChange={(e) => updateItem(globalIndex, "supportingDocumentAvailable", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}supportDoc-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}supportDoc-no-${globalIndex}`}
                name={`${sectionPrefix}supportDoc-${globalIndex}`}
                value="no"
                checked={item.supportingDocumentAvailable === 'no'}
                onChange={(e) => updateItem(globalIndex, "supportingDocumentAvailable", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}supportDoc-no-${globalIndex}`}>No</Label>
            </div>
            <span className="text-sm text-gray-500">(If Self Attested, select 'No')</span>
          </div>
          
          {/* Supporting Document Details - Shows when Supporting Document is "Yes" */}
          {item.supportingDocumentAvailable === 'yes' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
              <h5 className="text-sm font-medium text-blue-800 mb-3">Supporting Document Details</h5>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${sectionPrefix}bill-no-${globalIndex}`} className="text-sm font-medium">
                    Bill No
                  </Label>
                  <Input
                    id={`${sectionPrefix}bill-no-${globalIndex}`}
                    value={item.billNo || ''}
                    onChange={(e) => updateItem(globalIndex, "billNo", e.target.value)}
                    placeholder="Bill No."
                    className="mt-1"
                    data-testid={`input-${sectionPrefix}bill-no-${globalIndex}`}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`${sectionPrefix}bill-date-${globalIndex}`} className="text-sm font-medium">
                    Bill Date
                  </Label>
                  <Input
                    id={`${sectionPrefix}bill-date-${globalIndex}`}
                    type="date"
                    value={item.billDate || ''}
                    onChange={(e) => updateItem(globalIndex, "billDate", e.target.value)}
                    className="mt-1"
                    data-testid={`input-${sectionPrefix}bill-date-${globalIndex}`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${sectionPrefix}document-file-${globalIndex}`} className="text-sm font-medium">
                    Document/Bill
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id={`${sectionPrefix}document-file-${globalIndex}`}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateItem(globalIndex, "documentFile", file);
                      }}
                      className="hidden"
                      data-testid={`input-${sectionPrefix}document-file-${globalIndex}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fileInput = document.getElementById(`${sectionPrefix}document-file-${globalIndex}`) as HTMLInputElement;
                        fileInput?.click();
                      }}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Browse
                    </Button>
                    {item.documentFile && (
                      <span className="text-xs text-green-600 truncate max-w-32">
                        {item.documentFile.name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`${sectionPrefix}vendor-select-${globalIndex}`} className="text-sm font-medium">
                    Vendor
                  </Label>
                  <Select
                    value={item.vendorId || ''}
                    onValueChange={(value) => updateItem(globalIndex, "vendorId", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid={`select-${sectionPrefix}vendor-${globalIndex}`}>
                      <SelectValue placeholder="--select vendor--" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeVendors.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor={`${sectionPrefix}choose-file-${globalIndex}`} className="text-sm font-medium">
                  Choose File
                </Label>
                <div className="mt-1">
                  <Input
                    id={`${sectionPrefix}choose-file-${globalIndex}`}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (4MB = 4 * 1024 * 1024 bytes)
                        if (file.size > 4 * 1024 * 1024) {
                          toast({
                            title: "File too large",
                            description: "Please select a file smaller than 4MB",
                            variant: "destructive"
                          });
                          return;
                        }
                        handleFileUpload(globalIndex, file);
                      }
                    }}
                    data-testid={`input-${sectionPrefix}choose-file-${globalIndex}`}
                  />
                  <p className="text-xs text-blue-600 mt-1">Max 4MB file upload!!!</p>
                  {item.receiptFile && (
                    <p className="text-xs text-green-600 mt-1">
                      File selected: {item.receiptFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Paid by</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}paidBy-self-${globalIndex}`}
                name={`${sectionPrefix}paidBy-${globalIndex}`}
                value="self"
                checked={item.paidBy === 'self'}
                onChange={(e) => updateItem(globalIndex, "paidBy", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}paidBy-self-${globalIndex}`}>Self</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}paidBy-company-${globalIndex}`}
                name={`${sectionPrefix}paidBy-${globalIndex}`}
                value="companyCard"
                checked={item.paidBy === 'companyCard'}
                onChange={(e) => updateItem(globalIndex, "paidBy", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}paidBy-company-${globalIndex}`}>Company Card</Label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor={`${sectionPrefix}vendorName-${globalIndex}`}>Vendor Name</Label>
            <Input
              id={`${sectionPrefix}vendorName-${globalIndex}`}
              value={item.vendorName || ''}
              onChange={(e) => updateItem(globalIndex, "vendorName", e.target.value)}
              placeholder="Vendor Name"
              data-testid={`input-${sectionPrefix}vendorName-${globalIndex}`}
            />
          </div>
          <div>
            <Label htmlFor={`${sectionPrefix}spentDate-${globalIndex}`}>Spent Date</Label>
            <Input
              id={`${sectionPrefix}spentDate-${globalIndex}`}
              type="date"
              value={item.spentDate || ''}
              onChange={(e) => updateItem(globalIndex, "spentDate", e.target.value)}
              data-testid={`input-${sectionPrefix}spentDate-${globalIndex}`}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Billable to Customer?</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}billable-yes-${globalIndex}`}
                name={`${sectionPrefix}billable-${globalIndex}`}
                value="yes"
                checked={item.billableToCustomer === 'yes'}
                onChange={(e) => updateItem(globalIndex, "billableToCustomer", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}billable-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}billable-no-${globalIndex}`}
                name={`${sectionPrefix}billable-${globalIndex}`}
                value="no"
                checked={item.billableToCustomer === 'no'}
                onChange={(e) => updateItem(globalIndex, "billableToCustomer", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}billable-no-${globalIndex}`}>No</Label>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Distribute Cost?</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}distribute-yes-${globalIndex}`}
                name={`${sectionPrefix}distribute-${globalIndex}`}
                value="yes"
                checked={item.distributeCost === 'yes'}
                onChange={(e) => updateItem(globalIndex, "distributeCost", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}distribute-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}distribute-no-${globalIndex}`}
                name={`${sectionPrefix}distribute-${globalIndex}`}
                value="no"
                checked={item.distributeCost === 'no'}
                onChange={(e) => updateItem(globalIndex, "distributeCost", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}distribute-no-${globalIndex}`}>No</Label>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor={`${sectionPrefix}notes-${globalIndex}`}>Notes</Label>
        <Textarea
          id={`${sectionPrefix}notes-${globalIndex}`}
          value={item.notes || ''}
          onChange={(e) => updateItem(globalIndex, "notes", e.target.value)}
          placeholder="Notes"
          rows={3}
          data-testid={`textarea-${sectionPrefix}notes-${globalIndex}`}
        />
      </div>
    </div>
  );

  // Helper component for rendering conveyance form
  const renderConveyanceForm = (item: ExpenseItem, globalIndex: number, sectionPrefix: string = '', sectionItemsLength: number = 1) => (
    <div key={`${sectionPrefix}item-${globalIndex}`} className="p-4 border border-gray-200 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Conveyance</span>
        <Button
          variant="outline"
          size="sm"
          data-testid="button-add-conveyance"
        >
          Add Conveyance
        </Button>
      </div>
      
      {/* Date / From date and To Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}fromDate-${globalIndex}`}>Date / From date</Label>
          <Input
            id={`${sectionPrefix}fromDate-${globalIndex}`}
            type="date"
            value={item.fromDate || ''}
            onChange={(e) => updateItem(globalIndex, "fromDate", e.target.value)}
            required
            data-testid={`input-${sectionPrefix}fromDate-${globalIndex}`}
          />
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}toDate-${globalIndex}`}>To Date</Label>
          <Input
            id={`${sectionPrefix}toDate-${globalIndex}`}
            type="date"
            value={item.toDate || ''}
            onChange={(e) => updateItem(globalIndex, "toDate", e.target.value)}
            data-testid={`input-${sectionPrefix}toDate-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* City */}
      <div>
        <Label htmlFor={`${sectionPrefix}city-${globalIndex}`}>City</Label>
        <Input
          id={`${sectionPrefix}city-${globalIndex}`}
          value={item.city || ''}
          onChange={(e) => updateItem(globalIndex, "city", e.target.value)}
          placeholder="City"
          data-testid={`input-${sectionPrefix}city-${globalIndex}`}
        />
      </div>
      
      {/* From Place and To Place */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}fromPlace-${globalIndex}`}>From Place *</Label>
          <Input
            id={`${sectionPrefix}fromPlace-${globalIndex}`}
            value={item.fromPlace || ''}
            onChange={(e) => updateItem(globalIndex, "fromPlace", e.target.value)}
            placeholder="From Place"
            required
            data-testid={`input-${sectionPrefix}fromPlace-${globalIndex}`}
          />
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}toPlace-${globalIndex}`}>To Place *</Label>
          <Input
            id={`${sectionPrefix}toPlace-${globalIndex}`}
            value={item.toPlace || ''}
            onChange={(e) => updateItem(globalIndex, "toPlace", e.target.value)}
            placeholder="To Place"
            required
            data-testid={`input-${sectionPrefix}toPlace-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* Conveyance Mode, Journey Type, Estimated Distance */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}conveyanceMode-${globalIndex}`}>Conveyance Mode *</Label>
          <Select
            value={item.conveyanceMode || ''}
            onValueChange={(value) => updateItem(globalIndex, "conveyanceMode", value)}
          >
            <SelectTrigger data-testid={`select-${sectionPrefix}conveyanceMode-${globalIndex}`}>
              <SelectValue placeholder="-- Expense heads--" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(expenseHeads) ? expenseHeads.map((head: any) => (
                <SelectItem key={head.id} value={head.id}>
                  {head.name}
                </SelectItem>
              )) : (
                <SelectItem value="loading" disabled>Loading expense heads...</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}journeyType-${globalIndex}`}>Journey Type</Label>
          <Select
            value={item.journeyType || ''}
            onValueChange={(value) => updateItem(globalIndex, "journeyType", value)}
          >
            <SelectTrigger data-testid={`select-${sectionPrefix}journeyType-${globalIndex}`}>
              <SelectValue placeholder="Oneway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oneway">Oneway</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}estimatedDistance-${globalIndex}`}>Estimated Distance</Label>
          <div className="flex">
            <Input
              id={`${sectionPrefix}estimatedDistance-${globalIndex}`}
              type="number"
              value={item.estimatedDistance || ''}
              onChange={(e) => updateItem(globalIndex, "estimatedDistance", e.target.value)}
              placeholder="0"
              data-testid={`input-${sectionPrefix}estimatedDistance-${globalIndex}`}
            />
            <span className="ml-2 self-center text-sm text-gray-500">KM</span>
          </div>
        </div>
      </div>
      
      {/* Class */}
      <div>
        <Label htmlFor={`${sectionPrefix}class-${globalIndex}`}>Class *</Label>
        <Select
          value={item.class || ''}
          onValueChange={(value) => updateItem(globalIndex, "class", value)}
        >
          <SelectTrigger data-testid={`select-${sectionPrefix}class-${globalIndex}`}>
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="economy">Economy</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Organization, Person, Purpose */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}organization-${globalIndex}`}>Organization</Label>
          <Input
            id={`${sectionPrefix}organization-${globalIndex}`}
            value={item.organization || ''}
            onChange={(e) => updateItem(globalIndex, "organization", e.target.value)}
            placeholder="Organization"
            data-testid={`input-${sectionPrefix}organization-${globalIndex}`}
          />
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}person-${globalIndex}`}>Person</Label>
          <Input
            id={`${sectionPrefix}person-${globalIndex}`}
            value={item.person || ''}
            onChange={(e) => updateItem(globalIndex, "person", e.target.value)}
            placeholder="Person"
            data-testid={`input-${sectionPrefix}person-${globalIndex}`}
          />
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}purpose-${globalIndex}`}>Purpose</Label>
          <Input
            id={`${sectionPrefix}purpose-${globalIndex}`}
            value={item.purpose || ''}
            onChange={(e) => updateItem(globalIndex, "purpose", e.target.value)}
            placeholder="Purpose"
            data-testid={`input-${sectionPrefix}purpose-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* Incurred Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${sectionPrefix}amount-${globalIndex}`}>Incurred Amount *</Label>
          <div className="flex">
            <Select
              value={item.currency}
              onValueChange={(value) => updateItem(globalIndex, "currency", value)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id={`${sectionPrefix}amount-${globalIndex}`}
              type="number"
              step="0.01"
              value={item.amount}
              onChange={(e) => updateItem(globalIndex, "amount", e.target.value)}
              placeholder="Amount"
              required
              data-testid={`input-${sectionPrefix}amount-${globalIndex}`}
            />
          </div>
        </div>
        <div>
          <Label htmlFor={`${sectionPrefix}policy-${globalIndex}`}>Policy</Label>
          <Input
            id={`${sectionPrefix}policy-${globalIndex}`}
            value={item.policy || ''}
            onChange={(e) => updateItem(globalIndex, "policy", e.target.value)}
            placeholder="Policy"
            data-testid={`input-${sectionPrefix}policy-${globalIndex}`}
          />
        </div>
      </div>
      
      {/* Bill Details Section - Same as others */}
      <div className="border-t pt-4">
        <h4 className="text-base font-medium mb-4">Bill Details</h4>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Supporting Document Available</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}supportDoc-yes-${globalIndex}`}
                name={`${sectionPrefix}supportDoc-${globalIndex}`}
                value="yes"
                checked={item.supportingDocumentAvailable === 'yes'}
                onChange={(e) => updateItem(globalIndex, "supportingDocumentAvailable", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}supportDoc-yes-${globalIndex}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}supportDoc-no-${globalIndex}`}
                name={`${sectionPrefix}supportDoc-${globalIndex}`}
                value="no"
                checked={item.supportingDocumentAvailable === 'no'}
                onChange={(e) => updateItem(globalIndex, "supportingDocumentAvailable", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}supportDoc-no-${globalIndex}`}>No</Label>
            </div>
            <span className="text-sm text-gray-500">(If Self Attested, select 'No')</span>
          </div>
          
          {/* Supporting Document Details - Shows when Supporting Document is "Yes" */}
          {item.supportingDocumentAvailable === 'yes' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
              <h5 className="text-sm font-medium text-blue-800 mb-3">Supporting Document Details</h5>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${sectionPrefix}bill-no-${globalIndex}`} className="text-sm font-medium">
                    Bill No
                  </Label>
                  <Input
                    id={`${sectionPrefix}bill-no-${globalIndex}`}
                    value={item.billNo || ''}
                    onChange={(e) => updateItem(globalIndex, "billNo", e.target.value)}
                    placeholder="Bill No."
                    className="mt-1"
                    data-testid={`input-${sectionPrefix}bill-no-${globalIndex}`}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`${sectionPrefix}bill-date-${globalIndex}`} className="text-sm font-medium">
                    Bill Date
                  </Label>
                  <Input
                    id={`${sectionPrefix}bill-date-${globalIndex}`}
                    type="date"
                    value={item.billDate || ''}
                    onChange={(e) => updateItem(globalIndex, "billDate", e.target.value)}
                    className="mt-1"
                    data-testid={`input-${sectionPrefix}bill-date-${globalIndex}`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${sectionPrefix}document-file-${globalIndex}`} className="text-sm font-medium">
                    Document/Bill
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id={`${sectionPrefix}document-file-${globalIndex}`}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateItem(globalIndex, "documentFile", file);
                      }}
                      className="hidden"
                      data-testid={`input-${sectionPrefix}document-file-${globalIndex}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fileInput = document.getElementById(`${sectionPrefix}document-file-${globalIndex}`) as HTMLInputElement;
                        fileInput?.click();
                      }}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Browse
                    </Button>
                    {item.documentFile && (
                      <span className="text-xs text-green-600 truncate max-w-32">
                        {item.documentFile.name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`${sectionPrefix}vendor-select-${globalIndex}`} className="text-sm font-medium">
                    Vendor
                  </Label>
                  <Select
                    value={item.vendorId || ''}
                    onValueChange={(value) => updateItem(globalIndex, "vendorId", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid={`select-${sectionPrefix}vendor-${globalIndex}`}>
                      <SelectValue placeholder="--select vendor--" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeVendors.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor={`${sectionPrefix}choose-file-${globalIndex}`} className="text-sm font-medium">
                  Choose File
                </Label>
                <div className="mt-1">
                  <Input
                    id={`${sectionPrefix}choose-file-${globalIndex}`}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (4MB = 4 * 1024 * 1024 bytes)
                        if (file.size > 4 * 1024 * 1024) {
                          toast({
                            title: "File too large",
                            description: "Please select a file smaller than 4MB",
                            variant: "destructive"
                          });
                          return;
                        }
                        handleFileUpload(globalIndex, file);
                      }
                    }}
                    data-testid={`input-${sectionPrefix}choose-file-${globalIndex}`}
                  />
                  <p className="text-xs text-blue-600 mt-1">Max 4MB file upload!!!</p>
                  {item.receiptFile && (
                    <p className="text-xs text-green-600 mt-1">
                      File selected: {item.receiptFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <Label className="text-sm font-medium">Paid by</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}paidBy-self-${globalIndex}`}
                name={`${sectionPrefix}paidBy-${globalIndex}`}
                value="self"
                checked={item.paidBy === 'self'}
                onChange={(e) => updateItem(globalIndex, "paidBy", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}paidBy-self-${globalIndex}`}>Self</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${sectionPrefix}paidBy-company-${globalIndex}`}
                name={`${sectionPrefix}paidBy-${globalIndex}`}
                value="companyCard"
                checked={item.paidBy === 'companyCard'}
                onChange={(e) => updateItem(globalIndex, "paidBy", e.target.value)}
              />
              <Label htmlFor={`${sectionPrefix}paidBy-company-${globalIndex}`}>Company Card</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main helper component that renders the appropriate form based on section
  const renderItemForm = (item: ExpenseItem, globalIndex: number, sectionPrefix: string = '', sectionItemsLength: number = 1) => {
    const section = item.section || sectionPrefix.replace('-', '') || 'expense';
    
    switch (section) {
      case 'ticket':
        return renderTicketForm(item, globalIndex, sectionPrefix, sectionItemsLength);
      case 'accommodation':
        return renderAccommodationForm(item, globalIndex, sectionPrefix, sectionItemsLength);
      case 'conveyance':
        return renderConveyanceForm(item, globalIndex, sectionPrefix, sectionItemsLength);
      case 'expense':
      default:
        return renderExpenseForm(item, globalIndex, sectionPrefix, sectionItemsLength);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-testid={testId}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>New Expense Claim</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Claim Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="claimTitle">Claim Title</Label>
              <Input
                id="claimTitle"
                value={claimTitle}
                onChange={(e) => setClaimTitle(e.target.value)}
                placeholder="Enter claim title"
                required
                data-testid="input-claim-title"
              />
            </div>

            <div>
              <Label htmlFor="claimDescription">Description</Label>
              <Textarea
                id="claimDescription"
                value={claimDescription}
                onChange={(e) => setClaimDescription(e.target.value)}
                placeholder="Enter claim description"
                data-testid="textarea-claim-description"
              />
            </div>

            {/* Travel Claim Toggle */}
            <div className="flex items-center space-x-3">
              <Label htmlFor="travel-claim" className="text-base font-medium">
                Travel Claim *
              </Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="travel-claim"
                    checked={isTravelClaim}
                    onCheckedChange={(checked) => {
                      setIsTravelClaim(checked);
                      // Reset items when switching between travel and non-travel
                      // Start with the first available section for the new mode
                      const firstSection = availableClaimFormTypes[0] || 'expense';
                      setItems([{
                        date: "",
                        categoryId: "",
                        description: "",
                        amount: "",
                        currency: "INR",
                        section: firstSection,
                      }]);
                    }}
                    data-testid="switch-travel-claim"
                  />
                  <Label htmlFor="travel-claim" className="text-sm">
                    {isTravelClaim ? "Yes" : "No"}
                  </Label>
                </div>
              </div>
            </div>

            {/* Advance Request - Always show */}
            <div>
              <Label htmlFor="requestLink">Advance Request (Optional)</Label>
              <Select
                value={selectedRequestId || "none"}
                onValueChange={handleRequestSelection}
              >
                <SelectTrigger data-testid="select-request-link">
                  <SelectValue placeholder="Select an approved request (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None - Independent claim</SelectItem>
                  {Array.isArray(approvedRequests) && approvedRequests.length > 0 ? (
                    approvedRequests.map((request: any) => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.title} - ₹{parseFloat(request.estimatedAmount || "0").toLocaleString()} ({request.type})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-requests" disabled>
                      No approved requests available - Create and approve requests first
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedRequestId && originalRequestAmount > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Original Request Amount:</strong> ₹{originalRequestAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    You can claim expenses up to or exceeding this amount. Any extra amount will be calculated automatically.
                  </p>
                </div>
              )}
              {(!Array.isArray(approvedRequests) || approvedRequests.length === 0) && (
                <p className="text-sm text-gray-500 mt-1">
                  💡 To see approved requests here, first create expense requests and get them approved by your manager.
                </p>
              )}
            </div>

            {/* Vendor Selection - New */}
            <div>
              <Label htmlFor="vendor">Vendor (Optional)</Label>
              <Select
                value={selectedVendorId || "none"}
                onValueChange={handleVendorSelection}
              >
                <SelectTrigger data-testid="select-vendor">
                  <SelectValue placeholder="Select a vendor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None - Internal expense</SelectItem>
                  {Array.isArray(activeVendors) && activeVendors.length > 0 ? (
                    activeVendors.map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} {vendor.gstin ? `(${vendor.gstin})` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-vendors" disabled>
                      No active vendors available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedVendorId && selectedVendorDetails && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    <strong>Vendor:</strong> {selectedVendorDetails.name}
                  </p>
                  {selectedVendorDetails.gstin && (
                    <p className="text-xs text-green-600">GSTIN: {selectedVendorDetails.gstin}</p>
                  )}
                  {selectedVendorDetails.pan && (
                    <p className="text-xs text-green-600">PAN: {selectedVendorDetails.pan}</p>
                  )}
                </div>
              )}
            </div>

            {/* Vendor Invoice Number - Show only when vendor is selected */}
            {selectedVendorId && selectedVendorId !== "none" && (
              <div>
                <Label htmlFor="vendorInvoice">Vendor Invoice/Bill Number</Label>
                <Input
                  id="vendorInvoice"
                  value={vendorInvoiceNumber}
                  onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                  placeholder="Enter vendor invoice or bill number"
                  data-testid="input-vendor-invoice"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the invoice/bill number provided by the vendor
                </p>
              </div>
            )}
          </div>

          {/* Expense Items - Conditional Layout */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Expense Items</h3>

            {isTravelClaim ? (
              /* Travel Claim Layout - Dynamic Categories Based on Expense Heads */
              <div className="space-y-4">
                {availableClaimFormTypes.map((section) => {
                  const sectionItems = getItemsBySection(section);
                  const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
                  
                  return (
                    <div key={section} className="bg-blue-600 rounded-lg">
                      <div className="p-4 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">+ {sectionTitle}</span>
                            <span className="text-blue-200 text-sm">({sectionItems.length} items)</span>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => addItemToSection(section)}
                            data-testid={`button-add-${section}-item`}
                          >
                            Add Item
                          </Button>
                        </div>
                      </div>
                      
                      {sectionItems.length > 0 && (
                        <div className="p-4 bg-white border-t border-blue-500 space-y-4">
                          {getItemsWithGlobalIndexBySection(section).map(({ item, globalIndex }) => {
                            return renderItemForm(item, globalIndex, `${section}-`, sectionItems.length);
                          })}
                        </div>
                      )}
                      
                      {sectionItems.length === 0 && (
                        <div className="p-4 bg-gray-50 border-t border-blue-500">
                          <p className="text-gray-600 text-center">No {section} items added yet. Click "Add Item" to get started.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Non-Travel Claim Layout - Dynamic Sections Based on Expense Heads */
              <div className="space-y-4">
                {availableClaimFormTypes.map((section) => {
                  const isCollapsed = sectionCollapsed[section];
                  const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
                  const sectionItems = getItemsBySection(section);
                  
                  return (
                    <div key={section} className="bg-blue-600 rounded-lg">
                      <button
                        type="button"
                        className="w-full p-4 text-white text-left flex items-center justify-between"
                        onClick={() => toggleSectionCollapsed(section)}
                        data-testid={`button-toggle-${section}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">+ {sectionTitle}</span>
                          <span className="text-blue-200 text-sm">({sectionItems.length} items)</span>
                        </div>
                        {isCollapsed ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      
                      {isCollapsed && (
                        <div className="p-4 bg-white border-t border-blue-500">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-gray-700">{sectionTitle} Items</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addItemToSection(section)}
                              data-testid={`button-add-${section}-item`}
                            >
                              Add Item
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            {sectionItems.length > 0 ? (
                              getItemsWithGlobalIndexBySection(section).map(({ item, globalIndex }) => {
                                return renderItemForm(item, globalIndex, `${section}-`, sectionItems.length);
                              })
                            ) : (
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-600 text-center">No {section} items added yet. Click "Add Item" to get started.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cost Distribution Section */}
          <div className="space-y-4 pt-6 border-t">
            <div>
              <Label className="text-base font-medium">Cost Distribution</Label>
              <p className="text-sm text-gray-600 mb-3">
                Choose whether to distribute this expense across multiple cost centers
              </p>
              <RadioGroup
                value={distributeCost ? "yes" : "no"}
                onValueChange={(value) => {
                  const shouldDistribute = value === "yes";
                  setDistributeCost(shouldDistribute);
                  
                  // Initialize cost distributions if enabling and none exist
                  if (shouldDistribute && costDistributions.length === 0) {
                    setCostDistributions([{
                      id: `dist_${Date.now()}`,
                      costCenterId: '',
                      costCenterName: '',
                      costCenterType: '',
                      amount: '',
                    }]);
                  }
                  
                  // Clear distributions if disabling
                  if (!shouldDistribute) {
                    setCostDistributions([]);
                  }
                }}
                className="flex items-center gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="distribute-no" />
                  <Label htmlFor="distribute-no">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="distribute-yes" />
                  <Label htmlFor="distribute-yes">Yes</Label>
                </div>
              </RadioGroup>
            </div>

            {distributeCost && (
              <CostDistribution
                totalAmount={items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)}
                distributions={costDistributions}
                onDistributionsChange={setCostDistributions}
                costCenterConfig={
                  costCenterConfig 
                    ? [
                        ...(costCenterConfig?.costCategory1Name ? [{ 
                          id: costCenterConfig?.costCategory1Id, 
                          name: costCenterConfig?.costCategory1Name, 
                          type: 'category1' 
                        }] : []),
                        ...(costCenterConfig?.costCategory2Name ? [{ 
                          id: costCenterConfig?.costCategory2Id, 
                          name: costCenterConfig?.costCategory2Name, 
                          type: 'category2' 
                        }] : []),
                        ...(costCenterConfig?.costCategory3Name ? [{ 
                          id: costCenterConfig?.costCategory3Id, 
                          name: costCenterConfig?.costCategory3Name, 
                          type: 'category3' 
                        }] : [])
                      ]
                    : []
                }
              />
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-claim"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createClaimMutation.isPending}
              data-testid="button-submit-claim"
            >
              {createClaimMutation.isPending ? "Submitting..." : "Submit Claim"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
