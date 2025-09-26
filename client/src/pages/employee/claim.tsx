import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import ExpenseModal from "@/components/expense/expense-modal";
import ExpenseList from "@/components/expense/expense-list";
import { useQuery } from "@tanstack/react-query";

export default function Claim() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showExpenseModal, setShowExpenseModal] = useState(false);

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

  const { data: expenseClaims, isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/expense-claims"],
    retry: false,
  });

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
                  Expense Claims
                </h1>
                <p className="text-gray-600" data-testid="text-page-description">
                  Create and manage your expense claims
                </p>
              </div>
              <Button
                onClick={() => setShowExpenseModal(true)}
                data-testid="button-new-claim"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Claim
              </Button>
            </div>
          </div>

          <ExpenseList 
            claims={expenseClaims || []} 
            isLoading={claimsLoading}
            showUserInfo={false}
            data-testid="expense-claims-list"
          />
        </main>
      </div>

      <ExpenseModal
        open={showExpenseModal}
        onOpenChange={setShowExpenseModal}
        data-testid="expense-claim-modal"
      />
    </div>
  );
}
