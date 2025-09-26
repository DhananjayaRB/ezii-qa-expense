import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, AreaChart as AreaIcon, BarChart3, TrendingUp as LineIcon, Waves } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { useState } from "react";

// Utility to create sinusoidal wave interpolation between data points
function interpolateSineSeries<T extends Record<string, any>>(
  data: T[], 
  keys: (keyof T)[], 
  samplesPerSegment: number = 12
): T[] {
  if (data.length < 2) return data;
  
  const result: T[] = [];
  
  for (let i = 0; i < data.length - 1; i++) {
    const current = data[i];
    const next = data[i + 1];
    
    // Add the current point
    result.push(current);
    
    // Generate interpolated points between current and next
    for (let sample = 1; sample < samplesPerSegment; sample++) {
      const t = sample / samplesPerSegment;
      // Cosine interpolation for sinusoidal waves: y(t) = yi + (yi+1 - yi) * (0.5 - 0.5 * cos(π * t))
      const factor = 0.5 - 0.5 * Math.cos(Math.PI * t);
      
      const interpolatedPoint = { ...current } as T;
      
      // Interpolate each specified key
      keys.forEach(key => {
        const currentValue = Number(current[key]) || 0;
        const nextValue = Number(next[key]) || 0;
        interpolatedPoint[key] = currentValue + (nextValue - currentValue) * factor;
      });
      
      // Interpolate the month for X-axis (linear interpolation for time)
      if (current.month && next.month) {
        const currentDate = new Date(current.month + '-01');
        const nextDate = new Date(next.month + '-01');
        const interpolatedTime = currentDate.getTime() + (nextDate.getTime() - currentDate.getTime()) * t;
        const interpolatedDate = new Date(interpolatedTime);
        interpolatedPoint.month = interpolatedDate.toISOString().slice(0, 7);
      }
      
      result.push(interpolatedPoint);
    }
  }
  
  // Add the final point
  result.push(data[data.length - 1]);
  
  return result;
}

interface ExpenseTrendsWidgetProps {
  data: {
    month: string;
    total: number;
    count: number;
    userCount?: number; // New field for unique users per month
    avgPerUser?: number; // New field for average amount per user
  }[];
}

