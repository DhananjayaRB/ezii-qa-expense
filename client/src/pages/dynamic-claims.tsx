import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar, MapPin, Plane, Building, Car } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ExpenseClaimForm from "@/components/claims/expense-claim-form";
import AccommodationClaimForm from "@/components/claims/accommodation-claim-form";
// Other form components will be imported as they are created
// import TicketClaimForm from "@/components/claims/ticket-claim-form";
// import ConveyanceClaimForm from "@/components/claims/conveyance-claim-form";

type ClaimFormType = "expense" | "accommodation" | "ticket" | "conveyance";

interface GroupedExpenseHeadsResponse {
  groupedHeads: Record<string, any[]>;
  availableClaimForms: string[];
}

const claimFormConfig = {
  expense: {
    label: "Expense",
    icon: FileText,
    color: "bg-blue-500",
    description: "General expense claims"
  },
  accommodation: {
    label: "Accommodation", 
    icon: Building,
    color: "bg-green-500",
    description: "Hotel and lodging expenses"
  },
  ticket: {
    label: "Ticket",
    icon: Plane,
    color: "bg-purple-500", 
    description: "Travel ticket bookings"
  },
  conveyance: {
    label: "Conveyance",
    icon: Car,
    color: "bg-orange-500",
    description: "Transportation and travel expenses"
  }
};

export default function DynamicClaims() {
  const [activeClaimForm, setActiveClaimForm] = useState<ClaimFormType | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Fetch grouped expense heads to determine available claim form types
  const { data: groupedData, isLoading } = useQuery<GroupedExpenseHeadsResponse>({
    queryKey: ["/api/expense-heads/grouped-by-claim-form"],
  });

  const availableClaimForms = groupedData?.availableClaimForms || [];

  const handleCreateClaim = (claimType: ClaimFormType) => {
    setActiveClaimForm(claimType);
    setShowClaimModal(true);
  };

  const renderClaimForm = () => {
    if (!activeClaimForm || !groupedData) return null;

    const expenseHeads = groupedData.groupedHeads[activeClaimForm] || [];

    switch (activeClaimForm) {
      case "expense":
        return (
          <ExpenseClaimForm
            key="expense-form"
            expenseHeads={expenseHeads}
            onClose={() => setShowClaimModal(false)}
            data-testid="expense-claim-form"
          />
        );
      case "accommodation":
        return (
          <AccommodationClaimForm
            key="accommodation-form"
            expenseHeads={expenseHeads}
            onClose={() => setShowClaimModal(false)}
            data-testid="accommodation-claim-form"
          />
        );
      case "ticket":
      case "conveyance":
        // Placeholder for forms not yet implemented
        const config = claimFormConfig[activeClaimForm];
        return (
          <div className="p-6 space-y-4" data-testid={`${activeClaimForm}-claim-form`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-md ${config?.color} bg-opacity-20`}>
                <config.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{config?.label} Claim Form</h3>
                <p className="text-sm text-gray-600">{expenseHeads.length} expense heads available</p>
              </div>
            </div>
            
            <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <config.icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {config?.label} Form Coming Soon
              </h4>
              <p className="text-gray-600 mb-4">
                Dynamic {config?.label.toLowerCase()} form will be implemented here with fields specific to this claim type.
              </p>
              <div className="text-left bg-gray-50 p-4 rounded-md">
                <p className="font-medium mb-2">Available Expense Heads:</p>
                <ul className="space-y-1">
                  {expenseHeads.slice(0, 5).map((head) => (
                    <li key={head.id} className="text-sm text-gray-700">• {head.name}</li>
                  ))}
                  {expenseHeads.length > 5 && (
                    <li className="text-sm text-gray-500">... and {expenseHeads.length - 5} more</li>
                  )}
                </ul>
              </div>
              <Button 
                className="mt-4"
                onClick={() => setShowClaimModal(false)}
                data-testid="button-close-placeholder"
              >
                Close
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading claim forms...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                Dynamic Claims
              </h1>
              <p className="text-gray-600 dark:text-gray-400" data-testid="text-page-description">
                Create claims based on available expense head configurations
              </p>
            </div>

            {/* Available Claim Forms */}
            {availableClaimForms.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Claim Forms Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No expense heads are configured. Please configure expense heads in the admin panel first.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableClaimForms.map((claimType) => {
                  const config = claimFormConfig[claimType as ClaimFormType];
                  const Icon = config?.icon || FileText;
                  const expenseHeadsCount = groupedData?.groupedHeads[claimType]?.length || 0;

                  return (
                    <Card 
                      key={claimType} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCreateClaim(claimType as ClaimFormType)}
                      data-testid={`card-claim-type-${claimType}`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-md ${config?.color || 'bg-gray-500'} bg-opacity-20`}>
                            <Icon className={`h-6 w-6 text-white`} />
                          </div>
                          <Badge variant="secondary" data-testid={`badge-count-${claimType}`}>
                            {expenseHeadsCount} heads
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                          {config?.label || claimType.charAt(0).toUpperCase() + claimType.slice(1)}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {config?.description || `${claimType} related expenses`}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateClaim(claimType as ClaimFormType);
                          }}
                          data-testid={`button-create-${claimType}-claim`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create {config?.label} Claim
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Available Claim Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600" data-testid="stat-total-claim-types">
                      {availableClaimForms.length}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Claim Types</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-total-expense-heads">
                      {Object.values(groupedData?.groupedHeads || {}).flat().length}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Expense Heads</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600" data-testid="stat-most-configured">
                      {availableClaimForms.length > 0 ? 
                        Object.entries(groupedData?.groupedHeads || {})
                          .reduce((prev, current) => 
                            (current[1].length > prev[1].length) ? current : prev,
                            ['N/A', []]
                          )[0] || 'N/A'
                        : 'N/A'
                      }
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Most Configured</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600" data-testid="stat-ready-status">
                      {availableClaimForms.length > 0 ? 'Ready' : 'Setup Required'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Dynamic Claim Form Modal */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center" data-testid="modal-title">
              {activeClaimForm && claimFormConfig[activeClaimForm] && (() => {
                const config = claimFormConfig[activeClaimForm];
                const IconComponent = config.icon;
                return (
                  <>
                    <div className={`p-2 rounded-md ${config.color} bg-opacity-20 mr-3`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    Create {config.label} Claim
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {renderClaimForm()}
        </DialogContent>
      </Dialog>
    </div>
  );
}