import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";

interface TotalExpensesWidgetProps {
  totalExpenses: number;
  avgProcessingTime: number;
}

export function TotalExpensesWidget({ totalExpenses, avgProcessingTime }: TotalExpensesWidgetProps) {
  return (
    <Card className="h-full" data-testid="widget-total-expenses">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Total Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-bold text-primary" data-testid="total-amount">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </div>
            <p className="text-sm text-muted-foreground">
              All time total
            </p>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              <span className="text-sm font-medium">Avg Processing Time</span>
            </div>
            <div className="mt-1">
              <span className="text-lg font-semibold text-blue-600" data-testid="avg-processing-time">
                {Number(avgProcessingTime || 0).toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground ml-1">days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}