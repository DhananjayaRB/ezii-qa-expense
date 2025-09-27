import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { smartMapOcrData } from "@/lib/ocrMapping";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  FileText,
  Search,
  Zap,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import OcrUpload from "@/components/ui/ocr-upload";
import { AzureFileUpload, type AzureFileUpload as AzureFileUploadType } from "@/components/ui/azure-file-upload";

interface ExpenseClaimFormProps {
  expenseHeads: any[];
  onClose: () => void;
  "data-testid"?: string;
}

interface ExpenseItem {
  id: string;
  fromDate: string;
  toDate: string;
  cityPlace: string;
  expenseTypeId: string;
  class: string;
  incurredAmount: string;
  currency: string;
  policy: string;
  supportingDocumentAvailable: "yes" | "no";
  paidBy: "self" | "company_card";
  vendorName: string;
  spentDate: string;
  billableToCustomer: "yes" | "no";
  distributeCost: "yes" | "no";
  notes: string;
  billNo: string;
  billDate: string;
  billAmount: string;
}

const expenseItemSchema = z.object({
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  cityPlace: z.string().min(1, "City/Place is required"),
  expenseTypeId: z.string().min(1, "Expense type is required"),
  class: z.string().min(1, "Class is required"),
  incurredAmount: z.string().min(1, "Amount is required"),
  currency: z.string().default("INR"),
  policy: z.string().default(""),
  supportingDocumentAvailable: z.enum(["yes", "no"]),
  paidBy: z.enum(["self", "company_card"]),
  vendorName: z.string().default(""),
  spentDate: z.string().min(1, "Spent date is required"),
  billableToCustomer: z.enum(["yes", "no"]),
  distributeCost: z.enum(["yes", "no"]),
  notes: z.string().default(""),
  billNo: z.string().default(""),
  billDate: z.string().default(""),
  billAmount: z.string().default(""),
});

const formSchema = z.object({
  claimTitle: z.string().min(1, "Claim title is required"),
  claimDescription: z.string().default(""),
  linkToAdvancePayment: z.string().default("none"),
  expenseItems: z
    .array(expenseItemSchema)
    .min(1, "At least one expense is required"),
});

