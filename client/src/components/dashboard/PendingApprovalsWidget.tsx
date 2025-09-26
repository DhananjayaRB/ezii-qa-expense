import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, User, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface PendingClaim {
  id: string;
  title: string;
  totalAmount?: string;
  estimatedAmount?: string; // For expense requests
  user?: {
    name: string;
    firstName?: string;
    lastName?: string;
  };
  userName?: string; // Alternative user name field
  submittedAt: string;
  type?: 'claim' | 'request' | 'vendor_onboarding';
}

interface PendingApprovalsWidgetProps {
  count: number;
}

export function PendingApprovalsWidget({ count }: PendingApprovalsWidgetProps) {
  // Fetch actual pending claims for display
  const { data: pendingClaims, isLoading } = useQuery<PendingClaim[]>({
    queryKey: ['/api/expense-claims/pending-approval'],
    enabled: count > 0,
  });

  return (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow" data-testid="widget-pending-approvals">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Approvals
          </div>
          {count > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Action Needed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xl font-bold text-orange-600" data-testid="pending-count">
              {count}
            </div>
            <p className="text-sm text-muted-foreground">
              Requests awaiting approval
            </p>
          </div>
          {count > 0 && (
            <Link href="/approvals">
              <a className="text-xs text-primary hover:underline" data-testid="link-view-approvals">
                View All →
              </a>
            </Link>
          )}
        </div>

        {count === 0 && (
          <div className="text-center py-4">
            <div className="text-green-600 text-2xl">✓</div>
            <p className="text-sm text-muted-foreground mt-2">All caught up!</p>
          </div>
        )}

        {count > 0 && !isLoading && pendingClaims && pendingClaims.length > 0 && (
          <div className="space-y-2 min-h-[22rem] sm:min-h-[24rem]">
            {pendingClaims.slice(0, 8).map((claim) => {
              // Get user name from different possible fields
              const userName = claim.user?.name || 
                              claim.userName || 
                              (claim.user?.firstName && claim.user?.lastName ? 
                                `${claim.user.firstName} ${claim.user.lastName}` : 
                                claim.user?.firstName || 'Unknown');
              
              // Get amount from different possible fields (claims vs requests)
              const amount = claim.totalAmount || claim.estimatedAmount || '0';
              const numericAmount = Number(amount) || 0;
              
              return (
                <div key={claim.id} className="p-2.5 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                      {claim.title}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-16">{userName}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        <span>₹{numericAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {pendingClaims.length > 8 && (
              <div className="text-center pt-0.5">
                <Link href="/approvals">
                  <a className="text-xs text-gray-500 hover:text-primary">
                    +{pendingClaims.length - 8} more...
                  </a>
                </Link>
              </div>
            )}
          </div>
        )}

        {count > 0 && isLoading && (
          <div className="text-center py-4">
            <div className="text-xs text-gray-500">Loading claims...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}