import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertPettyCashReceiptSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Receipt, Upload, Users, Building2, Wallet, CreditCard } from "lucide-react";

type PettyCashReceiptForm = z.infer<typeof insertPettyCashReceiptSchema>;

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface Bank {
  id: string;
  name: string;
  accountNumber: string | null;
  ifscCode: string | null;
}

interface AdvancePayment {
  id: string;
  approvedAmount: string;
  request: {
    purpose: string;
    estimatedAmount: string;
  };
}

interface PettyCashReceipt {
  id: string;
  name: string;
  receiptType: string;
  receivedFromName: string;
  amountReceived: string;
  paymentOption: string;
  createdAt: string;
  bank?: Bank;
  receivedFrom?: User;
  recordedBy: User;
}

export default function Receipts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedReceiptType, setSelectedReceiptType] = useState<"party" | "employee">("party");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<PettyCashReceiptForm>({
    resolver: zodResolver(insertPettyCashReceiptSchema),
    defaultValues: {
      name: "",
      receiptType: "party",
      receivedFromName: "",
      receivedFromId: "",
      openAdvanceId: "",
      remainingAdvance: 0,
      purpose: "",
      amountReceived: 0,
      currency: "INR",
      paymentOption: "cashbox",
      bankId: "",
      recordedBy: "",
    },
  });

  // Fetch petty cash receipts
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ["/api/petty-cash-receipts"],
    retry: false,
  });

  // Fetch banks for dropdown
  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ["/api/banks"],
    retry: false,
  });

  // Fetch users for employee dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  // Fetch approved advances for selected employee
  const { data: advances = [] } = useQuery<AdvancePayment[]>({
    queryKey: ["/api/advance-payments/approved", form.watch("receivedFromId")],
    enabled: selectedReceiptType === "employee" && !!form.watch("receivedFromId"),
    retry: false,
  });

  // Create petty cash receipt mutation
  const createReceiptMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/petty-cash-receipts", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Petty cash receipt recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/petty-cash-receipts"] });
      form.reset();
      setSelectedFile(null);
      setShowForm(false);
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
        description: "Failed to record petty cash receipt",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Handle receipt type change
  useEffect(() => {
    form.setValue("receiptType", selectedReceiptType);
    form.setValue("receivedFromId", "");
    form.setValue("receivedFromName", "");
    form.setValue("openAdvanceId", "");
    form.setValue("remainingAdvance", 0);
  }, [selectedReceiptType, form]);

  // Handle received from change for employees
  useEffect(() => {
    const receivedFromId = form.watch("receivedFromId");
    if (selectedReceiptType === "employee" && receivedFromId) {
      const selectedUser = users.find(u => u.id === receivedFromId);
      if (selectedUser) {
        const fullName = `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim();
        form.setValue("receivedFromName", fullName || selectedUser.email || "");
      }
    }
  }, [form.watch("receivedFromId"), selectedReceiptType, users, form]);

  // Handle advance selection
  useEffect(() => {
    const advanceId = form.watch("openAdvanceId");
    if (advanceId) {
      const selectedAdvance = advances.find(a => a.id === advanceId);
      if (selectedAdvance) {
        form.setValue("remainingAdvance", parseFloat(selectedAdvance.approvedAmount));
      }
    } else {
      form.setValue("remainingAdvance", 0);
    }
  }, [form.watch("openAdvanceId"), advances, form]);

  const onSubmit = (data: PettyCashReceiptForm) => {
    const formData = new FormData();
    
    // Add all form fields except recordedBy (let server handle it)
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "recordedBy" && value !== null && value !== undefined && value !== "") {
        formData.append(key, value.toString());
      }
    });

    // Add file if selected
    if (selectedFile) {
      formData.append("document", selectedFile);
    }

    createReceiptMutation.mutate(formData);
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Receipt Entry</h1>
              <p className="text-gray-600">Record money received from parties and employees with advance adjustments</p>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)} 
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-add-receipt"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? "Cancel" : "Add Receipt"}
            </Button>
          </div>

          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  New Receipt Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Receipt Name */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Receipt Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter receipt name" 
                                {...field} 
                                data-testid="input-receipt-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Receipt Type */}
                      <FormField
                        control={form.control}
                        name="receiptType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Receipt Type *</FormLabel>
                            <Select 
                              value={selectedReceiptType} 
                              onValueChange={(value: "party" | "employee") => setSelectedReceiptType(value)}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-receipt-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="party" data-testid="option-party">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Party
                                  </div>
                                </SelectItem>
                                <SelectItem value="employee" data-testid="option-employee">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Employee
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Received From */}
                      {selectedReceiptType === "party" ? (
                        <FormField
                          control={form.control}
                          name="receivedFromName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Received From (Party Name) *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter party name" 
                                  {...field} 
                                  data-testid="input-party-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name="receivedFromId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Received From (Employee) *</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-employee">
                                    <SelectValue placeholder="Select employee" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id} data-testid={`option-employee-${user.id}`}>
                                      {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Open Advance (only for employees) */}
                      {selectedReceiptType === "employee" && (
                        <FormField
                          control={form.control}
                          name="openAdvanceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Open Advance (Optional)</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-advance">
                                    <SelectValue placeholder="Select advance to adjust" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {advances.map((advance) => (
                                    <SelectItem key={advance.id} value={advance.id} data-testid={`option-advance-${advance.id}`}>
                                      {advance.request.purpose} - ₹{advance.approvedAmount}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select an advance to adjust against this receipt
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Amount Received */}
                      <FormField
                        control={form.control}
                        name="amountReceived"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Received *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Payment Option */}
                      <FormField
                        control={form.control}
                        name="paymentOption"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Option *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-payment-option">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cashbox" data-testid="option-cashbox">
                                  <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Cashbox
                                  </div>
                                </SelectItem>
                                <SelectItem value="bank" data-testid="option-bank">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Bank
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Bank Selection (only when payment option is bank) */}
                      {form.watch("paymentOption") === "bank" && (
                        <FormField
                          control={form.control}
                          name="bankId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Bank *</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-bank">
                                    <SelectValue placeholder="Select bank account" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {banks.map((bank) => (
                                    <SelectItem key={bank.id} value={bank.id} data-testid={`option-bank-${bank.id}`}>
                                      {bank.name} {bank.accountNumber && `(...${bank.accountNumber.slice(-4)})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Purpose */}
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter purpose or description of the receipt"
                              className="min-h-[80px]"
                              {...field}
                              data-testid="textarea-purpose"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label>Supporting Document (Optional)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          data-testid="input-file"
                        />
                        {selectedFile && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            {selectedFile.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Upload supporting documents (JPG, PNG, PDF - Max 5MB)
                      </p>
                    </div>

                    {/* Remaining Advance Display */}
                    {form.watch("remainingAdvance") > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Advance Adjustment</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Remaining advance after this receipt: ₹{(form.watch("remainingAdvance") - form.watch("amountReceived")).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <Button 
                        type="submit" 
                        disabled={createReceiptMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-submit-receipt"
                      >
                        {createReceiptMutation.isPending ? "Recording..." : "Record Receipt"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowForm(false)}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Receipts List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              {receiptsLoading ? (
                <div className="text-center py-8">Loading receipts...</div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No receipts recorded yet. Click "Add Receipt" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {receipts.map((receipt: PettyCashReceipt) => (
                    <div 
                      key={receipt.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50"
                      data-testid={`receipt-${receipt.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900" data-testid={`receipt-name-${receipt.id}`}>
                            {receipt.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span data-testid={`receipt-type-${receipt.id}`}>
                              {receipt.receiptType === "party" ? "Party" : "Employee"}: {receipt.receivedFromName}
                            </span>
                            <span data-testid={`receipt-amount-${receipt.id}`}>
                              ₹{parseFloat(receipt.amountReceived).toFixed(2)}
                            </span>
                            <span data-testid={`receipt-payment-${receipt.id}`}>
                              {receipt.paymentOption === "bank" ? (
                                <><CreditCard className="h-3 w-3 inline mr-1" />Bank</>
                              ) : (
                                <><Wallet className="h-3 w-3 inline mr-1" />Cashbox</>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {new Date(receipt.createdAt).toLocaleDateString('en-GB')}
                          </div>
                          <div className="text-xs text-gray-400">
                            By: {receipt.recordedBy.firstName} {receipt.recordedBy.lastName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}