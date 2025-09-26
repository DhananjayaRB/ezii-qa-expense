import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricCard from "@/components/expense/metric-card";
import ExpenseList from "@/components/expense/expense-list";
import ExpenseModal from "@/components/expense/expense-modal";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Camera } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
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

  const { data: metrics = {}, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  const { data: expenseClaims = [], isLoading: claimsLoading } = useQuery<any[]>({
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
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Expenses"
              value={metrics?.totalExpenses || 0}
              icon="file-invoice-rupee"
              color="blue"
              isLoading={metricsLoading}
              data-testid="metric-total-expenses"
            />
            <MetricCard
              title="Pending Approval"
              value={metrics?.pendingApproval || 0}
              icon="clock"
              color="yellow"
              isLoading={metricsLoading}
              data-testid="metric-pending-approval"
            />
            <MetricCard
              title="Settled"
              value={metrics?.settled || 0}
              icon="check-circle"
              color="green"
              isLoading={metricsLoading}
              data-testid="metric-settled"
            />
            <MetricCard
              title="Open Advances"
              value={metrics?.openAdvances || 0}
              icon="hand-holding-rupee"
              color="purple"
              isLoading={metricsLoading}
              data-testid="metric-open-advances"
            />
          </div>

          {/* Expense Claims List */}
          <ExpenseList 
            claims={Array.isArray(expenseClaims) ? expenseClaims : []} 
            isLoading={claimsLoading}
            data-testid="expense-list"
          />

          {/* Quick Actions */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-3">
            <Button
              size="lg"
              className="w-14 h-14 rounded-full shadow-lg"
              onClick={() => setShowExpenseModal(true)}
              data-testid="button-new-expense"
            >
              <Plus className="h-6 w-6" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-12 h-12 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-upload-receipt"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        open={showExpenseModal}
        onOpenChange={setShowExpenseModal}
        data-testid="expense-modal"
      />
    </div>
  );
}
