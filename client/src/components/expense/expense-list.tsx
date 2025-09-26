import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";

interface ExpenseListProps {
  claims: any[];
  isLoading: boolean;
  showUserInfo?: boolean;
  "data-testid"?: string;
}

export default function ExpenseList({ 
  claims, 
  isLoading, 
  showUserInfo = true,
  "data-testid": testId,
}: ExpenseListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  const updateStatusMutation = useMutation({
    mutationFn: async ({ claimId, status }: { claimId: string; status: string }) => {
      await apiRequest("PATCH", `/api/expense-claims/${claimId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Expense claim status updated successfully",
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
        description: "Failed to update expense claim status",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "paid":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const canManageStatus = user?.role === "admin" || user?.role === "accountant";

  const filterClaims = (status: string) => {
    if (status === "all") return claims;
    return claims.filter(claim => claim.status === status);
  };

  const getStatusCounts = () => {
    return {
      all: claims.length,
      pending: claims.filter(c => c.status === "pending").length,
      approved: claims.filter(c => c.status === "approved").length,
      rejected: claims.filter(c => c.status === "rejected").length,
      paid: claims.filter(c => c.status === "paid").length,
    };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <Card data-testid={testId}>
        <CardContent className="py-8">
          <div className="text-center">Loading expense claims...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>Expense Claims</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({statusCounts.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({statusCounts.rejected})
            </TabsTrigger>
            <TabsTrigger value="paid" data-testid="tab-paid">
              Paid ({statusCounts.paid})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" data-testid="content-all">
            <ExpenseClaimsList 
              claims={filterClaims("all")}
              showUserInfo={showUserInfo}
              canManageStatus={canManageStatus}
              updateStatusMutation={updateStatusMutation}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              getInitials={getInitials}
            />
          </TabsContent>

          <TabsContent value="pending" data-testid="content-pending">
            <ExpenseClaimsList 
              claims={filterClaims("pending")}
              showUserInfo={showUserInfo}
              canManageStatus={canManageStatus}
              updateStatusMutation={updateStatusMutation}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              getInitials={getInitials}
            />
          </TabsContent>

          <TabsContent value="approved" data-testid="content-approved">
            <ExpenseClaimsList 
              claims={filterClaims("approved")}
              showUserInfo={showUserInfo}
              canManageStatus={canManageStatus}
              updateStatusMutation={updateStatusMutation}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              getInitials={getInitials}
            />
          </TabsContent>

          <TabsContent value="rejected" data-testid="content-rejected">
            <ExpenseClaimsList 
              claims={filterClaims("rejected")}
              showUserInfo={showUserInfo}
              canManageStatus={canManageStatus}
              updateStatusMutation={updateStatusMutation}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              getInitials={getInitials}
            />
          </TabsContent>

          <TabsContent value="paid" data-testid="content-paid">
            <ExpenseClaimsList 
              claims={filterClaims("paid")}
              showUserInfo={showUserInfo}
              canManageStatus={canManageStatus}
              updateStatusMutation={updateStatusMutation}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              getInitials={getInitials}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ExpenseClaimsList({ 
  claims, 
  showUserInfo, 
  canManageStatus, 
  updateStatusMutation,
  getStatusColor,
  getStatusIcon,
  getInitials,
}: {
  claims: any[];
  showUserInfo: boolean;
  canManageStatus: boolean;
  updateStatusMutation: any;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getInitials: (firstName?: string, lastName?: string) => string;
}) {
  if (claims.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500" data-testid="text-no-claims">No expense claims found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim: any) => (
        <div
          key={claim.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          data-testid={`claim-item-${claim.id}`}
        >
          <div className="flex items-center gap-4">
            {showUserInfo && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-gradient-to-r from-blue-500 to-purple-600">
                {getInitials(claim.user?.firstName, claim.user?.lastName)}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900" data-testid={`text-claim-title-${claim.id}`}>
                {claim.title}
              </p>
              <p className="text-sm text-gray-600">
                {showUserInfo && `${claim.user?.firstName} ${claim.user?.lastName} • `}
                ₹{claim.totalAmount}
              </p>
              <p className="text-xs text-gray-500">
                Submitted: {new Date(claim.submittedAt || claim.createdAt).toLocaleDateString('en-GB')}
                {claim.approvedAt && ` • Approved: ${new Date(claim.approvedAt).toLocaleDateString('en-GB')}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(claim.status)} data-testid={`status-${claim.id}`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(claim.status)}
                {claim.status}
              </span>
            </Badge>
            
            {canManageStatus && claim.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                  onClick={() => updateStatusMutation.mutate({ claimId: claim.id, status: "approved" })}
                  disabled={updateStatusMutation.isPending}
                  data-testid={`button-approve-${claim.id}`}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => updateStatusMutation.mutate({ claimId: claim.id, status: "rejected" })}
                  disabled={updateStatusMutation.isPending}
                  data-testid={`button-reject-${claim.id}`}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {claims.length > 5 && (
        <div className="pt-4 text-center">
          <Button variant="ghost" className="text-blue-600 hover:text-blue-800" data-testid="button-view-all">
            View all {claims.length} expense claims
          </Button>
        </div>
      )}
    </div>
  );
}