export function ExpenseTrendsWidget({ data }: ExpenseTrendsWidgetProps) {
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar' | 'wave'>('wave');
  
  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };

  // Add sample data for wave demonstration if insufficient data exists
  const enhancedData = data.length < 2 && chartType === 'wave' ? [
    { month: '2025-03', total: 45000, count: 8, userCount: 3, avgPerUser: 15000 },
    { month: '2025-04', total: 62000, count: 12, userCount: 4, avgPerUser: 15500 },
    { month: '2025-05', total: 38000, count: 6, userCount: 2, avgPerUser: 19000 },
    { month: '2025-06', total: 78000, count: 15, userCount: 5, avgPerUser: 15600 },
    { month: '2025-07', total: 51000, count: 9, userCount: 3, avgPerUser: 17000 },
    ...data // Include actual data at the end
  ] : data;

  // Prepare data for sinusoidal waves (wave chart only)
  const waveData = chartType === 'wave' 
    ? interpolateSineSeries(enhancedData, ['total', 'userCount', 'avgPerUser'], 8)
    : data;
  
  // Get original monthly anchor points for X-axis ticks
  const monthlyAnchors = enhancedData.map(d => d.month);

  const currentMonth = data[data.length - 1]?.total || 0;
  const previousMonth = data[data.length - 2]?.total || 0;
  const trend = currentMonth > previousMonth ? 'up' : 'down';
  const trendPercentage = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth * 100).toFixed(1) : '0';

  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);
  const totalClaims = data.reduce((sum, item) => sum + item.count, 0);
  const avgMonthlyAmount = totalAmount / (data.length || 1);
  
  // Calculate wave-specific metrics
  const uniqueUsers = [...new Set(data.flatMap(item => item.userCount ? [item.userCount] : []))].length;
  const totalUsers = data.reduce((sum, item) => sum + (item.userCount || 0), 0);
  const avgUsersPerMonth = totalUsers / (data.length || 1);
  const avgAmountPerUser = totalUsers > 0 ? totalAmount / totalUsers : 0;

  return (
    <Card className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200" data-testid="widget-expense-trends">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
              Expense Trends
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Select value={chartType} onValueChange={(value: 'area' | 'line' | 'bar' | 'wave') => setChartType(value)}>
              <SelectTrigger className="w-32 h-8 text-xs" data-testid="select-chart-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area" className="flex items-center gap-2">
                  <AreaIcon className="h-3 w-3" />
                  Area Chart
                </SelectItem>
                <SelectItem value="line" className="flex items-center gap-2">
                  <LineIcon className="h-3 w-3" />
                  Line Chart
                </SelectItem>
                <SelectItem value="bar" className="flex items-center gap-2">
                  <BarChart3 className="h-3 w-3" />
                  Bar Chart
                </SelectItem>
                <SelectItem value="wave" className="flex items-center gap-2">
                  <Waves className="h-3 w-3" />
                  Wave Chart
                </SelectItem>
              </SelectContent>
            </Select>
            <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
              trend === 'up' 
                ? 'text-red-600 bg-red-50 border border-red-200' 
                : 'text-green-600 bg-green-50 border border-green-200'
            }`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trendPercentage}%
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {chartType === 'wave' ? (
            <>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">₹{(totalAmount / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-500">Total Amount</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{Math.round(avgUsersPerMonth)}</p>
                <p className="text-xs text-gray-500">Avg Users/Month</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">₹{(avgAmountPerUser / 1000).toFixed(1)}k</p>
                <p className="text-xs text-gray-500">Avg/Person</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">₹{(totalAmount / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-500">Total Expenses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{totalClaims}</p>
                <p className="text-xs text-gray-500">Total Claims</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">₹{(avgMonthlyAmount / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-500">Avg Monthly</p>
              </div>
            </>
          )}
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' && (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  labelFormatter={(label) => formatMonth(label)}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#colorExpense)"
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 5, stroke: "#FFFFFF" }}
                  activeDot={{ r: 7, stroke: "#3B82F6", strokeWidth: 2, fill: "#FFFFFF" }}
                />
              </AreaChart>
            )}
            
            {chartType === 'line' && (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  labelFormatter={(label) => formatMonth(label)}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6, stroke: "#FFFFFF" }}
                  activeDot={{ r: 8, stroke: "#3B82F6", strokeWidth: 2, fill: "#FFFFFF" }}
                />
              </LineChart>
            )}
            
            {chartType === 'bar' && (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  labelFormatter={(label) => formatMonth(label)}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}

            {chartType === 'wave' && (
              <LineChart data={waveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" opacity={0.6} />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                  ticks={monthlyAnchors}
                />
                <YAxis 
                  yAxisId="amount"
                  orientation="left"
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  yAxisId="count"
                  orientation="right"
                  tickFormatter={(value) => `${Math.round(value)}`}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'People') return [`${Math.round(value)} people`, 'People'];
                    if (name === 'Avg/Person') return [`₹${Math.round(value).toLocaleString('en-IN')}`, 'Avg per Person'];
                    return [`₹${Math.round(value).toLocaleString('en-IN')}`, 'Total Amount'];
                  }}
                  labelFormatter={(label) => {
                    // Show nearest month for interpolated points
                    const month = monthlyAnchors.find(anchor => {
                      const anchorDate = new Date(anchor + '-01');
                      const labelDate = new Date(label + '-01');
                      const timeDiff = Math.abs(anchorDate.getTime() - labelDate.getTime());
                      return timeDiff < 15 * 24 * 60 * 60 * 1000; // Within 15 days
                    });
                    return formatMonth(month || label);
                  }}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                
                {/* Sinusoidal Wave 1: Total Amount - Blue */}
                <Line 
                  yAxisId="amount"
                  type="linear" 
                  dataKey="total" 
                  stroke="#3B82F6"
                  strokeWidth={4}
                  strokeOpacity={0.9}
                  strokeLinecap="round"
                  name="Total Amount"
                  dot={false}
                  activeDot={false}
                />
                
                {/* Sinusoidal Wave 2: User Count - Green */}
                <Line 
                  yAxisId="count"
                  type="linear" 
                  dataKey="userCount" 
                  stroke="#10B981"
                  strokeWidth={4}
                  strokeOpacity={0.9}
                  strokeLinecap="round"
                  name="People"
                  dot={false}
                  activeDot={false}
                />
                
                {/* Sinusoidal Wave 3: Average per User - Purple */}
                <Line 
                  yAxisId="amount"
                  type="linear" 
                  dataKey="avgPerUser" 
                  stroke="#8B5CF6"
                  strokeWidth={4}
                  strokeOpacity={0.9}
                  strokeLinecap="round"
                  name="Avg/Person"
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-center">
          {chartType === 'wave' ? (
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-center items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                  <span>Total Amount</span>
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-green-500 rounded"></div>
                  <span>People Count</span>
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-purple-500 rounded"></div>
                  <span>Avg/Person</span>
                </span>
              </div>
              <p className="text-gray-500">
                Wave trends showing spending patterns and user participation
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              📊 Last 6 months • <span className="font-semibold text-blue-600">{totalClaims} total claims</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}