export default function ExpenseClaimForm({
  expenseHeads,
  onClose,
  "data-testid": testId,
}: ExpenseClaimFormProps) {
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [attachedFiles, setAttachedFiles] = useState<AzureFileUploadType[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      claimTitle: "",
      claimDescription: "",
      linkToAdvancePayment: "none",
      expenseItems: [
        {
          fromDate: "",
          toDate: "",
          cityPlace: "",
          expenseTypeId: "",
          class: "",
          incurredAmount: "",
          currency: "INR",
          policy: "",
          supportingDocumentAvailable: "no",
          paidBy: "self",
          vendorName: "",
          spentDate: "",
          billableToCustomer: "no",
          distributeCost: "no",
          notes: "",
          billNo: "",
          billDate: "",
          billAmount: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "expenseItems",
  });

  // OCR Lookup functionality
  const [foundOcrData, setFoundOcrData] = useState<any>(null);
  const [showOcrSuggestion, setShowOcrSuggestion] = useState(false);
  const currentClaimTitle = form.watch("claimTitle");

  // Query to lookup OCR data by claim title
  const ocrLookupQuery = useQuery({
    queryKey: ["/api/ocr/by-claim-title", currentClaimTitle, Date.now()], // Add timestamp to prevent caching
    queryFn: async () => {
      console.log(
        "🔍 QUERY DEBUG: Starting OCR lookup query for:",
        currentClaimTitle,
      );

      if (!currentClaimTitle?.trim() || currentClaimTitle.length < 3) {
        console.log("🔍 QUERY DEBUG: Title too short, returning null");
        return null;
      }

      try {
        // Add cache-busting timestamp
        const timestamp = Date.now();
        const url = `/api/ocr/by-claim-title/${encodeURIComponent(currentClaimTitle.trim())}?t=${timestamp}`;
        console.log("🔍 QUERY DEBUG: Making API request to:", url);

        const response = await apiRequest(url);
        console.log(
          "🔍 QUERY DEBUG: API response received:",
          JSON.stringify(response, null, 2),
        );

        return response;
      } catch (error: any) {
        console.log("🔍 QUERY DEBUG: API error:", error);
        // If not found, return null (don't show error)
        if (error.status === 404) {
          console.log("🔍 QUERY DEBUG: 404 - returning null");
          return null;
        }
        throw error;
      }
    },
    enabled: !!(currentClaimTitle?.trim() && currentClaimTitle.length >= 3),
    staleTime: 0, // Disable caching completely
    gcTime: 0, // Don't cache results (gcTime in v5, was cacheTime in v4)
  });

  // Handle OCR data found
  useEffect(() => {
    console.log("🔄 OCR LOOKUP EFFECT: useEffect triggered");
    console.log(
      "🔄 OCR LOOKUP EFFECT: ocrLookupQuery.data:",
      JSON.stringify(ocrLookupQuery.data, null, 2),
    );
    console.log(
      "🔄 OCR LOOKUP EFFECT: foundOcrData:",
      JSON.stringify(foundOcrData, null, 2),
    );
    console.log("🔄 OCR LOOKUP EFFECT: currentClaimTitle:", currentClaimTitle);

    if (ocrLookupQuery.data && !foundOcrData) {
      console.log(
        "✅ OCR LOOKUP EFFECT: Setting foundOcrData with query result",
      );
      setFoundOcrData(ocrLookupQuery.data);
      setShowOcrSuggestion(true);
    } else if (!ocrLookupQuery.data) {
      console.log("❌ OCR LOOKUP EFFECT: No query data, clearing foundOcrData");
      setFoundOcrData(null);
      setShowOcrSuggestion(false);
    } else {
      console.log(
        "⏭️ OCR LOOKUP EFFECT: Skipping - already have foundOcrData or no query data",
      );
    }
  }, [ocrLookupQuery.data, foundOcrData]);

  // Function to apply OCR data to form
  const applyOcrDataToForm = () => {
    console.log("🎯 APPLY OCR DATA: Function called");
    console.log(
      "🎯 APPLY OCR DATA: foundOcrData structure:",
      JSON.stringify(foundOcrData, null, 2),
    );

    // Check for mappedData (from lookup API) or extractedData (from direct upload)
    const dataToApply =
      foundOcrData?.mappedData || foundOcrData?.extractedData?.extractedData;

    if (!dataToApply) {
      console.log("❌ APPLY OCR DATA: No data found");
      console.log(
        "❌ APPLY OCR DATA: foundOcrData keys:",
        foundOcrData ? Object.keys(foundOcrData) : "null",
      );
      toast({
        title: "No Data",
        description: "No OCR data available to apply",
        variant: "destructive",
      });
      return;
    }

    console.log(
      "✅ APPLY OCR DATA: Using data:",
      JSON.stringify(dataToApply, null, 2),
    );

    // Use smart mapping to get standardized data
    const mappedData = smartMapOcrData(dataToApply);

    console.log("🔄 Applying OCR data to form:", mappedData);

    // Apply to the first expense item
    if (mappedData.billAmount) {
      form.setValue("expenseItems.0.incurredAmount", mappedData.billAmount);
      form.setValue("expenseItems.0.billAmount", mappedData.billAmount);
    }

    if (mappedData.billDate) {
      form.setValue("expenseItems.0.spentDate", mappedData.billDate);
      form.setValue("expenseItems.0.billDate", mappedData.billDate);
      form.setValue("expenseItems.0.fromDate", mappedData.billDate);
      form.setValue("expenseItems.0.toDate", mappedData.billDate);
    }

    if (mappedData.vendorName) {
      form.setValue("expenseItems.0.vendorName", mappedData.vendorName);
    }

    if (mappedData.billNo) {
      form.setValue("expenseItems.0.billNo", mappedData.billNo);
    }

    if (mappedData.description) {
      form.setValue("expenseItems.0.notes", mappedData.description);
      form.setValue("claimDescription", mappedData.description);
    }

    setShowOcrSuggestion(false);

    toast({
      title: "✅ Data Applied",
      description: "OCR data has been applied to your expense form",
    });
  };

  const addExpenseItem = () => {
    append({
      fromDate: "",
      toDate: "",
      cityPlace: "",
      expenseTypeId: "",
      class: "",
      incurredAmount: "",
      currency: "INR",
      policy: "",
      supportingDocumentAvailable: "no",
      paidBy: "self",
      vendorName: "",
      spentDate: "",
      billableToCustomer: "no",
      distributeCost: "no",
      notes: "",
      billNo: "",
      billDate: "",
      billAmount: "",
    });
  };

  const removeExpenseItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const toggleItemCollapse = (id: string) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Validation function for amount comparison
  const validateAmountMatch = (index: number) => {
    const billAmount = form.watch(`expenseItems.${index}.billAmount`);
    const incurredAmount = form.watch(`expenseItems.${index}.incurredAmount`);

    if (billAmount && incurredAmount && billAmount !== incurredAmount) {
      const billAmountFloat = parseFloat(billAmount);
      const incurredAmountFloat = parseFloat(incurredAmount);

      if (!isNaN(billAmountFloat) && !isNaN(incurredAmountFloat)) {
        if (Math.abs(billAmountFloat - incurredAmountFloat) > 0.01) {
          toast({
            title: "⚠️ Amount Mismatch Alert",
            description: `Bill Amount (₹${billAmountFloat.toLocaleString("en-IN")}) doesn't match Incurred Amount (₹${incurredAmountFloat.toLocaleString("en-IN")}). Please verify the amounts.`,
            variant: "destructive",
          });
        }
      }
    }
  };

  const createClaimMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const totalAmount = data.expenseItems.reduce(
        (sum, item) => sum + parseFloat(item.incurredAmount || "0"),
        0,
      );

      const payload = {
        title: data.claimTitle,
        description: data.claimDescription,
        totalAmount: totalAmount.toString(),
        advanceAmount: data.linkToAdvancePayment !== "none" ? "0" : "0", // TODO: Link to actual advance
        originalRequestAmount: "0",
        extraAmount: "0",
        vendorInvoiceNumber: "", // Can be added later if needed
        submittedDate: new Date().toISOString(),
        // Collect supporting document info from validated form data
        supportingDocumentAvailable: data.expenseItems.some(
          (item) => item.supportingDocumentAvailable === "yes",
        ),
        billableToCustomer: data.expenseItems.some(
          (item) => item.billableToCustomer === "yes",
        ),
        distributeCost: data.expenseItems.some(
          (item) => item.distributeCost === "yes",
        ),
        // Azure Blob file attachments
        attachmentUrls: attachedFiles.map(file => file.fileUrl),
        attachmentCount: attachedFiles.length,
        items: data.expenseItems.map((item) => ({
          fromDate: item.fromDate,
          toDate: item.toDate,
          expenseTypeId: item.expenseTypeId,
          description: `${item.cityPlace}${item.class ? ` - ${item.class}` : ""}`,
          amount: parseFloat(item.incurredAmount || "0"),
          currency: item.currency,
          vendorName: item.vendorName || "",
          notes: item.notes || "",
          // Include additional bill details
          spentDate: item.spentDate,
          paidBy: item.paidBy,
          supportingDocumentAvailable: item.supportingDocumentAvailable,
          billableToCustomer: item.billableToCustomer,
          distributeCost: item.distributeCost,
          cityPlace: item.cityPlace,
          class: item.class,
          // Also include for backward compatibility
          date: item.fromDate,
          categoryId: item.expenseTypeId,
        })),
      };

      console.log("Expense claim payload:", payload);

      return apiRequest("/api/expense-claims", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims"] });
      toast({
        title: "Success",
        description: "Expense claim submitted successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit expense claim",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createClaimMutation.mutate(data);
  };

  const watchedExpenseItems = form.watch("expenseItems");
  const totalAmount = watchedExpenseItems.reduce(
    (sum, item) => sum + parseFloat(item.incurredAmount || "0"),
    0,
  );

  return (
    <div className="space-y-6" data-testid={testId}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Expense Claim Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="claimTitle">Claim Title *</Label>
              <Input
                id="claimTitle"
                {...form.register("claimTitle")}
                placeholder="Enter claim title"
                data-testid="input-claim-title"
              />
              {form.formState.errors.claimTitle && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.claimTitle.message}
                </p>
              )}

              {/* OCR Data Suggestion */}
              {showOcrSuggestion && foundOcrData && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          💰 Found Saved Receipt Data
                        </span>
                      </div>

                      <div className="text-xs text-blue-600 space-y-1">
                        {foundOcrData.extractedData?.extractedData?.amount && (
                          <div>
                            <span className="font-medium">Amount:</span> ₹
                            {foundOcrData.extractedData.extractedData.amount.toLocaleString(
                              "en-IN",
                            )}
                          </div>
                        )}
                        {foundOcrData.extractedData?.extractedData
                          ?.vendorName && (
                          <div>
                            <span className="font-medium">Vendor:</span>{" "}
                            {
                              foundOcrData.extractedData.extractedData
                                .vendorName
                            }
                          </div>
                        )}
                        {foundOcrData.extractedData?.extractedData?.date && (
                          <div>
                            <span className="font-medium">Date:</span>{" "}
                            {new Date(
                              foundOcrData.extractedData.extractedData.date,
                            ).toLocaleDateString("en-GB")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-3">
                      <Button
                        type="button"
                        size="sm"
                        onClick={applyOcrDataToForm}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid="button-apply-ocr-data"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Apply Data
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOcrSuggestion(false)}
                        data-testid="button-dismiss-ocr-suggestion"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* OCR Lookup Loading State */}
              {ocrLookupQuery.isLoading &&
                currentClaimTitle &&
                currentClaimTitle.length >= 3 && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 flex items-center gap-2">
                    <Search className="h-3 w-3 animate-pulse" />
                    Looking for saved receipt data for "{currentClaimTitle}"...
                  </div>
                )}
            </div>

            <div>
              <Label htmlFor="claimDescription">Description</Label>
              <Textarea
                id="claimDescription"
                {...form.register("claimDescription")}
                placeholder="Enter claim description"
                rows={3}
                data-testid="input-claim-description"
              />
            </div>

            <div>
              <Label htmlFor="linkToAdvancePayment">
                Link to Advance Payment (Optional)
              </Label>
              <Select
                value={form.watch("linkToAdvancePayment")}
                onValueChange={(value) =>
                  form.setValue("linkToAdvancePayment", value)
                }
              >
                <SelectTrigger data-testid="select-advance-payment">
                  <SelectValue placeholder="None - New expense claim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None - New expense claim</SelectItem>
                  <SelectItem value="advance1">Advance Payment #1</SelectItem>
                  <SelectItem value="advance2">Advance Payment #2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expense Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expense Items</CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-600">
                  Total: ₹
                  {totalAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={addExpenseItem}
                  data-testid="button-add-expense"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Expense
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Collapsible
                key={field.id}
                open={!collapsedItems[field.id]}
                onOpenChange={() => toggleItemCollapse(field.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Expense {index + 1}
                      </div>
                      {watchedExpenseItems[index]?.cityPlace && (
                        <span className="text-sm text-gray-600">
                          {watchedExpenseItems[index].cityPlace} - ₹
                          {parseFloat(
                            watchedExpenseItems[index].incurredAmount || "0",
                          ).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeExpenseItem(index);
                          }}
                          data-testid={`button-remove-expense-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                      {collapsedItems[field.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4 p-4 border rounded-lg space-y-4">
                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>From Date *</Label>
                      <Input
                        type="date"
                        {...form.register(`expenseItems.${index}.fromDate`)}
                        data-testid={`input-from-date-${index}`}
                      />
                      {form.formState.errors.expenseItems?.[index]
                        ?.fromDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {
                            form.formState.errors.expenseItems[index]?.fromDate
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>To Date *</Label>
                      <Input
                        type="date"
                        {...form.register(`expenseItems.${index}.toDate`)}
                        data-testid={`input-to-date-${index}`}
                      />
                      {form.formState.errors.expenseItems?.[index]?.toDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {
                            form.formState.errors.expenseItems[index]?.toDate
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location and Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>City / Place *</Label>
                      <Input
                        {...form.register(`expenseItems.${index}.cityPlace`)}
                        placeholder="City / Place"
                        data-testid={`input-city-place-${index}`}
                      />
                      {form.formState.errors.expenseItems?.[index]
                        ?.cityPlace && (
                        <p className="text-sm text-red-600 mt-1">
                          {
                            form.formState.errors.expenseItems[index]?.cityPlace
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Expense Type *</Label>
                      <Select
                        value={form.watch(
                          `expenseItems.${index}.expenseTypeId`,
                        )}
                        onValueChange={(value) =>
                          form.setValue(
                            `expenseItems.${index}.expenseTypeId`,
                            value,
                          )
                        }
                      >
                        <SelectTrigger
                          data-testid={`select-expense-type-${index}`}
                        >
                          <SelectValue placeholder="-- Expense Heads --" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseHeads.map((head) => (
                            <SelectItem key={head.id} value={head.id}>
                              {head.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Class and Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Class *</Label>
                      <Select
                        value={form.watch(`expenseItems.${index}.class`)}
                        onValueChange={(value) =>
                          form.setValue(`expenseItems.${index}.class`, value)
                        }
                      >
                        <SelectTrigger data-testid={`select-class-${index}`}>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="economy">Economy</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="first">First Class</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Incurred Amount *</Label>
                      <div className="flex">
                        <Select
                          value={form.watch(`expenseItems.${index}.currency`)}
                          onValueChange={(value) =>
                            form.setValue(
                              `expenseItems.${index}.currency`,
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">₹</SelectItem>
                            <SelectItem value="USD">$</SelectItem>
                            <SelectItem value="EUR">€</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(
                            `expenseItems.${index}.incurredAmount`,
                          )}
                          placeholder="Amount"
                          className="flex-1 ml-2"
                          data-testid={`input-amount-${index}`}
                          onBlur={() => validateAmountMatch(index)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Policy */}
                  <div>
                    <Label>Policy</Label>
                    <div className="h-8 border-b-2 border-blue-500 bg-gray-50 rounded px-3 py-1 text-sm text-gray-600">
                      Policy information will be displayed here
                    </div>
                  </div>

                  {/* Bill Details */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Bill Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                      {/* Paid by */}
                      <div>
                        <Label>Paid by</Label>
                        <RadioGroup
                          value={form.watch(`expenseItems.${index}.paidBy`)}
                          onValueChange={(value) =>
                            form.setValue(
                              `expenseItems.${index}.paidBy`,
                              value as "self" | "company_card",
                            )
                          }
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="self"
                              id={`paid-self-${index}`}
                            />
                            <Label htmlFor={`paid-self-${index}`}>Self</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="company_card"
                              id={`paid-company-${index}`}
                            />
                            <Label htmlFor={`paid-company-${index}`}>
                              Company Card
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Note: Vendor Name and Spent Date moved to Bill Details section below */}

                      {/* Bill Details: Always visible for manual entry and OCR auto-fill */}
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3">Bill Details</h4>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label>Bill No</Label>
                            <Input
                              {...form.register(`expenseItems.${index}.billNo`)}
                              placeholder="Bill No"
                              data-testid={`input-bill-no-${index}`}
                            />
                          </div>
                          <div>
                            <Label>Bill Date</Label>
                            <Input
                              type="date"
                              {...form.register(
                                `expenseItems.${index}.billDate`,
                              )}
                              data-testid={`input-bill-date-${index}`}
                            />
                          </div>
                          <div>
                            <Label>Bill Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              {...form.register(
                                `expenseItems.${index}.billAmount`,
                              )}
                              placeholder="Bill Amount"
                              data-testid={`input-bill-amount-${index}`}
                              onBlur={() => validateAmountMatch(index)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Vendor Name</Label>
                            <Input
                              {...form.register(`expenseItems.${index}.vendorName`)}
                              placeholder="Vendor Name"
                              data-testid={`input-vendor-name-${index}`}
                            />
                          </div>
                          <div>
                            <Label>Spent Date</Label>
                            <Input
                              type="date"
                              {...form.register(
                                `expenseItems.${index}.spentDate`,
                              )}
                              data-testid={`input-spent-date-${index}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Billable to Customer */}
                      <div>
                        <Label>Billable to Customer?</Label>
                        <RadioGroup
                          value={form.watch(
                            `expenseItems.${index}.billableToCustomer`,
                          )}
                          onValueChange={(value) =>
                            form.setValue(
                              `expenseItems.${index}.billableToCustomer`,
                              value as "yes" | "no",
                            )
                          }
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="yes"
                              id={`billable-yes-${index}`}
                            />
                            <Label htmlFor={`billable-yes-${index}`}>Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="no"
                              id={`billable-no-${index}`}
                            />
                            <Label htmlFor={`billable-no-${index}`}>No</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Distribute Cost */}
                      <div>
                        <Label>Distribute Cost?</Label>
                        <RadioGroup
                          value={form.watch(
                            `expenseItems.${index}.distributeCost`,
                          )}
                          onValueChange={(value) =>
                            form.setValue(
                              `expenseItems.${index}.distributeCost`,
                              value as "yes" | "no",
                            )
                          }
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="yes"
                              id={`distribute-yes-${index}`}
                            />
                            <Label htmlFor={`distribute-yes-${index}`}>
                              Yes
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="no"
                              id={`distribute-no-${index}`}
                            />
                            <Label htmlFor={`distribute-no-${index}`}>No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Supporting Document Details - OCR Upload */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-green-500" />
                      Supporting Document Details
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                        NEW!
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      📋 Upload your receipt and watch the magic happen - we'll automatically
                      fill in all the details for you!
                    </p>
                    <OcrUpload
                      module="employee_claims"
                      claimTitle={() => form.getValues("claimTitle") || ""}
                      onDataExtracted={(extractedData) => {
                        // Auto-fill form fields from OCR data
                        console.log(
                          "🎯 EXPENSE CLAIM FORM: onDataExtracted callback triggered!",
                        );
                        console.log(
                          "🎯 FORM RECEIVED onDataExtracted callback with data:",
                          JSON.stringify(extractedData, null, 2),
                        );
                        console.log(
                          "🔧 Form setValue function available:",
                          typeof form.setValue,
                        );
                        console.log(
                          "🔧 Current expense item index:",
                          index,
                        );
                        console.log(
                          "🔧 Current form values before auto-fill:",
                          {
                            billNo: form.watch(
                              `expenseItems.${index}.billNo`,
                            ),
                            billAmount: form.watch(
                              `expenseItems.${index}.billAmount`,
                            ),
                            vendorName: form.watch(
                              `expenseItems.${index}.vendorName`,
                            ),
                          },
                        );

                        if (extractedData) {
                          console.log(
                            "✅ Form processing OCR data:",
                            extractedData,
                          );

                          // Handle both direct OCR data and mapped data structures

                          // Map Invoice/Bill Number - check both structures
                          const billNo =
                            extractedData.billNo ||
                            extractedData.invoiceNumber ||
                            extractedData.billNumber;
                          if (billNo) {
                            form.setValue(
                              `expenseItems.${index}.billNo`,
                              String(billNo),
                            );
                            console.log("📝 Set Bill No:", billNo);
                          }

                          // Map Bill Amount - check both structures
                          const billAmount =
                            extractedData.billAmount ||
                            extractedData.amount ||
                            extractedData.total;
                          if (billAmount) {
                            const cleanAmount = String(billAmount).replace(
                              /[^\d.]/g,
                              "",
                            );
                            form.setValue(
                              `expenseItems.${index}.billAmount`,
                              cleanAmount,
                            );
                            form.setValue(
                              `expenseItems.${index}.incurredAmount`,
                              cleanAmount,
                            );
                            console.log("💰 Set Bill Amount:", cleanAmount);
                          }

                          // Map Bill Date and Spent Date - check both structures
                          const date =
                            extractedData.billDate ||
                            extractedData.date ||
                            extractedData.spentDate;
                          if (date) {
                            try {
                              const dateObj = new Date(date);
                              if (!isNaN(dateObj.getTime())) {
                                const formattedDate = dateObj
                                  .toISOString()
                                  .split("T")[0];
                                form.setValue(
                                  `expenseItems.${index}.billDate`,
                                  formattedDate,
                                );
                                form.setValue(
                                  `expenseItems.${index}.spentDate`,
                                  formattedDate,
                                );
                                form.setValue(
                                  `expenseItems.${index}.fromDate`,
                                  formattedDate,
                                );
                                form.setValue(
                                  `expenseItems.${index}.toDate`,
                                  formattedDate,
                                );
                                console.log(
                                  "📅 Set Bill Date:",
                                  formattedDate,
                                );
                              }
                            } catch (e) {
                              console.log("Date parsing error:", e);
                            }
                          }

                          // Map Vendor Name - check both structures
                          const vendor =
                            extractedData.vendorName ||
                            extractedData.vendor ||
                            extractedData.merchant;
                          if (vendor) {
                            form.setValue(
                              `expenseItems.${index}.vendorName`,
                              String(vendor),
                            );
                            console.log("🏪 Set Vendor:", vendor);
                          }

                          // Map Description/Notes - check both structures
                          const notes =
                            extractedData.description ||
                            extractedData.notes;
                          if (notes) {
                            form.setValue(
                              `expenseItems.${index}.notes`,
                              String(notes),
                            );
                            console.log(
                              "📝 Set Notes:",
                              notes.substring(0, 50) + "...",
                            );
                          }

                          if (
                            extractedData.location ||
                            extractedData.place ||
                            extractedData.city
                          ) {
                            const location =
                              extractedData.location ||
                              extractedData.place ||
                              extractedData.city;
                            form.setValue(
                              `expenseItems.${index}.cityPlace`,
                              String(location),
                            );
                          }

                          // Set supporting document as available
                          form.setValue(
                            `expenseItems.${index}.supportingDocumentAvailable`,
                            "yes",
                          );

                          // Validate Bill Amount vs Incurred Amount after a short delay
                          setTimeout(() => {
                            const billAmount = form.watch(
                              `expenseItems.${index}.billAmount`,
                            );
                            const incurredAmount = form.watch(
                              `expenseItems.${index}.incurredAmount`,
                            );

                            if (
                              billAmount &&
                              incurredAmount &&
                              billAmount !== incurredAmount
                            ) {
                              const billAmountFloat =
                                parseFloat(billAmount);
                              const incurredAmountFloat =
                                parseFloat(incurredAmount);

                              if (
                                Math.abs(
                                  billAmountFloat - incurredAmountFloat,
                                ) > 0.01
                              ) {
                                toast({
                                  title: "⚠️ Amount Mismatch Alert",
                                  description: `Bill Amount (₹${billAmountFloat.toLocaleString("en-IN")}) doesn't match Incurred Amount (₹${incurredAmountFloat.toLocaleString("en-IN")}). Please verify the amounts.`,
                                  variant: "destructive",
                                });
                              }
                            }
                          }, 500);

                          // Show success notification
                          toast({
                            title: "🎉 Data Applied!",
                            description:
                              "OCR data has been applied to the form. Please review and adjust as needed.",
                          });
                        }
                      }}
                      data-testid={`ocr-upload-${index}`}
                    />
                  </div>

                  {/* Supporting Document Available */}
                  <div>
                    <Label>Supporting Document Available</Label>
                    <RadioGroup
                      value={form.watch(
                        `expenseItems.${index}.supportingDocumentAvailable`,
                      )}
                      onValueChange={(value) =>
                        form.setValue(
                          `expenseItems.${index}.supportingDocumentAvailable`,
                          value as "yes" | "no",
                        )
                      }
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="yes"
                          id={`doc-yes-${index}`}
                        />
                        <Label htmlFor={`doc-yes-${index}`}>Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`doc-no-${index}`} />
                        <Label htmlFor={`doc-no-${index}`}>No</Label>
                      </div>
                    </RadioGroup>
                    {form.watch(
                      `expenseItems.${index}.supportingDocumentAvailable`,
                    ) === "no" && (
                      <p className="text-sm text-gray-600 mt-1">
                        (If Self Attested, select 'No')
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      {...form.register(`expenseItems.${index}.notes`)}
                      placeholder="Notes"
                      rows={3}
                      data-testid={`input-notes-${index}`}
                    />
                  </div>

                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {/* Azure Blob File Attachments */}
        <AzureFileUpload
          module="expense_claims"
          multiple={true}
          maxFiles={10}
          existingFiles={attachedFiles}
          onFilesChange={setAttachedFiles}
          onUploadComplete={(uploadedFiles) => {
            toast({
              title: "Files uploaded successfully",
              description: `${uploadedFiles.length} file(s) uploaded to Azure Blob Storage.`,
            });
          }}
          onUploadError={(error) => {
            toast({
              title: "Upload failed",
              description: error,
              variant: "destructive",
            });
          }}
          disabled={createClaimMutation.isPending}
          data-testid="azure-file-upload-expense-claims"
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createClaimMutation.isPending}
            data-testid="button-submit"
          >
            {createClaimMutation.isPending
              ? "Submitting..."
              : "Submit Expense Claim"}
          </Button>
        </div>
      </form>
    </div>
  );
}
