import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, User } from "lucide-react";

// Validation schema
const createCashboxSchema = z.object({
  name: z.string().min(1, "Cash box name is required").max(100, "Name too long"),
  description: z.string().optional(),
  cashierId: z.string().min(1, "Cashier selection is required"),
  currentBalance: z.coerce.number().min(0, "Opening balance must be positive or zero"),
  openingBalanceDate: z.string().min(1, "Opening balance date is required"),
  accountingCode: z.string().optional(),
  accountingLedger: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  status: z.string().default("active"),
});

type CreateCashboxForm = z.infer<typeof createCashboxSchema>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function AddCashbox() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<CreateCashboxForm>({
    resolver: zodResolver(createCashboxSchema),
    defaultValues: {
      name: "",
      description: "",
      cashierId: "",
      currentBalance: 0,
      openingBalanceDate: new Date().toISOString().split('T')[0],
      accountingCode: "",
      accountingLedger: "",
      currency: "INR",
      status: "active",
    },
  });

  // Fetch users for cashier dropdown
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createCashboxMutation = useMutation({
    mutationFn: async (data: CreateCashboxForm) => {
      setIsCreating(true);
      
      const response = await apiRequest("/api/cashboxes", {
        method: "POST",
        body: {
          name: data.name,
          description: data.description || "",
          cashierId: data.cashierId,
          currentBalance: data.currentBalance.toString(),
          openingBalanceDate: new Date(data.openingBalanceDate),
          accountingCode: data.accountingCode || "",
          accountingLedger: data.accountingLedger || "",
          currency: data.currency,
          status: data.status,
        },
      });

      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch cashboxes
      queryClient.invalidateQueries({ queryKey: ["/api/cashboxes"] });
      
      toast({
        title: "Success",
        description: "Cashbox created successfully",
      });
      
      // Navigate back to cashbox list
      setLocation("/petty-cash");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create cashbox",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsCreating(false);
    },
  });

  const onSubmit = (data: CreateCashboxForm) => {
    createCashboxMutation.mutate(data);
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
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/petty-cash")}
                className="flex items-center gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Cashboxes
              </Button>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Cashbox</h1>
            <p className="text-gray-600">Set up a new cashbox for petty cash management</p>
          </div>

          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                CashBox Master
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cash Box Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Cash Box Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter cashbox name (e.g., Main Office Cash)"
                              {...field}
                              data-testid="input-cashbox-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Optional description of the cashbox purpose or location"
                              className="resize-none"
                              rows={3}
                              {...field}
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Cashier */}
                    <FormField
                      control={form.control}
                      name="cashierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Cashier <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger data-testid="select-cashier">
                                <SelectValue placeholder="Select cashier" />
                              </SelectTrigger>
                              <SelectContent>
                                {usersLoading ? (
                                  <SelectItem value="loading" disabled data-testid="option-loading">
                                    Loading users...
                                  </SelectItem>
                                ) : users.length === 0 ? (
                                  <SelectItem value="no-users" disabled data-testid="option-no-users">
                                    No users available
                                  </SelectItem>
                                ) : (
                                  users.map((user) => (
                                    <SelectItem 
                                      key={user.id} 
                                      value={user.id}
                                      data-testid={`option-cashier-${user.id}`}
                                    >
                                      {user.firstName} {user.lastName} - {user.role}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Opening Balance */}
                    <FormField
                      control={form.control}
                      name="currentBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Opening Balance <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                              data-testid="input-opening-balance"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Opening Balance Date */}
                    <FormField
                      control={form.control}
                      name="openingBalanceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Opening Balance Date <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-opening-balance-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Accounting Code */}
                    <FormField
                      control={form.control}
                      name="accountingCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Accounting Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter accounting code"
                              {...field}
                              data-testid="input-accounting-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Accounting Ledger */}
                    <FormField
                      control={form.control}
                      name="accountingLedger"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Accounting Ledger</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Accounting Number for ledger"
                              {...field}
                              data-testid="input-accounting-ledger"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Currency */}
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Currency <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="INR" data-testid="option-inr">
                                  INR - Indian Rupee
                                </SelectItem>
                                <SelectItem value="USD" data-testid="option-usd">
                                  USD - US Dollar
                                </SelectItem>
                                <SelectItem value="EUR" data-testid="option-eur">
                                  EUR - Euro
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Is Active */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">Is Active</FormLabel>
                            <div className="text-sm text-gray-500">
                              Enable or disable this cashbox
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === "active"}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? "active" : "inactive")
                              }
                              data-testid="switch-is-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/petty-cash")}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="bg-green-600 hover:bg-green-700 px-8"
                      data-testid="button-submit"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isCreating ? "Creating..." : "Create Cashbox"}
                    </Button>
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