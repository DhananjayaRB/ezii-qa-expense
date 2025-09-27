import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import OcrUpload from "@/components/ui/ocr-upload";
import { normalizeOcrAmount } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DirectExpenses() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    description: "",
    amount: "",
    currency: "INR",
    date: "",
    vendorName: "",
    invoiceNumber: "",
  });

  // Redirect to home if not authenticated
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

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/direct-expenses"],
    retry: false,
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/expense-categories"],
    retry: false,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/direct-expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct-expenses"] });
      setShowExpenseModal(false);
      setFormData({
        categoryId: "",
        description: "",
        amount: "",
        currency: "INR",
        date: "",
        vendorName: "",
        invoiceNumber: "",
      });
      toast({
        title: "Success",
        description: "Direct expense created successfully",
      });
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
        description: "Failed to create direct expense",
        variant: "destructive",
      });
    },
  });

  // OCR Data mapping function for direct expenses
  const handleOcrDataExtracted = (ocrData: any) => {
    console.log('🔍 OCR Data extracted for direct expense:', ocrData);
    
    if (!ocrData) return;
    
    const updates: any = {};
    const extractedDetails = [];
    
    // Map OCR amount to Amount field (with normalization)
    if (ocrData.billAmount || ocrData.amount) {
      const rawAmount = ocrData.billAmount || ocrData.amount;
      const normalizedAmount = normalizeOcrAmount(rawAmount);
      if (normalizedAmount) {
        updates.amount = normalizedAmount;
        extractedDetails.push(`Amount: ₹${normalizedAmount}`);
      }
    }
    
    // Map OCR date to Date field  
    if (ocrData.billDate || ocrData.date) {
      const date = ocrData.billDate || ocrData.date;
      try {
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          updates.date = dateObj.toISOString().split('T')[0];
          extractedDetails.push(`Date: ${dateObj.toLocaleDateString('en-GB')}`);
        }
      } catch (e) {
        console.log('Date parsing error:', e);
      }
    }
    
    // Map OCR invoice number
    if (ocrData.billNo || ocrData.invoiceNumber || ocrData.billNumber) {
      const invoiceNo = ocrData.billNo || ocrData.invoiceNumber || ocrData.billNumber;
      updates.invoiceNumber = invoiceNo;
      extractedDetails.push(`Invoice: ${invoiceNo}`);
    }
    
    // Map vendor name
    if (ocrData.vendorName) {
      updates.vendorName = ocrData.vendorName;
      extractedDetails.push(`Vendor: ${ocrData.vendorName}`);
    }
    
    // Map description
    if (ocrData.description && !formData.description) {
      const desc = ocrData.description.substring(0, 100); // Limit description length
      updates.description = desc;
      extractedDetails.push(`Description added`);
    }
    
    // Apply all updates to form
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Show success feedback only if data was actually extracted
    if (extractedDetails.length > 0) {
      toast({
        title: "✅ OCR Data Applied!", 
        description: `Extracted: ${extractedDetails.join(', ')}`,
      });
    } else {
      toast({
        title: "⚠️ OCR Complete",
        description: "No usable data could be extracted from this document.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpenseMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                  Direct Expenses
                </h1>
                <p className="text-gray-600" data-testid="text-page-description">
                  Manage company-level expenses such as utilities, subscriptions, and project costs
                </p>
              </div>
              <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-direct-expense">
                    <Plus className="h-4 w-4 mr-2" />
                    New Direct Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>New Direct Expense</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1">
                    {/* OCR Upload Section */}
                    <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="text-center space-y-2">
                        <Receipt className="w-8 h-8 text-blue-600 mx-auto" />
                        <h3 className="text-lg font-medium text-blue-900">Smart Bill Processing</h3>
                        <p className="text-sm text-blue-700">
                          Upload your bill/receipt and let OCR automatically fill expense details
                        </p>
                      </div>
                      <div className="mt-4">
                        <OcrUpload
                          module="direct_expenses"
                          claimTitle={() => `Direct Expense - ${formData.vendorName || 'New'}`}
                          onDataExtracted={handleOcrDataExtracted}
                          data-testid="ocr-upload-direct-expense"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                          data-testid="input-expense-date"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryId">Category</Label>
                        <Select
                          value={formData.categoryId}
                          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        >
                          <SelectTrigger data-testid="select-expense-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(categories || []).map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter expense description"
                        required
                        data-testid="textarea-expense-description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="0.00 (or use OCR above)"
                          required
                          data-testid="input-expense-amount"
                          className={formData.amount ? "border-green-300 bg-green-50" : ""}
                        />
                        {formData.amount && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Amount filled
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => setFormData({ ...formData, currency: value })}
                        >
                          <SelectTrigger data-testid="select-expense-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vendorName">Vendor Name</Label>
                        <Input
                          id="vendorName"
                          value={formData.vendorName}
                          onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                          placeholder="Enter vendor name"
                          data-testid="input-vendor-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input
                          id="invoiceNumber"
                          value={formData.invoiceNumber}
                          onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                          placeholder="Enter invoice number"
                          data-testid="input-invoice-number"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowExpenseModal(false)}
                        data-testid="button-cancel-expense"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createExpenseMutation.isPending}
                        data-testid="button-submit-expense"
                      >
                        {createExpenseMutation.isPending ? "Creating..." : "Create Expense"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Direct Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="text-center py-8">Loading expenses...</div>
              ) : expenses && Array.isArray(expenses) && expenses.length > 0 ? (
                <div className="space-y-4">
                  {(expenses || []).map((expense: any) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      data-testid={`expense-item-${expense.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900" data-testid={`text-expense-description-${expense.id}`}>
                            {expense.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            {expense.vendorName && `${expense.vendorName} • `}
                            {expense.currency} {expense.amount}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(expense.date).toLocaleDateString('en-GB')} • 
                            Created by {expense.creator?.firstName} {expense.creator?.lastName}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(expense.status)} data-testid={`status-${expense.id}`}>
                        {expense.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500" data-testid="text-no-expenses">No direct expenses found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
