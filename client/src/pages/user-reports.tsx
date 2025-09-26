import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  pendingApproval: {
    requests: { count: number; value: number };
    advances: { count: number; value: number };
    claims: { count: number; value: number };
    bills: { count: number; value: number };
  };
  approved: {
    requests: { count: number; value: number };
    advances: { count: number; value: number };
    claims: { count: number; value: number };
    bills: { count: number; value: number };
  };
  pendingPayments: {
    requests: { count: number; value: number };
    advances: { count: number; value: number };
    claims: { count: number; value: number };
    bills: { count: number; value: number };
  };
  paid: {
    requests: { count: number; value: number };
    advances: { count: number; value: number };
    claims: { count: number; value: number };
    bills: { count: number; value: number };
  };
  watchList: {
    myOpenAdvances: { count: number; value: number };
    advancesOverDue: { count: number; value: number };
    claimsWithPolicyExceptions: { count: number; value: number };
    claimsWithoutSupportings: { count: number; value: number };
    myRejectedApplications: { count: number; value: number };
  };
  expenseAnalysis: {
    myCardStatements: { count: number; value: number };
    myExpenseBreakup: { categories: Array<{ category: string; value: number }> };
    myMajorExpenses: { count: number; value: number };
    myCostDimension: { departments: Array<{ department: string; value: number }> };
  };
}

export default function UserReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [dateRange, setDateRange] = useState({ start: "01/04/2019", end: "07/09/2025" });

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

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const { data: reportData, isLoading: reportsLoading } = useQuery<ReportData>({
    queryKey: ["/api/reports/user"],
  });

  // Report section component
  const ReportSection = ({ title, data, bgColor, textColor }: {
    title: string;
    data: any;
    bgColor: string;
    textColor: string;
  }) => (
    <Card className={`${bgColor} border-0`}>
      <CardHeader>
        <CardTitle className={`text-lg font-semibold ${textColor}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Requests</span>
          <div className="text-right">
            <div className="font-medium">{data.requests?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.requests?.value || 0)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Advances</span>
          <div className="text-right">
            <div className="font-medium">{data.advances?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.advances?.value || 0)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Claims</span>
          <div className="text-right">
            <div className="font-medium">{data.claims?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.claims?.value || 0)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Bills</span>
          <div className="text-right">
            <div className="font-medium">{data.bills?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.bills?.value || 0)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Watch List section component
  const WatchListSection = ({ data }: { data: any }) => (
    <Card className="bg-yellow-100 border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-yellow-700">
          Watch List
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">My Open Advances</span>
          <div className="text-right">
            <div className="font-medium">{data.myOpenAdvances?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.myOpenAdvances?.value || 0)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Advances Over Due</span>
          <div className="text-right">
            <div className="font-medium">{data.advancesOverDue?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.advancesOverDue?.value || 0)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Claims with Policy Exceptions</span>
          <div className="text-right">
            <div className="font-medium">{data.claimsWithPolicyExceptions?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.claimsWithPolicyExceptions?.value || 0)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Claims without Supportings</span>
          <div className="text-right">
            <div className="font-medium">{data.claimsWithoutSupportings?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.claimsWithoutSupportings?.value || 0)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">My Rejected Applications</span>
          <div className="text-right">
            <div className="font-medium">{data.myRejectedApplications?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.myRejectedApplications?.value || 0)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Expense Analysis section component
  const ExpenseAnalysisSection = ({ data }: { data: any }) => (
    <Card className="bg-green-100 border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-green-700">
          Expense Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">My Card Statements</span>
          <div className="text-right">
            <div className="font-medium">{data.myCardStatements?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.myCardStatements?.value || 0)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">My Major Expenses</span>
          <div className="text-right">
            <div className="font-medium">{data.myMajorExpenses?.count || 0}</div>
            <div className="text-sm text-gray-500">{formatCurrency(data.myMajorExpenses?.value || 0)}</div>
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Expense Breakdown</span>
          {data.myExpenseBreakup?.categories?.slice(0, 3).map((item: any, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.category}</span>
              <span>{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Default empty data structure if no data exists
  const defaultData: ReportData = {
    pendingApproval: {
      requests: { count: 0, value: 0 },
      advances: { count: 0, value: 0 },
      claims: { count: 0, value: 0 },
      bills: { count: 0, value: 0 },
    },
    approved: {
      requests: { count: 0, value: 0 },
      advances: { count: 0, value: 0 },
      claims: { count: 0, value: 0 },
      bills: { count: 0, value: 0 },
    },
    pendingPayments: {
      requests: { count: 0, value: 0 },
      advances: { count: 0, value: 0 },
      claims: { count: 0, value: 0 },
      bills: { count: 0, value: 0 },
    },
    paid: {
      requests: { count: 0, value: 0 },
      advances: { count: 0, value: 0 },
      claims: { count: 0, value: 0 },
      bills: { count: 0, value: 0 },
    },
    watchList: {
      myOpenAdvances: { count: 0, value: 0 },
      advancesOverDue: { count: 0, value: 0 },
      claimsWithPolicyExceptions: { count: 0, value: 0 },
      claimsWithoutSupportings: { count: 0, value: 0 },
      myRejectedApplications: { count: 0, value: 0 },
    },
    expenseAnalysis: {
      myCardStatements: { count: 0, value: 0 },
      myExpenseBreakup: { categories: [] },
      myMajorExpenses: { count: 0, value: 0 },
      myCostDimension: { departments: [] },
    },
  };

  const displayData = reportData || defaultData;

  if (reportsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <Header />
        <main className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Reports</h1>
                <p className="text-gray-600">Comprehensive expense analytics and insights</p>
              </div>
              
              {/* Date Range Inputs */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Start Date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-32"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="text"
                  placeholder="End Date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-32"
                />
                <Button variant="outline">Filter</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Row 1 */}
              <ReportSection
                title="Pending Approval"
                data={displayData.pendingApproval}
                bgColor="bg-blue-100"
                textColor="text-blue-700"
              />
              <ReportSection
                title="Approved"
                data={displayData.approved}
                bgColor="bg-blue-100"
                textColor="text-blue-700"
              />
              <ReportSection
                title="Pending Payments"
                data={displayData.pendingPayments}
                bgColor="bg-teal-100"
                textColor="text-teal-700"
              />
              
              {/* Row 2 */}
              <ReportSection
                title="Paid"
                data={displayData.paid}
                bgColor="bg-teal-100"
                textColor="text-teal-700"
              />
              <WatchListSection data={displayData.watchList} />
              <ExpenseAnalysisSection data={displayData.expenseAnalysis} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}