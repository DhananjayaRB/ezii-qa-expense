import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, FileText, CheckCircle2, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useLocation } from "wouter";

const paymentBatchSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  status: z.enum(["draft", "processing", "released"]).default("draft"),
});

const paymentBatchItemSchema = z.object({
  payeeType: z.enum(["employee", "vendor"]),
  payeeName: z.string().min(1, "Payee name is required"),
  amount: z.string().min(1, "Amount is required"),
  purpose: z.string().min(1, "Purpose is required"),
  bankAccount: z.string().optional(),
  ifscCode: z.string().optional(),
  expenseClaimId: z.string().optional(),
  directExpenseId: z.string().optional(),
});

type PaymentBatchForm = z.infer<typeof paymentBatchSchema>;
type PaymentBatchItemForm = z.infer<typeof paymentBatchItemSchema>;

export default function InitiatePayments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<any>(null);

  // Fetch payment batches
  const { data: batches = [], isLoading: loadingBatches } = useQuery({
    queryKey: ["/api/payment-batches"],
  });

  // Fetch batch items for selected batch
  const { data: batchItems = [] } = useQuery({
    queryKey: ["/api/payment-batches", selectedBatchId, "items"],
    enabled: !!selectedBatchId,
  });

  // Payment batch form
  const batchForm = useForm<PaymentBatchForm>({
    resolver: zodResolver(paymentBatchSchema),
    defaultValues: {
      title: "",
      description: "",
      totalAmount: "",
      status: "draft",
    },
  });

  // Payment batch item form
  const itemForm = useForm<PaymentBatchItemForm>({
    resolver: zodResolver(paymentBatchItemSchema),
    defaultValues: {
      payeeType: "employee",
      payeeName: "",
      amount: "",
      purpose: "",
      bankAccount: "",
      ifscCode: "",
    },
  });

  // Create payment batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async (data: PaymentBatchForm) => {
      return await apiRequest("/api/payment-batches", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-batches"] });
      toast({
        title: "Success",
        description: "Payment batch created successfully",
      });
      setShowBatchDialog(false);
      batchForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update payment batch mutation
  const updateBatchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentBatchForm> }) => {
      return await apiRequest(`/api/payment-batches/${id}`, {
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-batches"] });
      toast({
        title: "Success",
        description: "Payment batch updated successfully",
      });
      setShowBatchDialog(false);
      setEditingBatch(null);
      batchForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete payment batch mutation
  const deleteBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/payment-batches/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-batches"] });
      toast({
        title: "Success",
        description: "Payment batch deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create batch item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: PaymentBatchItemForm) => {
      return await apiRequest(`/api/payment-batches/${selectedBatchId}/items`, { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-batches", selectedBatchId, "items"] });
      toast({
        title: "Success",
        description: "Payment item added successfully",
      });
      setShowItemDialog(false);
      itemForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBatch = (data: PaymentBatchForm) => {
    if (editingBatch) {
      updateBatchMutation.mutate({ id: editingBatch.id, data });
    } else {
      createBatchMutation.mutate(data);
    }
  };

  const handleEditBatch = (batch: any) => {
    setEditingBatch(batch);
    batchForm.reset({
      title: batch.title,
      description: batch.description || "",
      totalAmount: batch.totalAmount,
      status: batch.status,
    });
    setShowBatchDialog(true);
  };

  const handleDeleteBatch = (id: string) => {
    if (confirm("Are you sure you want to delete this payment batch?")) {
      deleteBatchMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800", 
      released: "bg-green-100 text-green-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setLocation("/accountant/payments")}
                className="mb-4"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payments
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Initiate Payments</h1>
              <p className="text-gray-600">Create and manage payment batches for expense claims</p>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-batch">
                      <Plus className="w-4 h-4 mr-2" />
                      New Payment Batch
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingBatch ? "Edit Payment Batch" : "Create Payment Batch"}</DialogTitle>
                      <DialogDescription>
                        {editingBatch ? "Update the payment batch details" : "Create a new payment batch for processing expenses"}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...batchForm}>
                      <form onSubmit={batchForm.handleSubmit(handleCreateBatch)} className="space-y-4">
                        <FormField
                          control={batchForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter batch title" {...field} data-testid="input-batch-title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={batchForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter batch description" {...field} data-testid="input-batch-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={batchForm.control}
                          name="totalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Amount</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-batch-amount" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={batchForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-batch-status">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="released">Released</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setShowBatchDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createBatchMutation.isPending || updateBatchMutation.isPending} data-testid="button-save-batch">
                            {editingBatch ? "Update" : "Create"} Batch
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Payment Batches Table */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Batches</CardTitle>
                <CardDescription>Manage all payment batches for expense processing</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBatches ? (
                  <div className="text-center py-4">Loading batches...</div>
                ) : batches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No payment batches found. Create one to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch: any) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-mono text-sm" data-testid={`text-batch-number-${batch.id}`}>
                            {batch.batchNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium" data-testid={`text-batch-title-${batch.id}`}>{batch.title}</p>
                              {batch.description && (
                                <p className="text-sm text-gray-500">{batch.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-batch-amount-${batch.id}`}>
                            ₹{parseFloat(batch.totalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(batch.status)} data-testid={`status-batch-${batch.id}`}>
                              {batch.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {format(new Date(batch.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBatchId(batch.id);
                                  setShowItemDialog(true);
                                }}
                                data-testid={`button-add-items-${batch.id}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditBatch(batch)}
                                data-testid={`button-edit-batch-${batch.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteBatch(batch.id)}
                                data-testid={`button-delete-batch-${batch.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Add Payment Item Dialog */}
            <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Payment Item</DialogTitle>
                  <DialogDescription>
                    Add a payment item to the selected batch
                  </DialogDescription>
                </DialogHeader>
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit((data) => createItemMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={itemForm.control}
                      name="payeeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payee Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payee-type">
                                <SelectValue placeholder="Select payee type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="payeeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payee Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter payee name" {...field} data-testid="input-payee-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-item-amount" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose</FormLabel>
                          <FormControl>
                            <Input placeholder="Payment purpose" {...field} data-testid="input-purpose" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="bankAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Account</FormLabel>
                          <FormControl>
                            <Input placeholder="Account number" {...field} data-testid="input-bank-account" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="ifscCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code</FormLabel>
                          <FormControl>
                            <Input placeholder="IFSC code" {...field} data-testid="input-ifsc-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowItemDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createItemMutation.isPending} data-testid="button-add-item">
                        Add Item
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}