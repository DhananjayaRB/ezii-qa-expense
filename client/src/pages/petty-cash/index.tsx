import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, TrendingUp, Receipt, ArrowUpDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

interface Cashbox {
  id: string;
  name: string;
  description?: string;
  currentBalance: string;
  currency: string;
  status: string;
  cashier: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const createCashboxSchema = z.object({
  name: z.string().min(1, "Cashbox name is required").max(100, "Name too long"),
  description: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  initialAmount: z.number().min(0, "Initial amount must be positive"),
});

type CreateCashboxForm = z.infer<typeof createCashboxSchema>;

export default function PettyCashIndex() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: cashboxes = [], isLoading } = useQuery<Cashbox[]>({
    queryKey: ["/api/cashboxes"],
  });

  const form = useForm<CreateCashboxForm>({
    resolver: zodResolver(createCashboxSchema),
    defaultValues: {
      name: "",
      description: "",
      currency: "INR",
      initialAmount: 0,
    },
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
      setShowCreateDialog(false);
      form.reset();
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

  const totalBalance = cashboxes.reduce((sum, box) => sum + parseFloat(box.currentBalance || "0"), 0);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6" data-testid="loading-state">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Petty Cash Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6" data-testid="petty-cash-index">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Petty Cash Management</h1>
          <p className="text-muted-foreground">Manage cash boxes, transactions, and ledger entries</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-create-cashbox-simple">
                <Plus className="h-4 w-4 mr-2" />
                Quick Create
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Button 
            onClick={() => setLocation("/cashbox/add")}
            data-testid="button-add-cashbox"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Cashbox
          </Button>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[600px]" data-testid="dialog-create-cashbox">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Create New Cashbox
              </DialogTitle>
              <DialogDescription>
                Set up a new cashbox for petty cash management
              </DialogDescription>
            </DialogHeader>
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
                    onClick={() => setShowCreateDialog(false)}
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
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="card-total-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-balance">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Across all cashboxes</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-cashboxes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cashboxes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-cashboxes">
              {cashboxes.filter(box => box.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>

        <Card data-testid="card-quick-actions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/petty-cash/transactions/new">
              <Button variant="outline" size="sm" className="w-full" data-testid="button-new-transaction">
                New Transaction
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card data-testid="card-transfers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fund Transfer</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/petty-cash/transfer">
              <Button variant="outline" size="sm" className="w-full" data-testid="button-fund-transfer">
                Transfer Funds
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Cashboxes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium" data-testid="cashboxes-title">Cashboxes</h2>
          <Link href="/petty-cash/transactions">
            <Button variant="outline" data-testid="button-view-transactions">
              View All Transactions
            </Button>
          </Link>
        </div>

        {cashboxes.length === 0 ? (
          <Card data-testid="card-empty-state">
            <CardContent className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No cashboxes found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first cashbox to start managing petty cash
              </p>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-cashbox">
                <Plus className="h-4 w-4 mr-2" />
                Create First Cashbox
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="cashboxes-grid">
            {cashboxes.map((cashbox) => (
              <Card key={cashbox.id} className="hover:shadow-md transition-shadow" data-testid={`card-cashbox-${cashbox.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg" data-testid={`text-cashbox-name-${cashbox.id}`}>
                      {cashbox.name}
                    </CardTitle>
                    <Badge
                      variant={cashbox.status === 'active' ? 'default' : 'secondary'}
                      data-testid={`badge-status-${cashbox.id}`}
                    >
                      {cashbox.status}
                    </Badge>
                  </div>
                  {cashbox.description && (
                    <CardDescription data-testid={`text-cashbox-description-${cashbox.id}`}>
                      {cashbox.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-2xl font-bold" data-testid={`text-balance-${cashbox.id}`}>
                        {formatCurrency(parseFloat(cashbox.currentBalance || "0"), cashbox.currency)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Cashier</p>
                      <p className="text-sm font-medium" data-testid={`text-cashier-${cashbox.id}`}>
                        {cashbox.cashier.firstName} {cashbox.cashier.lastName}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/petty-cash/cashboxes/${cashbox.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-${cashbox.id}`}>
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/petty-cash/cashboxes/${cashbox.id}/ledger`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-ledger-${cashbox.id}`}>
                          Ledger
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
          </div>
        </main>
      </div>
    </div>
  );
}