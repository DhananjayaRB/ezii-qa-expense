import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPartySchema } from "@shared/schema";
import { ArrowLeft, ArrowRight, Save, User, FileText, Building2, CheckCircle } from "lucide-react";

const stepIcons = [
  { icon: User, label: "Basic Info" },
  { icon: FileText, label: "Tax Info" },
  { icon: Building2, label: "Bank Details" },
  { icon: CheckCircle, label: "Complete" },
];

const partyTypes = [
  { value: "vendor", label: "Vendor" },
  { value: "customer", label: "Customer" },
  { value: "employee", label: "Employee" },
  { value: "supplier", label: "Supplier" },
];

const legalEntities = [
  { value: "individual", label: "Individual" },
  { value: "partnership", label: "Partnership" },
  { value: "pvt_ltd", label: "Private Limited" },
  { value: "public_ltd", label: "Public Limited" },
  { value: "llp", label: "LLP" },
  { value: "opc", label: "One Person Company" },
];

const gstRegistrationTypes = [
  { value: "regular", label: "Regular" },
  { value: "composition", label: "Composition" },
  { value: "unregistered", label: "Unregistered" },
  { value: "exempt", label: "Exempt" },
];

const states = [
  { value: "AN", label: "Andaman and Nicobar Islands" },
  { value: "AP", label: "Andhra Pradesh" },
  { value: "AR", label: "Arunachal Pradesh" },
  { value: "AS", label: "Assam" },
  { value: "BR", label: "Bihar" },
  { value: "CH", label: "Chandigarh" },
  { value: "CT", label: "Chhattisgarh" },
  { value: "DN", label: "Dadra and Nagar Haveli" },
  { value: "DD", label: "Daman and Diu" },
  { value: "DL", label: "Delhi" },
  { value: "GA", label: "Goa" },
  { value: "GJ", label: "Gujarat" },
  { value: "HR", label: "Haryana" },
  { value: "HP", label: "Himachal Pradesh" },
  { value: "JK", label: "Jammu and Kashmir" },
  { value: "JH", label: "Jharkhand" },
  { value: "KA", label: "Karnataka" },
  { value: "KL", label: "Kerala" },
  { value: "LD", label: "Lakshadweep" },
  { value: "MP", label: "Madhya Pradesh" },
  { value: "MH", label: "Maharashtra" },
  { value: "MN", label: "Manipur" },
  { value: "ML", label: "Meghalaya" },
  { value: "MZ", label: "Mizoram" },
  { value: "NL", label: "Nagaland" },
  { value: "OR", label: "Odisha" },
  { value: "PY", label: "Puducherry" },
  { value: "PB", label: "Punjab" },
  { value: "RJ", label: "Rajasthan" },
  { value: "SK", label: "Sikkim" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "TG", label: "Telangana" },
  { value: "TR", label: "Tripura" },
  { value: "UP", label: "Uttar Pradesh" },
  { value: "UT", label: "Uttarakhand" },
  { value: "WB", label: "West Bengal" },
];

