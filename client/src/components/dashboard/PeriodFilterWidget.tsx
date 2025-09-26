import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, TrendingUp } from "lucide-react";
import { useState } from "react";

interface PeriodFilterWidgetProps {
  onPeriodChange: (period: string) => void;
  currentPeriod: string;
  totalExpenses: number;
  previousPeriodExpenses: number;
}

const PERIOD_OPTIONS = [
  { value: 'thismonth', label: 'This Month', icon: '📅' },
  { value: 'lastmonth', label: 'Last Month', icon: '⏪' },
  { value: 'last3months', label: 'Last 3 Months', icon: '📊' },
  { value: 'last6months', label: 'Last 6 Months', icon: '📈' },
  { value: 'thisyear', label: 'This Year', icon: '🗓️' },
  { value: 'lastyear', label: 'Last Year', icon: '📆' }
];

export function PeriodFilterWidget({ 
  onPeriodChange, 
  currentPeriod, 
  totalExpenses, 
  previousPeriodExpenses 
}: PeriodFilterWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    onPeriodChange(period);
  };

  const currentOption = PERIOD_OPTIONS.find(opt => opt.value === selectedPeriod) || PERIOD_OPTIONS[3];
  const percentChange = previousPeriodExpenses > 0 
    ? ((totalExpenses - previousPeriodExpenses) / previousPeriodExpenses * 100).toFixed(1)
    : '0';
  const isIncrease = totalExpenses > previousPeriodExpenses;

  return (
    <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Filter className="h-3 w-3 text-green-600" />
          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
            Period Filter
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Select Period</label>
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full bg-white/80 border-green-200">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white/50 p-2 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-gray-700">{currentOption.label}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Expenses:</span>
                <span className="font-bold text-green-600">₹{totalExpenses.toLocaleString('en-IN')}</span>
              </div>
              {previousPeriodExpenses > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">vs Previous:</span>
                  <div className={`flex items-center gap-1 text-xs ${
                    isIncrease ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    {isIncrease ? '+' : ''}{percentChange}%
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/30 p-2 rounded">
              <p className="text-xs text-gray-500">Quick</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs p-1 h-auto"
                onClick={() => handlePeriodChange('thismonth')}
              >
                This Month
              </Button>
            </div>
            <div className="bg-white/30 p-2 rounded">
              <p className="text-xs text-gray-500">Compare</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs p-1 h-auto"
                onClick={() => handlePeriodChange('last3months')}
              >
                3 Months
              </Button>
            </div>
            <div className="bg-white/30 p-2 rounded">
              <p className="text-xs text-gray-500">Yearly</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs p-1 h-auto"
                onClick={() => handlePeriodChange('thisyear')}
              >
                This Year
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}