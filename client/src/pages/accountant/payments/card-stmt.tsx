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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Upload, FileText, CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const cardStatementSchema = z.object({
  cardType: z.string().min(1, "Card type is required"),
  cardNumber: z.string().min(1, "Card number is required"), 
  holderName: z.string().min(1, "Holder name is required"),
  billingMonth: z.string().min(1, "Billing month is required"),
  billingYear: z.string().min(1, "Billing year is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["pending", "processed", "paid"]).default("pending"),
});

type CardStatementForm = z.infer<typeof cardStatementSchema>;

export default function CardStatement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [editingStatement, setEditingStatement] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch card statements
  const { data: statements = [], isLoading: loadingStatements } = useQuery({
    queryKey: ["/api/card-statements"],
  });

  // Card statement form
  const statementForm = useForm<CardStatementForm>({
    resolver: zodResolver(cardStatementSchema),
    defaultValues: {
      cardType: "",
      cardNumber: "",
      holderName: "",
      billingMonth: "",
      billingYear: "",
      totalAmount: "",
      dueDate: "",
      status: "pending",
    },
  });

  // Create card statement mutation
  const createStatementMutation = useMutation({
    mutationFn: async (data: CardStatementForm & { file?: File }) => {
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'file' && value) {
          formData.append(key, value.toString());
        }
      });
      
      // Add file if selected
      if (selectedFile) {
        formData.append('statementFile', selectedFile);
      }

      return await fetch("/api/card-statements", {
        method: "POST", 
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/card-statements"] });
      toast({
        title: "Success",
        description: "Card statement created successfully",
      });
      setShowStatementDialog(false);
      setSelectedFile(null);
      statementForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update card statement mutation
  const updateStatementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CardStatementForm> }) => {
      return await apiRequest(`/api/card-statements/${id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/card-statements"] });
      toast({
        title: "Success",
        description: "Card statement updated successfully",
      });
      setShowStatementDialog(false);
      setEditingStatement(null);
      statementForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete card statement mutation
  const deleteStatementMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/card-statements/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/card-statements"] });
      toast({
        title: "Success",
        description: "Card statement deleted successfully",
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

  const handleCreateStatement = (data: CardStatementForm) => {
    if (editingStatement) {
      updateStatementMutation.mutate({ id: editingStatement.id, data });
    } else {
      createStatementMutation.mutate({ ...data, file: selectedFile });
    }
  };

  const handleEditStatement = (statement: any) => {
    setEditingStatement(statement);
    statementForm.reset({
      cardType: statement.cardType,
      cardNumber: statement.cardNumber,
      holderName: statement.holderName,
      billingMonth: statement.billingMonth,
      billingYear: statement.billingYear,
      totalAmount: statement.totalAmount,
      dueDate: format(new Date(statement.dueDate), "yyyy-MM-dd"),
      status: statement.status,
    });
    setShowStatementDialog(true);
  };

  const handleDeleteStatement = (id: string) => {
    if (confirm("Are you sure you want to delete this card statement?")) {
      deleteStatementMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processed: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 10}, (_, i) => currentYear + i - 5);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <Header />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Card Statements</h1>
              <p className="text-gray-600">Upload and manage credit card statements</p>
            </div>

            <div className="flex justify-between items-center mb-6">
              <Dialog open={showStatementDialog} onOpenChange={setShowStatementDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-statement">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card Statement
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingStatement ? "Edit Card Statement" : "Add Card Statement"}</DialogTitle>
                    <DialogDescription>
                      {editingStatement ? "Update the card statement details" : "Add a new card statement with billing information"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...statementForm}>
                    <form onSubmit={statementForm.handleSubmit(handleCreateStatement)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={statementForm.control}
                          name="cardType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-card-type">
                                    <SelectValue placeholder="Select card type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="visa">Visa</SelectItem>
                                  <SelectItem value="mastercard">Mastercard</SelectItem>
                                  <SelectItem value="amex">American Express</SelectItem>
                                  <SelectItem value="rupay">RuPay</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statementForm.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Number (Last 4 digits)</FormLabel>
                              <FormControl>
                                <Input placeholder="****" maxLength={4} {...field} data-testid="input-card-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={statementForm.control}
                        name="holderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Holder Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter card holder name" {...field} data-testid="input-holder-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={statementForm.control}
                          name="billingMonth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billing Month</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-billing-month">
                                    <SelectValue placeholder="Select month" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {months.map((month, index) => (
                                    <SelectItem key={month} value={month}>
                                      {month}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statementForm.control}
                          name="billingYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billing Year</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-billing-year">
                                    <SelectValue placeholder="Select year" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {years.map(year => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={statementForm.control}
                          name="totalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Amount</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-total-amount" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statementForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-due-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={statementForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processed">Processed</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!editingStatement && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Statement File (Optional)</label>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            data-testid="input-statement-file"
                          />
                          <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, JPG, PNG (max 5MB)</p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowStatementDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createStatementMutation.isPending || updateStatementMutation.isPending}
                          data-testid="button-save-statement"
                        >
                          {editingStatement ? "Update" : "Add"} Statement
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Card Statements Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Card Statements
                </CardTitle>
                <CardDescription>Manage all credit card statements and billing information</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStatements ? (
                  <div className="text-center py-4">Loading statements...</div>
                ) : statements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No card statements found. Add one to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Card Details</TableHead>
                        <TableHead>Holder Name</TableHead>
                        <TableHead>Billing Period</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(statements) && statements.map((statement: any) => (
                        <TableRow key={statement.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              <div>
                                <p className="font-medium capitalize" data-testid={`text-card-type-${statement.id}`}>
                                  {statement.cardType}
                                </p>
                                <p className="text-xs text-gray-500">****{statement.cardNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-holder-name-${statement.id}`}>
                            {statement.holderName}
                          </TableCell>
                          <TableCell data-testid={`text-billing-period-${statement.id}`}>
                            {statement.billingMonth} {statement.billingYear}
                          </TableCell>
                          <TableCell data-testid={`text-total-amount-${statement.id}`}>
                            ₹{parseFloat(statement.totalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(statement.dueDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(statement.status)} data-testid={`status-statement-${statement.id}`}>
                              {statement.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {statement.statementFile && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(statement.statementFile, '_blank')}
                                  data-testid={`button-view-file-${statement.id}`}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditStatement(statement)}
                                data-testid={`button-edit-statement-${statement.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteStatement(statement.id)}
                                data-testid={`button-delete-statement-${statement.id}`}
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
          </div>
        </main>
      </div>
    </div>
  );
}