const paymentModes = [
  { value: "neft", label: "NEFT" },
  { value: "rtgs", label: "RTGS" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
  { value: "dd", label: "Demand Draft" },
];

const accountTypes = [
  { value: "savings", label: "Savings Account" },
  { value: "current", label: "Current Account" },
  { value: "cc", label: "Cash Credit" },
  { value: "od", label: "Overdraft" },
];

export default function AddPartyMaster() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof insertPartySchema>>({
    resolver: zodResolver(insertPartySchema),
    defaultValues: {
      name: "",
      partyType: "",
      legalEntity: "",
      keyContactPerson: "",
      email: "",
      phone: "",
      address: "",
      accountingLedger: "",
      accountingCode: "",
      linkToClaim: false,
      isActive: true,
      pan: "",
      registerUnderMsme: false,
      msmeNo: "",
      vendorTradeName: "",
      gstRegistrationType: "",
      gstNo: "",
      state: "",
      shippedFrom: "",
      bankPartyName: "",
      bankName: "",
      bankAccountNumber: "",
      branchName: "",
      ifscCode: "",
      preferredPaymentMode: "",
      preferredPaymentDispatchMode: "",
      bankAccountType: "",
    },
  });

  const createPartyMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertPartySchema>) =>
      apiRequest("/api/parties", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      toast({
        title: "Success",
        description: "Party created successfully",
      });
      setLocation("/configuration");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create party",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof insertPartySchema>) => {
    createPartyMutation.mutate(values);
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
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Vendor Name" {...field} data-testid="input-party-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="partyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-party-type">
                          <SelectValue placeholder="---Select Party Type---" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {partyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="legalEntity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Entity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-legal-entity">
                          <SelectValue placeholder="--Select Legal Entity--" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {legalEntities.map((entity) => (
                          <SelectItem key={entity.value} value={entity.value}>
                            {entity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keyContactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Key Contact Person" {...field} data-testid="input-contact-person" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter Email" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Contact Number" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountingLedger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accounting Ledger</FormLabel>
                    <FormControl>
                      <Input placeholder="Accounting ledger" {...field} data-testid="input-accounting-ledger" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountingCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accounting Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Accounting Code" {...field} data-testid="input-accounting-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter Address" {...field} data-testid="textarea-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-8">
              <FormField
                control={form.control}
                name="linkToClaim"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-link-to-claim"
                      />
                    </FormControl>
                    <FormLabel>Link to Claim</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-active"
                      />
                    </FormControl>
                    <FormLabel>Is Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tax Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter PAN No" {...field} data-testid="input-pan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstRegistrationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Registration Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gst-registration-type">
                          <SelectValue placeholder="Select Registration Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gstRegistrationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST NO</FormLabel>
                    <FormControl>
                      <Input placeholder="GST No" {...field} data-testid="input-gst-no" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-state">
                          <SelectValue placeholder="---Select State---" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="msmeNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MSME No. (15 characters-allow only caps & numbers)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="MSME No. (15 characters-allow only caps & numbers)" 
                        {...field} 
                        maxLength={15}
                        data-testid="input-msme-no"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendorTradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Trade Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Vendor Trade Name, if different from vendor Name" {...field} data-testid="input-vendor-trade-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippedFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipped From</FormLabel>
                    <FormControl>
                      <Input placeholder="Shipped From" {...field} data-testid="input-shipped-from" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="registerUnderMsme"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-register-under-msme"
                    />
                  </FormControl>
                  <FormLabel>Register under MSME</FormLabel>
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankPartyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Name(According to Bank)</FormLabel>
                    <FormControl>
                      <Input placeholder="Party Name according to bank" {...field} data-testid="input-bank-party-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Bank Name" {...field} data-testid="input-bank-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Bank Account Number" {...field} data-testid="input-bank-account-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Branch Name" {...field} data-testid="input-branch-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input placeholder="IFSC Code" {...field} data-testid="input-ifsc-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredPaymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Payment Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-preferred-payment-mode">
                          <SelectValue placeholder="Select Payment Mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredPaymentDispatchMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Payment Dispatch Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-preferred-payment-dispatch-mode">
                          <SelectValue placeholder="Select Payment Dispatch Mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bank-account-type">
                          <SelectValue placeholder="Select Account Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h3 className="text-lg font-semibold">Review & Submit</h3>
            <p className="text-muted-foreground">
              Please review all the information you've entered and submit the party master record.
            </p>
            <div className="text-left space-y-2 bg-muted p-4 rounded-lg">
              <p><strong>Party Name:</strong> {form.getValues("name")}</p>
              <p><strong>Party Type:</strong> {form.getValues("partyType")}</p>
              <p><strong>Email:</strong> {form.getValues("email")}</p>
              <p><strong>Phone:</strong> {form.getValues("phone")}</p>
              {form.getValues("pan") && <p><strong>PAN:</strong> {form.getValues("pan")}</p>}
              {form.getValues("gstNo") && <p><strong>GST No:</strong> {form.getValues("gstNo")}</p>}
              {form.getValues("bankName") && <p><strong>Bank:</strong> {form.getValues("bankName")}</p>}
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
              onClick={() => setLocation("/configuration")}
              className="mb-4"
              data-testid="button-back-to-config"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Configuration
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Add Party Master</h1>
          </div>

      <Card>
        <CardHeader>
          <CardTitle>Party Master Information</CardTitle>
          
          {/* Step Progress */}
          <div className="flex items-center justify-between mt-4">
            {stepIcons.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive 
                      ? "border-primary bg-primary text-primary-foreground" 
                      : isCompleted 
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-muted-foreground bg-background"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-2 text-sm">
                    <div className={isActive ? "font-semibold" : ""}>{step.label}</div>
                  </div>
                  {index < stepIcons.length - 1 && (
                    <div className={`w-16 h-0.5 ml-4 ${
                      isCompleted ? "bg-green-500" : "bg-muted-foreground/30"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  data-testid="button-previous"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <div className="flex space-x-2">
                  {currentStep < stepIcons.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      data-testid="button-next"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={createPartyMutation.isPending}
                      data-testid="button-submit"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {createPartyMutation.isPending ? "Creating..." : "Create Party"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
          </CardContent>
        </Card>
        </main>
      </div>
    </div>
  );
}