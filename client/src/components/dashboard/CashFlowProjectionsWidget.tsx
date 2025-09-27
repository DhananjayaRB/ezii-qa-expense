import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  BarChart3,
  Zap,
  Info
} from "lucide-react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";

interface CashFlowData {
  period: string;
  expenseAmount: number;
  directExpenseAmount: number;
  paymentAmount: number;
  totalOutflow: number;
  netCashFlow: number;
  isProjection?: boolean;
}

interface ProjectionResponse {
  method: string;
  projectionPeriod: number;
  projections: CashFlowData[];
  confidence: number;
  lastUpdated: string;
}

interface HistoricalResponse {
  data: CashFlowData[];
  summary: {
    totalExpenses: number;
    totalAmount: number;
    totalPayments: number;
    totalPaid: number;
  };
}

interface SummaryResponse {
  summary: {
    totalExpenses: number;
    totalAmount: number;
    totalPayments: number;
    totalPaid: number;
  };
  trends: {
    direction: string;
    strength: number;
    description: string;
    monthlyChange: number;
  };
  insights: Array<{
    type: string;
    message: string;
    value?: number;
    trend?: string;
  }>;
}

export function CashFlowProjectionsWidget() {
  const [timeFrame, setTimeFrame] = useState("last12months");
  const [projectionMonths, setProjectionMonths] = useState(6);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [combinedData, setCombinedData] = useState<CashFlowData[]>([]);

  // Fetch historical data
  const { data: historical, isLoading: historicalLoading } = useQuery<HistoricalResponse>({
    queryKey: ["/api/cash-flow/historical", timeFrame],
    retry: false,
  });

  // Fetch projections
  const { data: projections, isLoading: projectionsLoading } = useQuery<ProjectionResponse>({
    queryKey: ["/api/cash-flow/projections", projectionMonths],
    retry: false,
  });

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryResponse>({
    queryKey: ["/api/cash-flow/summary", timeFrame],
    retry: false,
  });

  // Combine historical and projection data
  useEffect(() => {
    if (historical?.data && projections?.projections) {
      const combined = [
        ...historical.data.map(d => ({ ...d, isProjection: false })),
        ...projections.projections
      ];
      setCombinedData(combined);
    } else if (historical?.data) {
      setCombinedData(historical.data.map(d => ({ ...d, isProjection: false })));
    }
  }, [historical, projections]);

  const isLoading = historicalLoading || projectionsLoading || summaryLoading;

  const formatPeriod = (period: string) => {
    if (period.includes('-Q')) {
      return period;
    }
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const getTrendIcon = (direction: string) => {
    if (direction === "increasing") return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (direction === "decreasing") return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (direction: string) => {
    if (direction === "increasing") return "text-red-600 bg-red-50";
    if (direction === "decreasing") return "text-green-600 bg-green-50";
    return "text-gray-600 bg-gray-50";
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatPeriod(label)}</p>
          {data.isProjection && (
            <Badge variant="outline" className="mb-2">Projected</Badge>
          )}
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              Expenses: {formatCurrency(data.expenseAmount)}
            </p>
            <p className="text-orange-600">
              Direct: {formatCurrency(data.directExpenseAmount)}
            </p>
            <p className="text-green-600">
              Payments: {formatCurrency(data.paymentAmount)}
            </p>
            <p className={`font-medium ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Net: {formatCurrency(data.netCashFlow)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            Cash Flow Projections
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading cash flow data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-96">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base" data-testid="cash-flow-title">
            <BarChart3 className="h-5 w-5" />
            Cash Flow Projections
          </CardTitle>
          <div className="flex gap-2">
            <Select value={timeFrame} onValueChange={setTimeFrame} data-testid="select-timeframe">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last3months">Last 3 Months</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
                <SelectItem value="last12months">Last 12 Months</SelectItem>
                <SelectItem value="currentyear">Current Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={projectionMonths.toString()} 
              onValueChange={(value) => setProjectionMonths(parseInt(value))}
              data-testid="select-projection-months"
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Total Expenses</span>
              </div>
              <p className="text-lg font-bold text-blue-900" data-testid="text-total-expenses">
                {formatCurrency(summary.summary.totalAmount)}
              </p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Total Payments</span>
              </div>
              <p className="text-lg font-bold text-green-900" data-testid="text-total-payments">
                {formatCurrency(summary.summary.totalPaid)}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                {getTrendIcon(summary.trends.direction)}
                <span className="text-sm text-gray-600 font-medium">Trend</span>
              </div>
              <p className={`text-sm font-medium ${getTrendColor(summary.trends.direction)}`}>
                {summary.trends.direction}
              </p>
            </div>

            {projections && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-purple-600 font-medium">Confidence</span>
                </div>
                <p className="text-lg font-bold text-purple-900" data-testid="text-confidence">
                  {Math.round(projections.confidence * 100)}%
                </p>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "chart" | "table")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart" data-testid="tab-chart">Chart View</TabsTrigger>
            <TabsTrigger value="table" data-testid="tab-table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-4">
            <div className="h-80">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedData}>
                    <defs>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={formatPeriod}
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      fontSize={12}
                    />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    
                    <Area
                      type="monotone"
                      dataKey="totalOutflow"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="url(#expenseGradient)"
                      fillOpacity={0.6}
                      name="Total Outflow"
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="netCashFlow"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Net Cash Flow"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Period</th>
                    <th className="text-right p-2">Expenses</th>
                    <th className="text-right p-2">Direct</th>
                    <th className="text-right p-2">Payments</th>
                    <th className="text-right p-2">Net Flow</th>
                    <th className="text-center p-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50" data-testid={`row-cash-flow-${index}`}>
                      <td className="p-2 font-medium">{formatPeriod(item.period)}</td>
                      <td className="p-2 text-right">{formatCurrency(item.expenseAmount)}</td>
                      <td className="p-2 text-right">{formatCurrency(item.directExpenseAmount)}</td>
                      <td className="p-2 text-right">{formatCurrency(item.paymentAmount)}</td>
                      <td className={`p-2 text-right font-medium ${item.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.netCashFlow)}
                      </td>
                      <td className="p-2 text-center">
                        {item.isProjection ? (
                          <Badge variant="outline" className="text-purple-600">Projected</Badge>
                        ) : (
                          <Badge variant="outline">Historical</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Insights */}
        {summary?.insights && summary.insights.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Key Insights
            </h4>
            <div className="space-y-2">
              {summary.insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg" data-testid={`insight-${index}`}>
                  <p className="text-sm text-blue-900">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}