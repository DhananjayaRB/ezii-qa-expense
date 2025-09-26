import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { BarChart3, PieChart as PieIcon, Circle } from "lucide-react";
import { useState } from "react";

interface CategoryBreakdownWidgetProps {
  data: {
    categoryId: string | null;
    categoryName: string | null;
    total: number;
    count: number;
  }[];
}

const COLORS = [
  '#FF6B9D', // Pink
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Mint
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Seafoam
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
  '#F8C471', // Orange
  '#82E0AA'  // Light Green
];

export function CategoryBreakdownWidget({ data }: CategoryBreakdownWidgetProps) {
  const [chartType, setChartType] = useState<'pie' | 'donut' | 'bar'>('donut');
  
  // Handle undefined data to prevent runtime errors
  const chartData = (data || [])
    .filter(item => {
      const hasName = item.categoryName && item.categoryName.trim() !== '';
      const numericTotal = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
      const hasAmount = numericTotal > 0;
      return hasName && hasAmount;
    })
    .slice(0, chartType === 'bar' ? 5 : 8)
    .map((item, index) => ({
      name: item.categoryName || 'Uncategorized',
      value: typeof item.total === 'string' ? parseFloat(item.total) : item.total,
      count: typeof item.count === 'string' ? parseInt(item.count) : item.count,
      fill: COLORS[index % COLORS.length],
      percentage: 0 // Will be calculated below
    }));
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate percentages
  chartData.forEach(item => {
    item.percentage = total > 0 ? (item.value / total) * 100 : 0;
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = data.percentage.toFixed(1);
      return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 border-0 rounded-xl shadow-2xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.fill }}
            />
            <p className="font-semibold text-white">{data.name}</p>
          </div>
          <p className="text-lg font-bold text-white mb-1">
            ₹{data.value.toLocaleString('en-IN')}
          </p>
          <div className="flex justify-between text-sm text-gray-300">
            <span>{percentage}% of total</span>
            <span>{data.count} claims</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const topCategory = chartData.length > 0 ? chartData[0] : null;

  return (
    <Card className="h-full bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-sm hover:shadow-md transition-shadow" data-testid="widget-category-breakdown">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
              Expense Categories
            </span>
          </div>
          <Select value={chartType} onValueChange={(value: 'pie' | 'donut' | 'bar') => setChartType(value)}>
            <SelectTrigger className="w-20 text-xs" data-testid="select-category-chart-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="donut" className="flex items-center gap-2">
                <Circle className="h-3 w-3" />
                Donut Chart
              </SelectItem>
              <SelectItem value="pie" className="flex items-center gap-2">
                <PieIcon className="h-3 w-3" />
                Pie Chart
              </SelectItem>
              <SelectItem value="bar" className="flex items-center gap-2">
                <BarChart3 className="h-3 w-3" />
                Bar Chart
              </SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {chartData.length > 0 ? (
          <>
            <div className="h-44 md:h-48">
              <ResponsiveContainer width="100%" height="100%">
                {(chartType === 'pie' || chartType === 'donut') ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius="85%"
                      innerRadius={chartType === 'donut' ? "35%" : 0}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill}
                          className="hover:opacity-80 transition-opacity duration-200"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3E8FF" />
                    <XAxis 
                      type="number"
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      fontSize={10}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280' }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      fontSize={10}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280' }}
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {chartData.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white/50 rounded-md">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.percentage.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-8 w-8 text-purple-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No expense data available</p>
          </div>
        )}
        {chartData.length > 0 && (
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">
              💰 Total: <span className="font-semibold text-purple-600 text-base">₹{total.toLocaleString('en-IN')}</span> 
              across <span className="font-semibold text-pink-600">{chartData.length} categories</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}