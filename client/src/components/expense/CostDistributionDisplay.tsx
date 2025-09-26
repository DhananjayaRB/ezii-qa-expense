import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { CostDistribution } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CostDistributionDisplayProps {
  claimId: string;
}

export default function CostDistributionDisplay({ claimId }: CostDistributionDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: costDistributions, isLoading } = useQuery<CostDistribution[]>({
    queryKey: [`/api/expense-claims/${claimId}/cost-distributions`],
    enabled: !!claimId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Loading cost distribution details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!costDistributions || costDistributions.length === 0) {
    return null; // Don't show anything if there are no cost distributions
  }

  const totalDistributed = costDistributions.reduce(
    (sum, dist) => sum + parseFloat(dist.amount), 
    0
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 hover:bg-gray-50 transition-colors">
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-orange-600">📊</span>
                Cost Distribution
                <Badge variant="secondary" className="ml-2">
                  ₹{totalDistributed.toLocaleString()}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {costDistributions.map((distribution, index) => (
                <div key={distribution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {distribution.costCenterType}
                    </Badge>
                    <span className="font-medium">{distribution.costCenterName}</span>
                  </div>
                  <span className="font-medium text-green-600">
                    ₹{parseFloat(distribution.amount).toLocaleString()}
                  </span>
                </div>
              ))}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium text-gray-700">Total Distributed:</span>
                <span className="font-semibold text-lg">
                  ₹{totalDistributed.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}