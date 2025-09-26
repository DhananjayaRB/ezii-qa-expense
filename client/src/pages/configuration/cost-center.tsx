import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { filterDataService, FilterTypeItem } from "@/services/filterDataService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CostCenter() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    type: "single",
    costCategory1Id: "",
    costCategory1Name: "",
    costCategory1TallyIntegration: false,
    costCategory2Id: "",
    costCategory2Name: "",
    costCategory2TallyIntegration: false,
    costCategory3Id: "",
    costCategory3Name: "",
    costCategory3TallyIntegration: false,
  });

  // Fetch filter data for dropdowns from external API
  const { data: filterOptions = [], isLoading: filterLoading } = useQuery({
    queryKey: ['external-filter-types'],
    queryFn: filterDataService.getFilterTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch existing configuration
  const { data: existingConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/cost-center-config'],
    retry: false,
  });

  // Set form data when existing config is loaded
  useEffect(() => {
    if (existingConfig && typeof existingConfig === 'object' && 'type' in existingConfig) {
      const config = existingConfig as any;
      setFormData({
        type: config.type || "single",
        costCategory1Id: config.costCategory1Id || "",
        costCategory1Name: config.costCategory1Name || "",
        costCategory1TallyIntegration: config.costCategory1TallyIntegration || false,
        costCategory2Id: config.costCategory2Id || "",
        costCategory2Name: config.costCategory2Name || "",
        costCategory2TallyIntegration: config.costCategory2TallyIntegration || false,
        costCategory3Id: config.costCategory3Id || "",
        costCategory3Name: config.costCategory3Name || "",
        costCategory3TallyIntegration: config.costCategory3TallyIntegration || false,
      });
    }
  }, [existingConfig]);

  // Save configuration mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/cost-center-config', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cost center configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cost-center-config'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to save configuration",
      });
    },
  });

  const handleCategorySelect = (categoryNum: number, value: string) => {
    const selectedOption = filterOptions.find(option => option.id === value);
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        [`costCategory${categoryNum}Id`]: value,
        [`costCategory${categoryNum}Name`]: selectedOption.name,
      }));
    }
  };

  const handleTallyIntegrationChange = (categoryNum: number, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [`costCategory${categoryNum}TallyIntegration`]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await saveMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error saving cost center config:', error);
    }
  };

  const handleBack = () => {
    setLocation('/configuration');
  };

  if (configLoading || filterLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-60">
          <Header />
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-60">
        <Header />
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                  Cost Center Configuration
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure cost categories and Tally integration settings
                </p>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2"
              data-testid="button-save"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>

          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Cost Category Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type Selection */}
              <div>
                <Label className="text-base font-medium">Type</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  className="flex items-center gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single">Single</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multiple" id="multiple" />
                    <Label htmlFor="multiple">Multiple</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Cost Categories */}
              {Array.from({ length: formData.type === "single" ? 1 : 3 }, (_, index) => {
                const categoryNum = index + 1;
                return (
                  <div key={categoryNum} className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label htmlFor={`category${categoryNum}`} className="text-sm font-medium">
                        {formData.type === "single" ? "Cost Category" : `Cost Category ${categoryNum}`}
                      </Label>
                      <Select
                        value={formData[`costCategory${categoryNum}Id` as keyof typeof formData] as string}
                        onValueChange={(value) => handleCategorySelect(categoryNum, value)}
                      >
                        <SelectTrigger data-testid={`select-category-${categoryNum}`}>
                          <SelectValue placeholder="-- Select --" />
                        </SelectTrigger>
                        <SelectContent>
                          {filterOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="lg:justify-self-center">
                      <Label className="text-sm font-medium text-center block mb-2">
                        Tally Integration
                      </Label>
                      <RadioGroup
                        value={formData[`costCategory${categoryNum}TallyIntegration` as keyof typeof formData] ? "yes" : "no"}
                        onValueChange={(value) => handleTallyIntegrationChange(categoryNum, value === "yes")}
                        className="flex items-center gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id={`tally-yes-${categoryNum}`} />
                          <Label htmlFor={`tally-yes-${categoryNum}`} className="text-sm">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id={`tally-no-${categoryNum}`} />
                          <Label htmlFor={`tally-no-${categoryNum}`} className="text-sm">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div></div> {/* Empty space for alignment */}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}