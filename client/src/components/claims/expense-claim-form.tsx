import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Plus, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

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
});

const formSchema = z.object({
  claimTitle: z.string().min(1, "Claim title is required"),
  claimDescription: z.string().default(""),
  linkToAdvancePayment: z.string().default("none"),
  expenseItems: z.array(expenseItemSchema).min(1, "At least one expense is required"),
});

export default function ExpenseClaimForm({ 
  expenseHeads, 
  onClose, 
  "data-testid": testId 
}: ExpenseClaimFormProps) {
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});
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
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "expenseItems",
  });

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
    });
  };

  const removeExpenseItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const toggleItemCollapse = (id: string) => {
    setCollapsedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const createClaimMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const totalAmount = data.expenseItems.reduce((sum, item) => sum + parseFloat(item.incurredAmount || "0"), 0);
      
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
        supportingDocumentAvailable: data.expenseItems.some(item => item.supportingDocumentAvailable === "yes"),
        billableToCustomer: data.expenseItems.some(item => item.billableToCustomer === "yes"),
        distributeCost: data.expenseItems.some(item => item.distributeCost === "yes"),
        items: data.expenseItems.map(item => ({
          fromDate: item.fromDate,
          toDate: item.toDate,
          expenseTypeId: item.expenseTypeId,
          description: `${item.cityPlace}${item.class ? ` - ${item.class}` : ''}`,
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
  const totalAmount = watchedExpenseItems.reduce((sum, item) => sum + parseFloat(item.incurredAmount || "0"), 0);

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
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.claimTitle.message}</p>
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
              <Label htmlFor="linkToAdvancePayment">Link to Advance Payment (Optional)</Label>
              <Select
                value={form.watch("linkToAdvancePayment")}
                onValueChange={(value) => form.setValue("linkToAdvancePayment", value)}
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
                  Total: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                          {watchedExpenseItems[index].cityPlace} - ₹{parseFloat(watchedExpenseItems[index].incurredAmount || "0").toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                      {form.formState.errors.expenseItems?.[index]?.fromDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.expenseItems[index]?.fromDate?.message}
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
                          {form.formState.errors.expenseItems[index]?.toDate?.message}
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
                      {form.formState.errors.expenseItems?.[index]?.cityPlace && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.expenseItems[index]?.cityPlace?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Expense Type *</Label>
                      <Select
                        value={form.watch(`expenseItems.${index}.expenseTypeId`)}
                        onValueChange={(value) => form.setValue(`expenseItems.${index}.expenseTypeId`, value)}
                      >
                        <SelectTrigger data-testid={`select-expense-type-${index}`}>
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
                        onValueChange={(value) => form.setValue(`expenseItems.${index}.class`, value)}
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
                          onValueChange={(value) => form.setValue(`expenseItems.${index}.currency`, value)}
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
                          {...form.register(`expenseItems.${index}.incurredAmount`)}
                          placeholder="Amount"
                          className="flex-1 ml-2"
                          data-testid={`input-amount-${index}`}
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
                      {/* Supporting Document Available */}
                      <div>
                        <Label>Supporting Document Available</Label>
                        <RadioGroup
                          value={form.watch(`expenseItems.${index}.supportingDocumentAvailable`)}
                          onValueChange={(value) => form.setValue(`expenseItems.${index}.supportingDocumentAvailable`, value as "yes" | "no")}
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`doc-yes-${index}`} />
                            <Label htmlFor={`doc-yes-${index}`}>Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`doc-no-${index}`} />
                            <Label htmlFor={`doc-no-${index}`}>No</Label>
                          </div>
                        </RadioGroup>
                        {form.watch(`expenseItems.${index}.supportingDocumentAvailable`) === "no" && (
                          <p className="text-sm text-gray-600 mt-1">(If Self Attested, select 'No')</p>
                        )}
                      </div>

                      {/* Paid by */}
                      <div>
                        <Label>Paid by</Label>
                        <RadioGroup
                          value={form.watch(`expenseItems.${index}.paidBy`)}
                          onValueChange={(value) => form.setValue(`expenseItems.${index}.paidBy`, value as "self" | "company_card")}
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="self" id={`paid-self-${index}`} />
                            <Label htmlFor={`paid-self-${index}`}>Self</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="company_card" id={`paid-company-${index}`} />
                            <Label htmlFor={`paid-company-${index}`}>Company Card</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Vendor Name and Spent Date */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {...form.register(`expenseItems.${index}.spentDate`)}
                            data-testid={`input-spent-date-${index}`}
                          />
                        </div>
                      </div>

                      {/* Billable to Customer */}
                      <div>
                        <Label>Billable to Customer?</Label>
                        <RadioGroup
                          value={form.watch(`expenseItems.${index}.billableToCustomer`)}
                          onValueChange={(value) => form.setValue(`expenseItems.${index}.billableToCustomer`, value as "yes" | "no")}
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`billable-yes-${index}`} />
                            <Label htmlFor={`billable-yes-${index}`}>Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`billable-no-${index}`} />
                            <Label htmlFor={`billable-no-${index}`}>No</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Distribute Cost */}
                      <div>
                        <Label>Distribute Cost?</Label>
                        <RadioGroup
                          value={form.watch(`expenseItems.${index}.distributeCost`)}
                          onValueChange={(value) => form.setValue(`expenseItems.${index}.distributeCost`, value as "yes" | "no")}
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`distribute-yes-${index}`} />
                            <Label htmlFor={`distribute-yes-${index}`}>Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`distribute-no-${index}`} />
                            <Label htmlFor={`distribute-no-${index}`}>No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>

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
            {createClaimMutation.isPending ? "Submitting..." : "Submit Expense Claim"}
          </Button>
        </div>
      </form>
    </div>
  );
}