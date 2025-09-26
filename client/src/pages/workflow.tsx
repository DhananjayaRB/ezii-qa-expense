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
import { Settings } from "lucide-react";

interface WorkflowStep {
  id: number;
  processName: string;
  isMandatory: boolean;
  initiatedBy: string;
}

const workflowSteps: WorkflowStep[] = [
  { id: 1, processName: "Requests", isMandatory: false, initiatedBy: "System" },
  { id: 2, processName: "Claims", isMandatory: false, initiatedBy: "System" },
  { id: 4, processName: "Bank Payment", isMandatory: false, initiatedBy: "System" },
  { id: 5, processName: "Cash Payment", isMandatory: true, initiatedBy: "System" },
  { id: 6, processName: "Vendor Bill", isMandatory: true, initiatedBy: "System" },
];

export default function Workflow() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  // Fetch workflow statistics
  const { data: requests = [] } = useQuery({
    queryKey: ["/api/expense-requests"],
    retry: false,
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["/api/expense-claims"],
    retry: false,
  });

  const { data: advances = [] } = useQuery({
    queryKey: ["/api/advance-payments"],
    retry: false,
  });

  const getProcessCount = (processName: string) => {
    switch (processName) {
      case "Requests":
        return requests.length;
      case "Claims":
        return claims.length;
      case "Bank Payment":
        return advances.filter((a: any) => a.paymentStatus === 'paid').length;
      case "Cash Payment":
        return claims.filter((c: any) => c.status === 'paid' && c.balancePayment > 0).length;
      case "Vendor Bill":
        return 0; // Placeholder for vendor bills
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="ml-60">
          <Header />
          <main className="bg-gray-50 dark:bg-gray-900 p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Loading...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Uniform Workflow
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage and configure your expense workflow processes
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Workflow Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Workflow ID
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Initiated By
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Process Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Is Mandatory
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Active Count
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {workflowSteps.map((step) => (
                        <tr
                          key={step.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="py-4 px-4 text-gray-900 dark:text-white">
                            {step.id}
                          </td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                            {step.initiatedBy}
                          </td>
                          <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">
                            {step.processName}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant={step.isMandatory ? "destructive" : "secondary"}
                              data-testid={`badge-mandatory-${step.id}`}
                            >
                              {step.isMandatory ? "Yes" : "No"}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" data-testid={`badge-count-${step.id}`}>
                              {getProcessCount(step.processName)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-configure-${step.id}`}
                            >
                              Configure
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Active Requests
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {requests.filter((r: any) => r.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Claims Processing
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {claims.filter((c: any) => c.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Pending Payments
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {advances.filter((a: any) => a.paymentStatus === 'pending').length + 
                         claims.filter((c: any) => c.status === 'approved' && c.balancePayment > 0).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Completed Today
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {advances.filter((a: any) => {
                          const paymentDate = new Date(a.paymentDate);
                          const today = new Date();
                          return paymentDate.toDateString() === today.toDateString();
                        }).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}