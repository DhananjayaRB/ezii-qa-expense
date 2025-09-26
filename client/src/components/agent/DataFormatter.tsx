import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Building2, User, Calendar, DollarSign, FileText, CreditCard, Receipt } from "lucide-react";

interface DataFormatterProps {
  data: any;
}

export function DataFormatter({ data }: DataFormatterProps) {
  if (!data) return null;

  // Handle arrays of data
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <p className="text-sm text-muted-foreground italic">No data available</p>;
    }

    // Detect data type based on first item properties
    const firstItem = data[0];
    
    // Vendors
    if (firstItem.name && firstItem.contactPerson !== undefined) {
      return (
        <div className="space-y-2">
          {data.map((vendor: any, idx: number) => (
            <Card key={vendor.id || idx} className="p-3 overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <Building2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{vendor.name}</h4>
                    {vendor.contactPerson && (
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <User className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{vendor.contactPerson}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">₹{vendor.totalPaid || '0'}</p>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // Expense Claims
    if (firstItem.status && (firstItem.totalAmount !== undefined || firstItem.amount !== undefined)) {
      return (
        <div className="space-y-2">
          {data.map((claim: any, idx: number) => (
            <Card key={claim.id || idx} className="p-3 overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <Receipt className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{claim.title || claim.description || `Claim #${claim.id?.slice(-8)}`}</h4>
                    {claim.createdAt && (
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{new Date(claim.createdAt).toLocaleDateString()}</span>
                      </p>
                    )}
                    {claim.employeeName && (
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <User className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{claim.employeeName}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1 flex-shrink-0">
                  <p className="text-sm font-medium whitespace-nowrap">₹{claim.totalAmount || claim.amount || '0'}</p>
                  <Badge 
                    variant={claim.status === 'pending' ? 'secondary' : 
                             claim.status === 'approved' ? 'default' : 
                             claim.status === 'rejected' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {claim.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // Payment Batches
    if (firstItem.batchNumber || firstItem.totalAmount) {
      return (
        <div className="space-y-2">
          {data.map((batch: any, idx: number) => (
            <Card key={batch.id || idx} className="p-3 overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <CreditCard className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">
                      {batch.batchNumber ? `Batch #${batch.batchNumber}` : `Payment Batch`}
                    </h4>
                    {batch.createdAt && (
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{new Date(batch.createdAt).toLocaleDateString()}</span>
                      </p>
                    )}
                    {batch.itemCount && (
                      <p className="text-xs text-muted-foreground truncate">
                        {batch.itemCount} items
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1 flex-shrink-0">
                  <p className="text-sm font-medium whitespace-nowrap">₹{batch.totalAmount || '0'}</p>
                  <Badge 
                    variant={batch.status === 'pending' ? 'secondary' : 
                             batch.status === 'approved' ? 'default' : 
                             batch.status === 'processed' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {batch.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // Users
    if (firstItem.email || firstItem.role) {
      return (
        <div className="space-y-2">
          {data.map((user: any, idx: number) => (
            <Card key={user.id || idx} className="p-3 overflow-hidden">
              <div className="flex items-start space-x-3 min-w-0">
                <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm truncate">{user.name || user.email}</h4>
                  {user.email && user.name && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                  {user.role && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {user.role}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // Generic list fallback
    return (
      <div className="space-y-2">
        {data.map((item: any, idx: number) => (
          <Card key={item.id || idx} className="p-3">
            <div className="space-y-1">
              {Object.entries(item).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{key}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Handle single objects
  if (typeof data === 'object') {
    return (
      <Card className="p-3">
        <div className="space-y-1">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-muted-foreground capitalize">{key}:</span>
              <span className="font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Handle primitives
  return <p className="text-sm">{String(data)}</p>;
}