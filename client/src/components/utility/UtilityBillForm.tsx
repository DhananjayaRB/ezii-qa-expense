import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Zap, Droplets, Flame, Wifi, Phone, Fuel, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { UtilityCategory, UnitsOfMeasurement } from "@shared/schema";

interface UtilityBillData {
  billCategory: string;
  utilityCategory: string;
  accountNumber: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  openingReading: string;
  closingReading: string;
  consumptionUnits: string;
  unitOfMeasurement: string;
  billDate: string;
  gstin: string;
  sgst: string;
  cgst: string;
  igst: string;
}

interface UtilityBillFormProps {
  data?: Partial<UtilityBillData>;
  onChange?: (data: UtilityBillData) => void;
  disabled?: boolean;
  showTitle?: boolean;
}

// Icon mapping for utility categories
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('electric')) return <Zap className="w-4 h-4 text-amber-600" />;
  if (name.includes('water')) return <Droplets className="w-4 h-4 text-blue-600" />;
  if (name.includes('gas')) return <Flame className="w-4 h-4 text-orange-600" />;
  if (name.includes('internet') || name.includes('mobile') || name.includes('data')) return <Wifi className="w-4 h-4 text-green-600" />;
  if (name.includes('telephone') || name.includes('phone')) return <Phone className="w-4 h-4 text-purple-600" />;
  if (name.includes('fuel')) return <Fuel className="w-4 h-4 text-red-600" />;
  return <MoreHorizontal className="w-4 h-4 text-gray-600" />;
};

// Determine if utility category requires meter readings
const requiresMeterReadings = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  // Meter-based utilities: electricity, water, gas
  return name.includes('electric') || name.includes('water') || name.includes('gas');
};

// Determine if utility category requires quantity input
const requiresQuantityInput = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  // Quantity-based utilities: fuel, some telecom services
  return name.includes('fuel') || name.includes('telephone') || name.includes('phone');
};

