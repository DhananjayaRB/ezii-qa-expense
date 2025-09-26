import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Wallet } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

const createCashboxSchema = z.object({
  name: z.string().min(1, "Cashbox name is required").max(100, "Name too long"),
  description: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  initialAmount: z.number().min(0, "Initial amount must be positive"),
});

type CreateCashboxForm = z.infer<typeof createCashboxSchema>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function NewCashbox() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<CreateCashboxForm>({
    resolver: zodResolver(createCashboxSchema),
    defaultValues: {
      name: "",
      description: "",
      currency: "INR",
      initialAmount: 0,
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createCashboxMutation = useMutation({
    mutationFn: async (data: CreateCashboxForm) => {
      // Create cashbox first
      const response = await fetch("/api/cashboxes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          currency: data.currency,
          currentBalance: "0",
          status: "active",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const cashbox = await response.json();

      // Initialize with funds if specified
      if (data.initialAmount > 0) {
        const initResponse = await fetch(`/api/cashboxes/${cashbox.id}/initialize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            initialAmount: data.initialAmount,
          }),
        });

        if (!initResponse.ok) {
          const errorData = await initResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to initialize cashbox: ${initResponse.status}`);
        }
      }

      return cashbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cashboxes"] });
      toast({
        title: "Success",
        description: "Cashbox created successfully",
      });
      setLocation("/petty-cash");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create cashbox",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCashboxForm) => {
    setIsCreating(true);
    createCashboxMutation.mutate(data, {
      onSettled: () => setIsCreating(false),
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6" data-testid="new-cashbox-page">
            <div>
              <Button
                variant="ghost"
                onClick={() => setLocation("/petty-cash")}
                className="mb-4"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Petty Cash
              </Button>
              <h1 className="text-2xl font-semibold" data-testid="page-title">Create New Cashbox</h1>
              <p className="text-muted-foreground">Set up a new cashbox for petty cash management</p>
            </div>

            <Card className="max-w-2xl" data-testid="card-create-form">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="h-5 w-5 mr-2" />
                  Cashbox Details
                </CardTitle>
                <CardDescription>
                  Provide the basic information for your new cashbox
                </CardDescription>
              </CardHeader>
              <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-create-cashbox">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cashbox Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter cashbox name (e.g., Main Office Cash)"
                        {...field}
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormDescription>
                      Choose a descriptive name to identify this cashbox
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional description of the cashbox purpose or location"
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Provide additional context about this cashbox (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The currency for all transactions in this cashbox
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-initial-amount"
                      />
                    </FormControl>
                    <FormDescription>
                      The starting balance for this cashbox (leave 0 if no initial funds)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/petty-cash")}
                  className="flex-1"
                  disabled={isCreating}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isCreating}
                  data-testid="button-create"
                >
                  {isCreating ? "Creating..." : "Create Cashbox"}
                </Button>
              </div>
            </form>
          </Form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
  );
}