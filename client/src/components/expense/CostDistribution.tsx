import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { filterDataService, FilterTypeItem } from "@/services/filterDataService";

export interface CostDistributionItem {
  id: string;
  costCenterId: string;
  costCenterName: string;
  costCenterType: string;
  amount: string;
}

interface CostCenterConfig {
  id: string;
  name: string;
  type: string;
}

interface CostDistributionProps {
  totalAmount: number;
  distributions: CostDistributionItem[];
  onDistributionsChange: (distributions: CostDistributionItem[]) => void;
  costCenterConfig: CostCenterConfig[];
}

export default function CostDistribution({
  totalAmount,
  distributions,
  onDistributionsChange,
  costCenterConfig,
}: CostDistributionProps) {
  const [distributedTotal, setDistributedTotal] = useState(0);

  // Create a map of config name to config for easy lookup
  const configMap = costCenterConfig.reduce((acc, config) => {
    acc[config.name.toLowerCase()] = config;
    return acc;
  }, {} as Record<string, CostCenterConfig>);

  // Track which cost center types are being used to fetch their values
  const activeTypes = distributions.map(dist => dist.costCenterType).filter(Boolean);
  const uniqueActiveTypes = activeTypes.filter((type, index, arr) => arr.indexOf(type) === index);

  // Get the cost center config data
  const { data: costCenterConfigData } = useQuery({
    queryKey: ['/api/cost-center-config'],
  });

  // Fetch cost center values for active types using external API
  const costCenterQueries = useQuery({
    queryKey: ['external-cost-center-values', uniqueActiveTypes],
    queryFn: async () => {
      const results: Record<string, FilterTypeItem[]> = {};
      
      // First get all available filter types
      const filterTypes = await filterDataService.getFilterTypes();
      
      for (const typeName of uniqueActiveTypes) {
        // Find the filter type by name to get its ID (case-insensitive match)
        const filterType = filterTypes.find(ft => ft.name.toLowerCase() === typeName.toLowerCase());
        if (filterType) {
          // Get the values for this filter type using external API
          const values = await filterDataService.getFilterTypeValues(filterType.id);
          results[typeName] = values;
        }
      }
      return results;
    },
    enabled: uniqueActiveTypes.length > 0,
  });

  // Calculate distributed total whenever distributions change
  useEffect(() => {
    const total = distributions.reduce((sum, dist) => sum + parseFloat(dist.amount || '0'), 0);
    setDistributedTotal(total);
  }, [distributions]);

  const addDistribution = () => {
    const newDistribution: CostDistributionItem = {
      id: `dist_${Date.now()}`,
      costCenterId: '',
      costCenterName: '',
      costCenterType: '',
      amount: '',
    };
    onDistributionsChange([...distributions, newDistribution]);
  };

  const updateDistribution = (id: string, field: keyof CostDistributionItem, value: string) => {
    const updated = distributions.map((dist) =>
      dist.id === id ? { ...dist, [field]: value } : dist
    );
    onDistributionsChange(updated);
  };

  const updateDistributionSelection = (id: string, costCenterId: string, costCenterName: string, costCenterType: string) => {
    const updated = distributions.map((dist) =>
      dist.id === id ? { ...dist, costCenterId, costCenterName, costCenterType } : dist
    );
    onDistributionsChange(updated);
  };

  const handleTypeChange = (distributionId: string, selectedTypeName: string) => {
    const updated = distributions.map((dist) =>
      dist.id === distributionId 
        ? { 
            ...dist, 
            costCenterType: selectedTypeName,
            // Reset cost center selection when type changes
            costCenterId: '',
            costCenterName: ''
          } 
        : dist
    );
    onDistributionsChange(updated);
  };

  const handleCenterChange = (distributionId: string, costCenterId: string) => {
    const distribution = distributions.find(d => d.id === distributionId);
    if (!distribution || !costCenterQueries.data) return;
    
    const values = costCenterQueries.data[distribution.costCenterType] || [];
    const selectedOption = values.find(option => option.id === costCenterId);
    
    if (selectedOption) {
      updateDistributionSelection(
        distributionId,
        costCenterId,
        selectedOption.name,
        distribution.costCenterType
      );
    }
  };

  const removeDistribution = (id: string) => {
    const filtered = distributions.filter((dist) => dist.id !== id);
    onDistributionsChange(filtered);
  };

  const remainingAmount = totalAmount - distributedTotal;
  const isValidDistribution = Math.abs(remainingAmount) < 0.01; // Allow for small floating point differences

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-orange-700">
          Cost Distribution
        </CardTitle>
        <div className="flex justify-between text-sm">
          <span>Total Amount: ₹{totalAmount.toFixed(2)}</span>
          <span className={remainingAmount === 0 ? "text-green-600" : "text-red-600"}>
            Remaining: ₹{remainingAmount.toFixed(2)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {distributions.map((distribution, index) => (
          <div key={distribution.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Cost Center Type
              </Label>
              <Select
                value={distribution.costCenterType}
                onValueChange={(value) => handleTypeChange(distribution.id, value)}
                data-testid={`select-cost-center-type-${index}`}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {costCenterConfig.map((config) => (
                    <SelectItem key={config.id} value={config.name.toLowerCase()}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                {distribution.costCenterType ? 
                  distribution.costCenterType.charAt(0).toUpperCase() + distribution.costCenterType.slice(1) 
                  : 'Cost Center'
                }
              </Label>
              <Select
                value={distribution.costCenterId}
                onValueChange={(value) => handleCenterChange(distribution.id, value)}
                disabled={!distribution.costCenterType}
                data-testid={`select-cost-center-value-${index}`}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${distribution.costCenterType || 'cost center'}`} />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    if (!distribution.costCenterType || !costCenterQueries.data) {
                      return [];
                    }
                    const options = costCenterQueries.data[distribution.costCenterType] || [];
                    return options.map((option: FilterTypeItem) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
              {distribution.costCenterType && costCenterQueries.isLoading && (
                <p className="text-xs text-gray-500 mt-1">Loading options...</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Amount (₹)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={totalAmount}
                value={distribution.amount}
                onChange={(e) => updateDistribution(distribution.id, 'amount', e.target.value)}
                placeholder="0.00"
                data-testid={`input-amount-${index}`}
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeDistribution(distribution.id)}
                disabled={distributions.length === 1}
                className="text-red-600 hover:text-red-700"
                data-testid={`button-remove-${index}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDistribution}
            className="flex items-center gap-2"
            data-testid="button-add-distribution"
          >
            <Plus className="w-4 h-4" />
            Add Cost Center
          </Button>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Distributed: ₹{distributedTotal.toFixed(2)} / ₹{totalAmount.toFixed(2)}
            </div>
            {!isValidDistribution && (
              <Alert className="mt-2">
                <AlertDescription className="text-sm">
                  {remainingAmount > 0 
                    ? `₹${remainingAmount.toFixed(2)} still needs to be distributed`
                    : `₹${Math.abs(remainingAmount).toFixed(2)} over-distributed`
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}