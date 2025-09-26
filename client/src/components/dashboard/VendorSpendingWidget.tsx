import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

interface VendorSpendingWidgetProps {
  data: {
    vendorId: string | null;
    vendorName: string | null;
    total: number;
    count: number;
  }[];
}

export function VendorSpendingWidget({ data }: VendorSpendingWidgetProps) {
  const maxAmount = Math.max(...data.map(item => item.total), 1);
  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="h-full" data-testid="widget-vendor-spending">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Top Vendors
          </div>
          <Link href="/vendors">
            <a className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-view-vendors">
              View All <ExternalLink className="h-3 w-3" />
            </a>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((vendor, index) => (
              <div key={vendor.vendorId || index} className="space-y-2" data-testid={`vendor-item-${vendor.vendorId}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex-1" title={vendor.vendorName || 'Unknown Vendor'}>
                    {vendor.vendorName || 'Unknown Vendor'}
                  </span>
                  <span className="text-muted-foreground">
                    ₹{vendor.total.toLocaleString('en-IN')}
                  </span>
                </div>
                <Progress 
                  value={(vendor.total / maxAmount) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{vendor.count} claims</span>
                  <span>{((vendor.total / totalAmount) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No vendor data available</p>
            <Link href="/vendors/claim">
              <a className="text-xs text-primary hover:underline mt-1 inline-block" data-testid="link-create-vendor-claim">
                Create vendor claim →
              </a>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}