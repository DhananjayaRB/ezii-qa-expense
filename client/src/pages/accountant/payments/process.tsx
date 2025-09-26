import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CreditCard, Wallet, Search, DollarSign, Users, Calendar, FileText, AlertCircle, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ExpenseClaim {
  id: string;
  description: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  items: Array<{
    id: string;
    description: string;
    amount: string;
    category: {
      name: string;
    };
  }>;
}

interface DirectExpense {
  id: string;
  description: string;
  amount: string;
  vendorName: string | null;
  createdAt: string;
  category: {
    name: string;
  } | null;
}

interface ExpenseCategory {
  id: string;
  name: string;
}

interface PaymentClaim {
  id: string;
  type: 'claim' | 'expense';
  name: string;
  claimedBy: string;
  requestDate: string;
  amount: number;
  payingAmount: number;
  category: string;
  selected: boolean;
}

export default function ProcessPayments() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [paymentAction, setPaymentAction] = useState<"pay" | "transfer" | "hold">("pay");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [showUtrDialog, setShowUtrDialog] = useState(false);
  const [paymentOption, setPaymentOption] = useState<"bank" | "cashbox">("bank");
  const [transactionMode, setTransactionMode] = useState<"transaction_wise" | "club">("transaction_wise");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [roundOffPayments, setRoundOffPayments] = useState(false);
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch approved expense claims
  const { data: expenseClaims = [], isLoading: claimsLoading } = useQuery<ExpenseClaim[]>({
    queryKey: ["/api/expense-claims?status=approved"],
    retry: false,
  });

  // Fetch direct expenses
  const { data: directExpenses = [], isLoading: expensesLoading } = useQuery<DirectExpense[]>({
    queryKey: ["/api/direct-expenses"],
    retry: false,
  });

  // Fetch expense categories
  const { data: categories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/expense-categories"],
    retry: false,
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return await apiRequest("POST", "/api/payments/process", paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/direct-expenses"] });
      // Reset selections
      setClaims(claims.map(claim => ({ ...claim, selected: false, payingAmount: claim.amount })));
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
        description: "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  // Convert claims and expenses to unified format
  useEffect(() => {
    const unifiedClaims: PaymentClaim[] = [
      ...expenseClaims.map(claim => ({
        id: claim.id,
        type: 'claim' as const,
        name: claim.description,
        claimedBy: `${claim.user.firstName || ""} ${claim.user.lastName || ""}`.trim() || claim.user.email || "Unknown",
        requestDate: claim.createdAt,
        amount: parseFloat(claim.totalAmount),
        payingAmount: parseFloat(claim.totalAmount),
        category: claim.items[0]?.category?.name || "Uncategorized",
        selected: false,
      })),
      ...directExpenses.map(expense => ({
        id: expense.id,
        type: 'expense' as const,
        name: expense.description,
        claimedBy: expense.vendorName || "Vendor",
        requestDate: expense.createdAt,
        amount: parseFloat(expense.amount),
        payingAmount: parseFloat(expense.amount),
        category: expense.category?.name || "Uncategorized",
        selected: false,
      }))
    ];
    setClaims(unifiedClaims);
  }, [expenseClaims, directExpenses]);

  // Filter claims based on category and search
  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      const matchesCategory = selectedCategory === "all" || claim.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        claim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.claimedBy.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [claims, selectedCategory, searchTerm]);

  // Calculate total payable amount
  const totalPayableAmount = useMemo(() => {
    const total = claims
      .filter(claim => claim.selected)
      .reduce((sum, claim) => sum + claim.payingAmount, 0);
    return roundOffPayments ? Math.round(total) : total;
  }, [claims, roundOffPayments]);

  const selectedClaimsCount = claims.filter(claim => claim.selected).length;

  // Handle claim selection
  const handleClaimSelection = (claimId: string, selected: boolean) => {
    setClaims(claims.map(claim => 
      claim.id === claimId ? { ...claim, selected } : claim
    ));
  };

  // Handle paying amount change
  const handlePayingAmountChange = (claimId: string, amount: number) => {
    setClaims(claims.map(claim => 
      claim.id === claimId ? { ...claim, payingAmount: Math.min(amount, claim.amount) } : claim
    ));
  };

  // Handle payment processing
  const handleProcessPayment = () => {
    const selectedClaims = claims.filter(claim => claim.selected);
    
    if (selectedClaims.length === 0) {
      toast({
        title: "No Claims Selected",
        description: "Please select at least one claim to proceed.",
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      action: paymentAction,
      paymentOption,
      transactionMode,
      roundOff: roundOffPayments,
      totalAmount: totalPayableAmount,
      claims: selectedClaims.map(claim => ({
        id: claim.id,
        type: claim.type,
        payingAmount: claim.payingAmount,
      })),
      ...(paymentAction === 'pay' && {
        utrNumber: utrNumber.trim(),
        paymentDate,
      }),
    };

    processPaymentMutation.mutate(paymentData);
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Process Payments</h1>
            <p className="text-gray-600">Process payments for claims, transfer bills, or hold bills. Payments require approval before finalization.</p>
          </div>

          <div className="space-y-6">
            {/* Payment Action Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Action</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={paymentAction} 
                  onValueChange={(value: "pay" | "transfer" | "hold") => setPaymentAction(value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pay" id="pay" data-testid="radio-pay" />
                    <Label htmlFor="pay" className="cursor-pointer">Pay</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transfer" id="transfer" data-testid="radio-transfer" />
                    <Label htmlFor="transfer" className="cursor-pointer">Transfer Bill</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hold" id="hold" data-testid="radio-hold" />
                    <Label htmlFor="hold" className="cursor-pointer">Hold Bill</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Options and Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Payment Option */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Payment Option *</Label>
                    <RadioGroup 
                      value={paymentOption} 
                      onValueChange={(value: "bank" | "cashbox") => setPaymentOption(value)}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bank" id="bank" data-testid="radio-bank" />
                        <Label htmlFor="bank" className="cursor-pointer flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Bank
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cashbox" id="cashbox" data-testid="radio-cashbox" />
                        <Label htmlFor="cashbox" className="cursor-pointer flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Cashbox
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Transaction Mode */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Transaction Mode</Label>
                    <RadioGroup 
                      value={transactionMode} 
                      onValueChange={(value: "transaction_wise" | "club") => setTransactionMode(value)}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="transaction_wise" id="transaction_wise" data-testid="radio-transaction-wise" />
                        <Label htmlFor="transaction_wise" className="cursor-pointer">Transaction Wise Payment</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="club" id="club" data-testid="radio-club" />
                        <Label htmlFor="club" className="cursor-pointer">Club Payments</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Payable Amount */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Payable Amount</Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <Input
                        value={`₹${totalPayableAmount.toFixed(2)}`}
                        readOnly
                        className="bg-gray-50 text-lg font-semibold"
                        data-testid="input-payable-amount"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="roundOff"
                    checked={roundOffPayments}
                    onCheckedChange={(checked) => setRoundOffPayments(checked as boolean)}
                    data-testid="checkbox-round-off"
                  />
                  <Label htmlFor="roundOff" className="cursor-pointer">Round Off Payments</Label>
                </div>
              </CardContent>
            </Card>

            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Select Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" data-testid="option-all-categories">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name} data-testid={`option-category-${category.id}`}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="search">Search Claims</Label>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by claim name or claimant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Claims Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Claims for Payment</span>
                  <Badge variant="secondary" data-testid="badge-selected-count">
                    {selectedClaimsCount} Selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {claimsLoading || expensesLoading ? (
                  <div className="text-center py-8">Loading claims...</div>
                ) : filteredClaims.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    No claims found matching your criteria.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredClaims.map((claim) => (
                      <div 
                        key={claim.id} 
                        className={`border rounded-lg p-4 transition-colors ${
                          claim.selected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        data-testid={`claim-${claim.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={claim.selected}
                            onCheckedChange={(checked) => handleClaimSelection(claim.id, checked as boolean)}
                            data-testid={`checkbox-claim-${claim.id}`}
                          />
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                            <div>
                              <div className="font-medium text-gray-900" data-testid={`claim-name-${claim.id}`}>
                                {claim.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {claim.id.slice(-8)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm" data-testid={`claim-by-${claim.id}`}>
                                {claim.claimedBy}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <Badge variant="outline" data-testid={`claim-type-${claim.id}`}>
                                {claim.type === 'claim' ? 'Expense' : 'Direct'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm" data-testid={`claim-date-${claim.id}`}>
                                {new Date(claim.requestDate).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Original Amount</div>
                              <div className="font-medium" data-testid={`claim-amount-${claim.id}`}>
                                ₹{claim.amount.toFixed(2)}
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor={`paying-${claim.id}`} className="text-xs text-gray-500">
                                Paying Amount
                              </Label>
                              <Input
                                id={`paying-${claim.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                max={claim.amount}
                                value={claim.payingAmount}
                                onChange={(e) => handlePayingAmountChange(claim.id, parseFloat(e.target.value) || 0)}
                                className="w-24 text-sm"
                                disabled={!claim.selected}
                                data-testid={`input-paying-amount-${claim.id}`}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs" data-testid={`claim-category-${claim.id}`}>
                            {claim.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* UTR Input Section for Payments */}
            {paymentAction === 'pay' && selectedClaimsCount > 0 && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Payment Details (For Approval)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> Payments will be submitted for approval and processed through the same workflow as expense claims (Manager → Admin → Head → Accountant).
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="utr-number" className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        UTR/Reference Number *
                      </Label>
                      <Input
                        id="utr-number"
                        name="utrNumber"
                        placeholder="Enter UTR or reference number"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        data-testid="input-utr"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="payment-date" className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Payment Date *
                      </Label>
                      <Input
                        id="payment-date"
                        name="paymentDate"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        data-testid="input-payment-date"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={handleProcessPayment}
                disabled={processPaymentMutation.isPending || selectedClaimsCount === 0 || (paymentAction === 'pay' && !utrNumber.trim())}
                className="bg-green-600 hover:bg-green-700 px-8"
                data-testid="button-process-payment"
              >
                {processPaymentMutation.isPending ? "Submitting..." : 
                 paymentAction === 'pay' ? `Submit for Approval${utrNumber ? ` (UTR: ${utrNumber})` : ''}` :
                 paymentAction === 'transfer' ? 'Transfer Bills' : 'Hold Bills'}
              </Button>
              
              {selectedClaimsCount > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => setClaims(claims.map(claim => ({ ...claim, selected: false })))}
                  data-testid="button-clear-selection"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}