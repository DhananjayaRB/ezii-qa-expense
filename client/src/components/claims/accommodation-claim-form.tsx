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
import { ChevronDown, ChevronUp, Plus, Trash2, Hotel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ExpenseCategory {
  id: string;
  name: string;
}

interface AccommodationClaimFormProps {
  expenseHeads: ExpenseCategory[];
  onClose: () => void;
  "data-testid"?: string;
}

// Accommodation-specific schema with relevant fields
const accommodationItemSchema = z.object({
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  cityPlace: z.string().min(1, "City/Place is required"),
  expenseTypeId: z.string().min(1, "Expense type is required"),
  hotelName: z.string().min(1, "Hotel/Property name is required"),
  roomType: z.string().min(1, "Room type is required"),
  numberOfNights: z.string().min(1, "Number of nights is required"),
  numberOfRooms: z.string().min(1, "Number of rooms is required"),
  incurredAmount: z.string().min(1, "Amount is required"),
  currency: z.string().default("INR"),
  policy: z.string().optional(),
  supportingDocumentAvailable: z.enum(["yes", "no"]).default("no"),
  paidBy: z.enum(["self", "company"]).default("self"),
  bookingReference: z.string().optional(),
  guestName: z.string().optional(),
  spentDate: z.string().min(1, "Spent date is required"),
  billableToCustomer: z.enum(["yes", "no"]).default("no"),
  distributeCost: z.enum(["yes", "no"]).default("no"),
  notes: z.string().optional(),
});

const formSchema = z.object({
  claimTitle: z.string().min(1, "Claim title is required"),
  claimDescription: z.string().min(1, "Claim description is required"),
  linkToAdvancePayment: z.string().default("none"),
  accommodationItems: z.array(accommodationItemSchema).min(1, "At least one accommodation is required"),
});

type AccommodationItem = z.infer<typeof accommodationItemSchema>;

export default function AccommodationClaimForm({ 
  expenseHeads, 
  onClose, 
  "data-testid": testId 
}: AccommodationClaimFormProps) {
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      claimTitle: "",
      claimDescription: "",
      linkToAdvancePayment: "none",
      accommodationItems: [
        {
          checkInDate: "",
          checkOutDate: "",
          cityPlace: "",
          expenseTypeId: "",
          hotelName: "",
          roomType: "",
          numberOfNights: "",
          numberOfRooms: "1",
          incurredAmount: "",
          currency: "INR",
          policy: "",
          supportingDocumentAvailable: "no",
          paidBy: "self",
          bookingReference: "",
          guestName: "",
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
    name: "accommodationItems",
  });

  const addAccommodationItem = () => {
    append({
      checkInDate: "",
      checkOutDate: "",
      cityPlace: "",
      expenseTypeId: "",
      hotelName: "",
      roomType: "",
      numberOfNights: "",
      numberOfRooms: "1",
      incurredAmount: "",
      currency: "INR",
      policy: "",
      supportingDocumentAvailable: "no",
      paidBy: "self",
      bookingReference: "",
      guestName: "",
      spentDate: "",
      billableToCustomer: "no",
      distributeCost: "no",
      notes: "",
    });
  };

  const removeAccommodationItem = (index: number) => {
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
      const totalAmount = data.accommodationItems.reduce((sum, item) => sum + parseFloat(item.incurredAmount || "0"), 0);
      
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
        supportingDocumentAvailable: data.accommodationItems.some(item => item.supportingDocumentAvailable === "yes"),
        billableToCustomer: data.accommodationItems.some(item => item.billableToCustomer === "yes"),
        distributeCost: data.accommodationItems.some(item => item.distributeCost === "yes"),
        items: data.accommodationItems.map(item => ({
          date: item.checkInDate, // Use check-in date as the main date
          categoryId: item.expenseTypeId,
          description: `${item.hotelName}, ${item.cityPlace} (${item.numberOfNights} nights, ${item.numberOfRooms} rooms)`,
          amount: parseFloat(item.incurredAmount || "0"),
          currency: item.currency,
          vendorName: item.hotelName || "",
          notes: item.notes || "",
          // Include additional accommodation details
          checkInDate: item.checkInDate,
          checkOutDate: item.checkOutDate,
          hotelName: item.hotelName,
          roomType: item.roomType,
          numberOfNights: item.numberOfNights,
          numberOfRooms: item.numberOfRooms,
          bookingReference: item.bookingReference,
          guestName: item.guestName,
          spentDate: item.spentDate,
          paidBy: item.paidBy,
          supportingDocumentAvailable: item.supportingDocumentAvailable === "yes",
          billableToCustomer: item.billableToCustomer === "yes",
          distributeCost: item.distributeCost === "yes",
          cityPlace: item.cityPlace,
        })),
      };
      
      console.log("Accommodation claim payload:", payload);
      
      return apiRequest("/api/expense-claims", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims"] });
      toast({
        title: "Success",
        description: "Accommodation claim created successfully!",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error creating accommodation claim:", error);
      toast({
        title: "Error",
        description: "Failed to create accommodation claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createClaimMutation.mutate(data);
  };

  const watchedAccommodationItems = form.watch("accommodationItems");
  const totalAmount = watchedAccommodationItems.reduce((sum, item) => sum + parseFloat(item.incurredAmount || "0"), 0);

  return (
    <div className="space-y-6" data-testid={testId}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Hotel className="h-5 w-5 text-blue-600" />
              <span>New Accommodation Claim</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="claimTitle">Claim Title *</Label>
                <Input
                  id="claimTitle"
                  {...form.register("claimTitle")}
                  placeholder="e.g., Business Trip Hotel Expenses"
                  data-testid="input-claim-title"
                />
                {form.formState.errors.claimTitle && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.claimTitle.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="linkToAdvancePayment">Link to Advance Payment</Label>
                <Select
                  value={form.watch("linkToAdvancePayment")}
                  onValueChange={(value) => form.setValue("linkToAdvancePayment", value)}
                >
                  <SelectTrigger data-testid="select-advance-payment">
                    <SelectValue placeholder="Select advance payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="claimDescription">Claim Description *</Label>
              <Textarea
                id="claimDescription"
                {...form.register("claimDescription")}
                placeholder="Brief description of accommodation expenses"
                rows={3}
                data-testid="textarea-claim-description"
              />
              {form.formState.errors.claimDescription && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.claimDescription.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accommodation Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Accommodation Details</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Add hotel, guest house, or lodging expenses
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                </div>
                <Button
                  type="button"
                  onClick={addAccommodationItem}
                  className="flex items-center space-x-2"
                  data-testid="button-add-accommodation"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Accommodation</span>
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
                        Accommodation {index + 1}
                      </div>
                      {watchedAccommodationItems[index]?.hotelName && (
                        <span className="text-sm text-gray-600">
                          {watchedAccommodationItems[index].hotelName} - ₹{parseFloat(watchedAccommodationItems[index].incurredAmount || "0").toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                            removeAccommodationItem(index);
                          }}
                          data-testid={`button-remove-accommodation-${index}`}
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
                      <Label>Check-in Date *</Label>
                      <Input
                        type="date"
                        {...form.register(`accommodationItems.${index}.checkInDate`)}
                        data-testid={`input-checkin-date-${index}`}
                      />
                      {form.formState.errors.accommodationItems?.[index]?.checkInDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.accommodationItems[index]?.checkInDate?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Check-out Date *</Label>
                      <Input
                        type="date"
                        {...form.register(`accommodationItems.${index}.checkOutDate`)}
                        data-testid={`input-checkout-date-${index}`}
                      />
                      {form.formState.errors.accommodationItems?.[index]?.checkOutDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.accommodationItems[index]?.checkOutDate?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location and Hotel Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>City / Place *</Label>
                      <Input
                        {...form.register(`accommodationItems.${index}.cityPlace`)}
                        placeholder="City / Place"
                        data-testid={`input-city-place-${index}`}
                      />
                      {form.formState.errors.accommodationItems?.[index]?.cityPlace && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.accommodationItems[index]?.cityPlace?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Expense Type *</Label>
                      <Select
                        value={form.watch(`accommodationItems.${index}.expenseTypeId`)}
                        onValueChange={(value) => form.setValue(`accommodationItems.${index}.expenseTypeId`, value)}
                      >
                        <SelectTrigger data-testid={`select-expense-type-${index}`}>
                          <SelectValue placeholder="Select expense type" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseHeads.map((head) => (
                            <SelectItem key={head.id} value={head.id}>
                              {head.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.accommodationItems?.[index]?.expenseTypeId && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.accommodationItems[index]?.expenseTypeId?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hotel Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Hotel/Property Name *</Label>
                      <Input
                        {...form.register(`accommodationItems.${index}.hotelName`)}
                        placeholder="Hotel or property name"
                        data-testid={`input-hotel-name-${index}`}
                      />
                      {form.formState.errors.accommodationItems?.[index]?.hotelName && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.accommodationItems[index]?.hotelName?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Room Type *</Label>
                      <Select
                        value={form.watch(`accommodationItems.${index}.roomType`)}
                        onValueChange={(value) => form.setValue(`accommodationItems.${index}.roomType`, value)}
                      >
                        <SelectTrigger data-testid={`select-room-type-${index}`}>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single Room</SelectItem>
                          <SelectItem value="double">Double Room</SelectItem>
                          <SelectItem value="deluxe">Deluxe Room</SelectItem>
                          <SelectItem value="suite">Suite</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.accommodationItems?.[index]?.roomType && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.accommodationItems[index]?.roomType?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Number of Nights *</Label>
                      <Input
                        type="number"
                        min="1"
                        {...form.register(`accommodationItems.${index}.numberOfNights`)}
                        placeholder="1"
                        data-testid={`input-number-nights-${index}`}
                      />
                      {form.formState.errors.accommodationItems?.[index]?.numberOfNights && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.accommodationItems[index]?.numberOfNights?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Number of Rooms *</Label>
                      <Input
                        type="number"
                        min="1"
                        {...form.register(`accommodationItems.${index}.numberOfRooms`)}
                        placeholder="1"
                        data-testid={`input-number-rooms-${index}`}
                      />
                      {form.formState.errors.accommodationItems?.[index]?.numberOfRooms && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.accommodationItems[index]?.numberOfRooms?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount and Currency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Incurred Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register(`accommodationItems.${index}.incurredAmount`)}
                        placeholder="0.00"
                        data-testid={`input-amount-${index}`}
                      />
                      {form.formState.errors.accommodationItems?.[index]?.incurredAmount && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.accommodationItems[index]?.incurredAmount?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select
                        value={form.watch(`accommodationItems.${index}.currency`)}
                        onValueChange={(value) => form.setValue(`accommodationItems.${index}.currency`, value)}
                      >
                        <SelectTrigger data-testid={`select-currency-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Booking Reference</Label>
                      <Input
                        {...form.register(`accommodationItems.${index}.bookingReference`)}
                        placeholder="Booking confirmation number"
                        data-testid={`input-booking-reference-${index}`}
                      />
                    </div>
                    <div>
                      <Label>Guest Name</Label>
                      <Input
                        {...form.register(`accommodationItems.${index}.guestName`)}
                        placeholder="Primary guest name"
                        data-testid={`input-guest-name-${index}`}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Spent Date *</Label>
                    <Input
                      type="date"
                      {...form.register(`accommodationItems.${index}.spentDate`)}
                      data-testid={`input-spent-date-${index}`}
                    />
                    {form.formState.errors.accommodationItems?.[index]?.spentDate && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.accommodationItems[index]?.spentDate?.message}
                      </p>
                    )}
                  </div>

                  {/* Bill Details */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm">Bill Details</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Paid By</Label>
                        <RadioGroup
                          value={form.watch(`accommodationItems.${index}.paidBy`)}
                          onValueChange={(value) => form.setValue(`accommodationItems.${index}.paidBy`, value as "self" | "company")}
                          className="flex space-x-6 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="self" id={`paid-self-${index}`} />
                            <Label htmlFor={`paid-self-${index}`} className="text-sm">Self</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="company" id={`paid-company-${index}`} />
                            <Label htmlFor={`paid-company-${index}`} className="text-sm">Company</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Billable to Customer?</Label>
                        <RadioGroup
                          value={form.watch(`accommodationItems.${index}.billableToCustomer`)}
                          onValueChange={(value) => form.setValue(`accommodationItems.${index}.billableToCustomer`, value as "yes" | "no")}
                          className="flex space-x-6 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`billable-yes-${index}`} />
                            <Label htmlFor={`billable-yes-${index}`} className="text-sm">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`billable-no-${index}`} />
                            <Label htmlFor={`billable-no-${index}`} className="text-sm">No</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Distribute Cost?</Label>
                        <RadioGroup
                          value={form.watch(`accommodationItems.${index}.distributeCost`)}
                          onValueChange={(value) => form.setValue(`accommodationItems.${index}.distributeCost`, value as "yes" | "no")}
                          className="flex space-x-6 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`distribute-yes-${index}`} />
                            <Label htmlFor={`distribute-yes-${index}`} className="text-sm">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`distribute-no-${index}`} />
                            <Label htmlFor={`distribute-no-${index}`} className="text-sm">No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>

                  {/* Supporting Document Available */}
                  <div>
                    <Label className="text-sm font-medium">Supporting Document Available</Label>
                    <RadioGroup 
                      value={form.watch(`accommodationItems.${index}.supportingDocumentAvailable`)}
                      onValueChange={(value) => form.setValue(`accommodationItems.${index}.supportingDocumentAvailable`, value as "yes" | "no")}
                      className="flex space-x-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`supporting-yes-${index}`} />
                        <Label htmlFor={`supporting-yes-${index}`} className="text-sm">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`supporting-no-${index}`} />
                        <Label htmlFor={`supporting-no-${index}`} className="text-sm">No</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-gray-500 mt-1">(If Self Attested, select 'No')</p>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea
                      {...form.register(`accommodationItems.${index}.notes`)}
                      placeholder="Any additional comments about this accommodation expense"
                      rows={2}
                      data-testid={`textarea-notes-${index}`}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-between">
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
            data-testid="button-submit-claim"
          >
            {createClaimMutation.isPending ? "Creating..." : "Create Accommodation Claim"}
          </Button>
        </div>
      </form>
    </div>
  );
}