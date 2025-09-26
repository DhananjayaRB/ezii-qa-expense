import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

interface MonthlyInsightsWidgetProps {
  data: {
    month: string;
    total: number;
    count: number;
  }[];
  period: string;
}

const GRADIENT_COLORS = [
  '#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
];

export function MonthlyInsightsWidget({ data, period }: MonthlyInsightsWidgetProps) {
  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-GB', { month: 'short' });
  };

  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);
  const avgMonthly = totalAmount / (data.length || 1);
  const highestMonth = data.reduce((max, item) => item.total > max.total ? item : max, data[0] || { total: 0, month: '', count: 0 });
  const lowestMonth = data.reduce((min, item) => item.total < min.total ? item : min, data[0] || { total: 0, month: '', count: 0 });

  const chartData = data.map((item, index) => ({
    ...item,
    monthShort: formatMonth(item.month),
    color: GRADIENT_COLORS[index % GRADIENT_COLORS.length]
  }));

  const getPeriodLabel = () => {
    switch(period) {
      case 'thismonth': return 'This Month';
      case 'last3months': return 'Last 3 Months';
      case 'last6months': return 'Last 6 Months';
      case 'thisyear': return 'This Year';
      default: return 'Period';
    }
  };

  return (
    <Card className="h-full bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-orange-600" />
          <span className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent font-bold">
            Monthly Insights - {getPeriodLabel()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/50 p-3 rounded-lg text-center">
            <DollarSign className="h-5 w-5 text-orange-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-600">₹{(avgMonthly / 1000).toFixed(0)}k</p>
            <p className="text-xs text-gray-600">Avg Monthly</p>
          </div>
          
          <div className="bg-white/50 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {highestMonth.total > lowestMonth.total ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-lg font-bold text-gray-700">{data.length}</p>
            <p className="text-xs text-gray-600">Months Tracked</p>
          </div>
        </div>

        <div className="h-32 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis 
                dataKey="monthShort" 
                fontSize={10}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Bar 
                dataKey="total" 
                radius={[3, 3, 0, 0]}
                fill="#8884d8"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-green-600" />
              <span className="text-sm font-medium">Lowest</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">₹{(lowestMonth.total / 1000).toFixed(0)}k</p>
              <p className="text-xs text-gray-500">{formatMonth(lowestMonth.month)}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-red-600" />
              <span className="text-sm font-medium">Highest</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-red-600">₹{(highestMonth.total / 1000).toFixed(0)}k</p>
              <p className="text-xs text-gray-500">{formatMonth(highestMonth.month)}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 text-center">
          <p className="text-sm text-gray-600">
            📊 Total: <span className="font-semibold text-orange-600">₹{totalAmount.toLocaleString('en-IN')}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}