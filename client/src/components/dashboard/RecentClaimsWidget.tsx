import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Clock } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface RecentClaimsWidgetProps {
  claims: {
    id: string;
    title: string;
    totalAmount: string;
    status: string;
    createdAt: Date | null;
  }[];
}

export function RecentClaimsWidget({ claims }: RecentClaimsWidgetProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="h-full" data-testid="widget-recent-claims">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Recent Claims
          </div>
          <Link href="/employee/claim">
            <span className="text-xs text-primary hover:underline cursor-pointer" data-testid="link-create-claim">
              Create New →
            </span>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {claims.length > 0 ? (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0" data-testid={`claim-item-${claim.id}`}>
                <div className="flex-1">
                  <p className="font-medium text-sm truncate" title={claim.title}>
                    {claim.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      ₹{parseFloat(claim.totalAmount).toLocaleString('en-IN')}
                    </span>
                    {claim.createdAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(claim.createdAt), 'dd-MM-yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(claim.status)}>
                  {claim.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent claims</p>
            <Link href="/employee/claim">
              <span className="text-xs text-primary hover:underline mt-1 inline-block cursor-pointer" data-testid="link-create-first-claim">
                Create your first claim →
              </span>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}