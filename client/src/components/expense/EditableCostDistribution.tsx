import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { CostDistribution } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Edit3, Save, X } from "lucide-react";
import { useState, useEffect } from "react";

interface EditableCostDistributionProps {
  claimId: string;
  totalAmount: number;
  onDistributionChange: (distributions: CostDistribution[]) => void;
}

export default function EditableCostDistribution({ 
  claimId, 
  totalAmount, 
  onDistributionChange 
}: EditableCostDistributionProps) {
  const [isOpen, setIsOpen] = useState(false); // Start collapsed, let users expand
  const [isEditing, setIsEditing] = useState(false);
  const [editedDistributions, setEditedDistributions] = useState<CostDistribution[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: originalDistributions, isLoading } = useQuery<CostDistribution[]>({
    queryKey: [`/api/expense-claims/${claimId}/cost-distributions`],
    enabled: !!claimId,
  });

  // Initialize edited distributions when original data loads
  useEffect(() => {
    if (originalDistributions && originalDistributions.length > 0 && editedDistributions.length === 0) {
      setEditedDistributions([...originalDistributions]);
    }
  }, [originalDistributions, editedDistributions.length]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Loading cost distribution details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!originalDistributions || originalDistributions.length === 0) {
    return null; // Don't show anything if there are no cost distributions
  }

  const originalTotal = originalDistributions.reduce(
    (sum, dist) => sum + parseFloat(dist.amount), 
    0
  );

  const editedTotal = editedDistributions.reduce(
    (sum, dist) => sum + parseFloat(dist.amount), 
    0
  );

  const handleAmountChange = (index: number, newAmount: string) => {
    const numericAmount = parseFloat(newAmount) || 0;
    const updated = [...editedDistributions];
    updated[index] = { ...updated[index], amount: numericAmount.toString() };
    setEditedDistributions(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (Math.abs(editedTotal - totalAmount) > 0.01) {
      alert(`Warning: Total distribution (₹${editedTotal.toLocaleString()}) doesn't match claim amount (₹${totalAmount.toLocaleString()})`);
      return;
    }
    
    // Add original amounts for transparency
    const distributionsWithOriginal = editedDistributions.map((dist, index) => ({
      ...dist,
      originalAmount: originalDistributions[index]?.amount || dist.amount
    }));
    
    onDistributionChange(distributionsWithOriginal);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditedDistributions([...originalDistributions]);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const distributionsToShow = isEditing ? editedDistributions : originalDistributions;
  const totalToShow = isEditing ? editedTotal : originalTotal;

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
                  ₹{totalToShow.toLocaleString()}
                </Badge>
                {hasChanges && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    Modified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                    data-testid="button-edit-cost-distribution"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                )}
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {/* Show comparison if changes were made */}
              {hasChanges && !isEditing && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                  <p className="text-sm font-medium text-blue-800">
                    ⚡ Approver Modified Cost Distribution
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Original: ₹{originalTotal.toLocaleString()} → Approved: ₹{editedTotal.toLocaleString()}
                  </p>
                </div>
              )}

              {distributionsToShow.map((distribution, index) => (
                <div key={distribution.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {distribution.costCenterType}
                      </Badge>
                      <span className="font-medium">{distribution.costCenterName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">₹</span>
                          <Input
                            type="number"
                            value={distribution.amount}
                            onChange={(e) => handleAmountChange(index, e.target.value)}
                            className="w-24 h-8 text-right"
                            min="0"
                            step="0.01"
                            data-testid={`input-cost-${index}`}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-green-600">
                            ₹{parseFloat(distribution.amount).toLocaleString()}
                          </span>
                          {/* Show original amount if it was changed */}
                          {hasChanges && originalDistributions[index] && 
                           parseFloat(originalDistributions[index].amount) !== parseFloat(distribution.amount) && (
                            <span className="text-xs text-gray-500 line-through">
                              ₹{parseFloat(originalDistributions[index].amount).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium text-gray-700">Total Distributed:</span>
                <div className="flex flex-col items-end">
                  <span className={`font-semibold text-lg ${
                    Math.abs(totalToShow - totalAmount) > 0.01 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    ₹{totalToShow.toLocaleString()}
                  </span>
                  {Math.abs(totalToShow - totalAmount) > 0.01 && (
                    <span className="text-xs text-red-500">
                      ⚠️ Mismatch with claim amount (₹{totalAmount.toLocaleString()})
                    </span>
                  )}
                  {hasChanges && !isEditing && (
                    <span className="text-xs text-gray-500">
                      Original: ₹{originalTotal.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit mode controls */}
              {isEditing && (
                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    data-testid="button-cancel-edit"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={Math.abs(editedTotal - totalAmount) > 0.01}
                    data-testid="button-save-edit"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}