export default function UtilityBillForm({ 
  data = {}, 
  onChange, 
  disabled = false, 
  showTitle = true 
}: UtilityBillFormProps) {
  const [formData, setFormData] = useState<UtilityBillData>({
    billCategory: "utility_bill_form",
    utilityCategory: "",
    accountNumber: "",
    billingPeriodStart: "",
    billingPeriodEnd: "",
    openingReading: "",
    closingReading: "",
    consumptionUnits: "",
    unitOfMeasurement: "",
    billDate: "",
    gstin: "",
    sgst: "",
    cgst: "",
    igst: "",
    ...data,
  });

  // Fetch utility categories
  const { data: categories = [] } = useQuery<UtilityCategory[]>({
    queryKey: ["/api/utility-categories"],
  });

  // Fetch units of measurement for selected category
  const { data: units = [] } = useQuery<UnitsOfMeasurement[]>({
    queryKey: ["/api/units-of-measurement", formData.utilityCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (formData.utilityCategory) {
        params.append('utilityCategoryId', formData.utilityCategory);
      }
      const response = await fetch(`/api/units-of-measurement?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch units of measurement');
      }
      return response.json();
    },
    enabled: !!formData.utilityCategory,
  });

  // Define selected category and unit variables before useEffect hooks
  const selectedCategory = categories.find(cat => cat.id === formData.utilityCategory);
  const selectedUnit = units.find(unit => unit.id === formData.unitOfMeasurement);

  // Auto-calculate consumption when readings change (for meter-based utilities only)
  useEffect(() => {
    if (selectedCategory && requiresMeterReadings(selectedCategory.name)) {
      if (formData.openingReading && formData.closingReading) {
        const opening = parseFloat(formData.openingReading);
        const closing = parseFloat(formData.closingReading);
        
        if (!isNaN(opening) && !isNaN(closing) && closing >= opening) {
          const consumption = (closing - opening).toFixed(2);
          setFormData(prev => ({ ...prev, consumptionUnits: consumption }));
        } else {
          setFormData(prev => ({ ...prev, consumptionUnits: "" }));
        }
      } else {
        setFormData(prev => ({ ...prev, consumptionUnits: "" }));
      }
    }
  }, [formData.openingReading, formData.closingReading, selectedCategory]);

  // Clear meter readings when switching to non-meter category
  useEffect(() => {
    if (selectedCategory && !requiresMeterReadings(selectedCategory.name)) {
      setFormData(prev => ({ 
        ...prev, 
        openingReading: "", 
        closingReading: ""
      }));
    }
  }, [selectedCategory]);

  // Reset unit when category changes
  useEffect(() => {
    if (formData.utilityCategory && units.length > 0) {
      // Auto-select the first unit if only one is available
      if (units.length === 1) {
        setFormData(prev => ({ ...prev, unitOfMeasurement: units[0].id }));
      } else {
        // Clear unit selection when category changes
        setFormData(prev => ({ ...prev, unitOfMeasurement: "" }));
      }
    }
  }, [formData.utilityCategory, units]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  const handleInputChange = (field: keyof UtilityBillData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatBillingPeriod = () => {
    if (formData.billingPeriodStart && formData.billingPeriodEnd) {
      const start = new Date(formData.billingPeriodStart).toLocaleDateString('en-GB');
      const end = new Date(formData.billingPeriodEnd).toLocaleDateString('en-GB');
      return `${start} - ${end}`;
    }
    return "";
  };

  return (
    <div className="space-y-6" data-testid="utility-bill-form">
      {showTitle && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill Category</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Utility Bill Form (for consumption-based expenses)</span>
              <Badge variant="default" className="ml-auto">Default</Badge>
            </div>
          </div>
        </div>
      )}

      <Card data-testid="utility-bill-details">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Utility Bill Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Utility Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="utility-category">Utility Type *</Label>
            <Select 
              value={formData.utilityCategory} 
              onValueChange={(value) => handleInputChange("utilityCategory", value)}
              disabled={disabled}
            >
              <SelectTrigger data-testid="select-utility-category">
                <SelectValue placeholder="Select utility type" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(cat => cat.isActive).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.name)}
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory?.description && (
              <p className="text-sm text-gray-600">{selectedCategory.description}</p>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="account-number">Account/Consumer Number *</Label>
                <Input
                  id="account-number"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                  placeholder="Enter account number"
                  disabled={disabled}
                  data-testid="input-account-number"
                />
              </div>

              {/* Conditional fields based on utility category */}
              {selectedCategory && requiresMeterReadings(selectedCategory.name) ? (
                // Meter-based utilities (Electricity, Water, Gas)
                <>
                  <div>
                    <Label htmlFor="opening-reading">Opening Meter Reading</Label>
                    <Input
                      id="opening-reading"
                      type="number"
                      step="0.01"
                      value={formData.openingReading}
                      onChange={(e) => handleInputChange("openingReading", e.target.value)}
                      placeholder="Enter opening reading"
                      disabled={disabled}
                      data-testid="input-opening-reading"
                    />
                  </div>

                  <div>
                    <Label htmlFor="consumption-units">Consumption Units</Label>
                    <div className="relative">
                      <Input
                        id="consumption-units"
                        value={formData.consumptionUnits}
                        placeholder="Auto-calculated"
                        disabled={true}
                        className="bg-gray-50 font-medium"
                        data-testid="input-consumption-units"
                      />
                      {selectedUnit && (
                        <Badge variant="outline" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          {selectedUnit.abbreviation}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically calculated from closing - opening reading
                    </p>
                  </div>
                </>
              ) : selectedCategory && requiresQuantityInput(selectedCategory.name) ? (
                // Quantity-based utilities (Fuel, Phone usage)
                <div>
                  <Label htmlFor="quantity-consumed">Quantity Consumed</Label>
                  <div className="relative">
                    <Input
                      id="quantity-consumed"
                      type="number"
                      step="0.01"
                      value={formData.consumptionUnits}
                      onChange={(e) => handleInputChange("consumptionUnits", e.target.value)}
                      placeholder="Enter quantity consumed"
                      disabled={disabled}
                      data-testid="input-quantity-consumed"
                    />
                    {selectedUnit && (
                      <Badge variant="outline" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        {selectedUnit.abbreviation}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the quantity of {selectedCategory.name.toLowerCase()} consumed
                  </p>
                </div>
              ) : (
                // Fixed-plan utilities (Internet plans, etc.)
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Fixed Plan Service</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    This utility type typically has fixed billing amounts
                  </p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="billing-period">Billing Period *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      value={formData.billingPeriodStart}
                      onChange={(e) => handleInputChange("billingPeriodStart", e.target.value)}
                      disabled={disabled}
                      data-testid="input-billing-period-start"
                      placeholder="Start date"
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={formData.billingPeriodEnd}
                      onChange={(e) => handleInputChange("billingPeriodEnd", e.target.value)}
                      disabled={disabled}
                      data-testid="input-billing-period-end"
                      placeholder="End date"
                    />
                  </div>
                </div>
                {formatBillingPeriod() && (
                  <p className="text-sm text-gray-600 mt-1">{formatBillingPeriod()}</p>
                )}
              </div>

              {/* Closing meter reading only for meter-based utilities */}
              {selectedCategory && requiresMeterReadings(selectedCategory.name) && (
                <div>
                  <Label htmlFor="closing-reading">Closing Meter Reading</Label>
                  <Input
                    id="closing-reading"
                    type="number"
                    step="0.01"
                    value={formData.closingReading}
                    onChange={(e) => handleInputChange("closingReading", e.target.value)}
                    placeholder="Enter closing reading"
                    disabled={disabled}
                    data-testid="input-closing-reading"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="bill-date">Bill Date *</Label>
                <Input
                  id="bill-date"
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => handleInputChange("billDate", e.target.value)}
                  disabled={disabled}
                  data-testid="input-bill-date"
                />
              </div>
            </div>
          </div>

          {/* Units of Measurement Selection */}
          {formData.utilityCategory && units.length > 0 && (
            <>
              <Separator />
              <div>
                <Label htmlFor="unit-measurement">Unit of Measurement</Label>
                <Select 
                  value={formData.unitOfMeasurement} 
                  onValueChange={(value) => handleInputChange("unitOfMeasurement", value)}
                  disabled={disabled}
                >
                  <SelectTrigger data-testid="select-unit-measurement">
                    <SelectValue placeholder="Select unit of measurement" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.filter(unit => unit.isActive).map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{unit.name}</span>
                          <Badge variant="outline" className="ml-2 font-mono text-xs">
                            {unit.abbreviation}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* GST Details */}
          <Separator />
          <div>
            <Label className="text-base font-medium">GST Details</Label>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange("gstin", e.target.value)}
                  placeholder="GSTIN"
                  disabled={disabled}
                  data-testid="input-gstin"
                />
              </div>
              <div>
                <Label htmlFor="sgst">SGST Amount</Label>
                <Input
                  id="sgst"
                  type="number"
                  step="0.01"
                  value={formData.sgst}
                  onChange={(e) => handleInputChange("sgst", e.target.value)}
                  placeholder="SGST Amount"
                  disabled={disabled}
                  data-testid="input-sgst"
                />
              </div>
              <div>
                <Label htmlFor="cgst">CGST Amount</Label>
                <Input
                  id="cgst"
                  type="number"
                  step="0.01"
                  value={formData.cgst}
                  onChange={(e) => handleInputChange("cgst", e.target.value)}
                  placeholder="CGST Amount"
                  disabled={disabled}
                  data-testid="input-cgst"
                />
              </div>
              <div>
                <Label htmlFor="igst">IGST Amount</Label>
                <Input
                  id="igst"
                  type="number"
                  step="0.01"
                  value={formData.igst}
                  onChange={(e) => handleInputChange("igst", e.target.value)}
                  placeholder="IGST Amount"
                  disabled={disabled}
                  data-testid="input-igst"
                />
              </div>
            </div>
          </div>

          {/* Calculation Summary */}
          {formData.consumptionUnits && selectedUnit && (
            <>
              <Separator />
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Calculation Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Opening Reading:</span>
                    <span className="font-mono">{formData.openingReading} {selectedUnit.abbreviation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closing Reading:</span>
                    <span className="font-mono">{formData.closingReading} {selectedUnit.abbreviation}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium text-green-800">
                    <span>Total Consumption:</span>
                    <span className="font-mono">{formData.consumptionUnits} {selectedUnit.abbreviation}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}