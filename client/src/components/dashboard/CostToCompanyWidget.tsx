import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Building2, DollarSign } from "lucide-react";

interface CostToCompanyWidgetProps {
  data: {
    employeeClaims: { total: number; count: number };
    directExpenses: { total: number; count: number };
    vendorPayments: { total: number; count: number };
    corporateCard: { total: number; count: number };
  };
}

const EXPENSE_SOURCES = [
  {
    key: 'employeeClaims',
    name: 'Employee Claims',
    icon: '👥',
    color: '#FF6B9D', // Pink
    description: 'Submitted by employees'
  },
  {
    key: 'directExpenses', 
    name: 'Direct Expenses',
    icon: '🏢',
    color: '#4ECDC4', // Teal
    description: 'Paid directly by company'
  },
  {
    key: 'vendorPayments',
    name: 'Vendor Payments', 
    icon: '🏪',
    color: '#45B7D1', // Blue
    description: 'Bills paid to vendors'
  },
  {
    key: 'corporateCard',
    name: 'Corporate Card',
    icon: '💳', 
    color: '#96CEB4', // Mint
    description: 'Company credit card purchases'
  }
];

export function CostToCompanyWidget({ data }: CostToCompanyWidgetProps) {
  // Convert data to chart format, filtering out zero values
  const chartData = EXPENSE_SOURCES
    .map(source => ({
      name: source.name,
      shortName: source.name.split(' ')[0], // First word only for chart labels
      value: (data as any)[source.key]?.total || 0,
      count: (data as any)[source.key]?.count || 0,
      fill: source.color,
      icon: source.icon,
      description: source.description,
      percentage: 0 // Will be calculated below
    }))
    .filter(item => item.value > 0); // Only show sources with actual spending

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate percentages
  chartData.forEach(item => {
    item.percentage = totalAmount > 0 ? (item.value / totalAmount) * 100 : 0;
  });

  const topSource = chartData.length > 0 ? chartData.reduce((max, item) => 
    item.value > max.value ? item : max, chartData[0]
  ) : null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 border-0 rounded-xl shadow-2xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{data.icon}</span>
            <p className="font-semibold text-white">{data.name}</p>
          </div>
          <p className="text-lg font-bold text-white mb-1">
            ₹{data.value.toLocaleString('en-IN')}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-300">
              <span>{data.percentage.toFixed(1)}% of total</span>
              <span>{data.count} transactions</span>
            </div>
            <p className="text-xs text-gray-400 italic">{data.description}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200" data-testid="widget-cost-to-company">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
            Overall Cost to Company
          </span>
        </CardTitle>
        {topSource && (
          <div className="text-sm text-gray-600">
            🏆 Largest: <span className="font-semibold" style={{ color: topSource.fill }}>
              {topSource.name} ({topSource.percentage.toFixed(0)}%)
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <div className="h-44 md:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius="85%"
                    innerRadius="35%"
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                    label={({ name, percentage }) => 
                      percentage > 10 ? `${name} ${percentage.toFixed(0)}%` : ''
                    }
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
              </ResponsiveContainer>
            </div>
            
            <div className="mt-3 space-y-3">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold" style={{ color: item.fill }}>
                      ₹{(item.value / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-gray-500">{item.percentage.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Building2 className="h-8 w-8 text-blue-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No expense data available</p>
            <p className="text-xs text-gray-400 mt-1">Check your expense claims and payments</p>
          </div>
        )}
        
        {chartData.length > 0 && (
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-gray-600">
                Total Company Cost: <span className="font-bold text-blue-600">₹{totalAmount.toLocaleString('en-IN')}</span>
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across {chartData.length} expense sources • {chartData.reduce((sum, item) => sum + item.count, 0)} total transactions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}