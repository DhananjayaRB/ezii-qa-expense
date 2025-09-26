import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Eye, EyeOff, Users, User, X, Bot, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ExpenseTrendsWidget } from "@/components/dashboard/ExpenseTrendsWidget";
import { PendingApprovalsWidget } from "@/components/dashboard/PendingApprovalsWidget";
import { RecentClaimsWidget } from "@/components/dashboard/RecentClaimsWidget";
import { CategoryBreakdownWidget } from "@/components/dashboard/CategoryBreakdownWidget";
import { TotalExpensesWidget } from "@/components/dashboard/TotalExpensesWidget";
import { VendorSpendingWidget } from "@/components/dashboard/VendorSpendingWidget";
import { PeriodFilterWidget } from "@/components/dashboard/PeriodFilterWidget";
import { MonthlyInsightsWidget } from "@/components/dashboard/MonthlyInsightsWidget";
import { CostToCompanyWidget } from "@/components/dashboard/CostToCompanyWidget";
import { PaymentCalendarWidget } from "@/components/dashboard/PaymentCalendarWidget";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Loading, CardLoading } from "@/components/ui/loading";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DashboardWidget {
  id: string;
  widgetType: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: any;
  isVisible: boolean;
}

interface DashboardAnalytics {
  totalExpenses: number;
  pendingApprovals: number;
  recentClaims: any[];
  monthlyTrends: any[];
  categoryBreakdown: any[];
  vendorSpending: any[];
  avgProcessingTime: number;
}

const AVAILABLE_WIDGETS = [
  { type: 'cost_to_company', name: '🏢 Cost to Company', component: CostToCompanyWidget },
  { type: 'period_filter', name: '📅 Period Filter', component: PeriodFilterWidget },
  { type: 'payment_calendar', name: '📅 Payment Calendar', component: PaymentCalendarWidget },
  { type: 'monthly_insights', name: '📊 Monthly Insights', component: MonthlyInsightsWidget },
  { type: 'total_expenses', name: '💰 Total Expenses', component: TotalExpensesWidget },
  { type: 'pending_approvals', name: '⏳ Pending Approvals', component: PendingApprovalsWidget },
  { type: 'expense_trends', name: '📈 Expense Trends', component: ExpenseTrendsWidget },
  { type: 'recent_claims', name: '📋 Recent Claims', component: RecentClaimsWidget },
  { type: 'category_breakdown', name: '🥧 Claim Categories', component: CategoryBreakdownWidget },
  { type: 'vendor_spending', name: '💳 Vendor Spending', component: VendorSpendingWidget },
];

const DEFAULT_WIDGETS = [
  { type: 'pending_approvals', position: { x: 0, y: 0, width: 1, height: 1 } },
  { type: 'category_breakdown', position: { x: 1, y: 0, width: 1, height: 1 } },
  { type: 'payment_calendar', position: { x: 2, y: 0, width: 1, height: 1 } },
  { type: 'period_filter', position: { x: 3, y: 0, width: 1, height: 1 } },
  { type: 'cost_to_company', position: { x: 0, y: 1, width: 1, height: 1 } },
  { type: 'monthly_insights', position: { x: 1, y: 1, width: 1, height: 1 } },
  { type: 'expense_trends', position: { x: 2, y: 1, width: 2, height: 1 } },
];

export default function CustomizableDashboard() {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [currentView, setCurrentView] = useState<'employee' | 'admin'>('employee');
  const [currentPeriod, setCurrentPeriod] = useState('last6months');
  const { toast } = useToast();

  // Use JWT authentication from localStorage ONLY - no more session auth queries
  const { user: userProfile } = useAuth();

  // Session-based notification for eziiAI agent
  useEffect(() => {
    const hasSeenAgentNotification = sessionStorage.getItem('eziiAI-notification-shown');
    
    if (!hasSeenAgentNotification && userProfile) {
      // Show notification after a brief delay to let dashboard load
      const timer = setTimeout(() => {
        toast({
          title: "🤖 Meet eziiAI",
          description: "Your intelligent expense management assistant is ready! Click the AI button to get help with queries and actions.",
          duration: 8000,
          action: (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                // Find and trigger the agent button
                const agentButton = document.querySelector('[data-testid="button-open-agent"]') as HTMLButtonElement;
                if (agentButton) {
                  agentButton.click();
                }
              }}
              className="ml-2"
            >
              <Bot className="w-4 h-4 mr-1" />
              Try Now
            </Button>
          )
        });
        sessionStorage.setItem('eziiAI-notification-shown', 'true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [userProfile, toast]);

  // Fetch user's widgets
  const { data: userWidgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ['/api/dashboard/widgets'],
    enabled: true,
  });

  // Fetch dashboard analytics with role filtering and period filtering
  const { data: analytics, isLoading: analyticsLoading } = useQuery<DashboardAnalytics>({
    queryKey: [`/api/dashboard/analytics?role=${currentView === 'admin' ? 'Admin' : 'Employee'}&period=${currentPeriod}`],
    enabled: true,
  });

  // Fetch cost to company breakdown
  const { data: costToCompanyData, isLoading: costToCompanyLoading } = useQuery({
    queryKey: [`/api/dashboard/cost-to-company-breakdown?role=${currentView === 'admin' ? 'Admin' : 'Employee'}&period=${currentPeriod}`],
    enabled: true,
  });

  const handlePeriodChange = (period: string) => {
    setCurrentPeriod(period);
  };

  // Initialize widgets on first load
  useEffect(() => {
    if (userWidgets && Array.isArray(userWidgets) && userWidgets.length > 0) {
      setWidgets(userWidgets);
    } else if (!widgetsLoading && userWidgets && Array.isArray(userWidgets) && userWidgets.length === 0) {
      // Create default widgets if none exist
      initializeDefaultWidgets();
    }
  }, [userWidgets, widgetsLoading]);

  const initializeDefaultWidgets = async () => {
    try {
      const { apiRequest } = await import('@/lib/queryClient');
      const defaultWidgets = await Promise.all(
        DEFAULT_WIDGETS.map(async (widget) => {
          const response = await apiRequest('/api/dashboard/widgets', {
            method: 'POST',
            body: {
              widgetType: widget.type,
              position: widget.position,
              config: {},
              isVisible: true,
            },
          });
          return response;
        })
      );
      setWidgets(defaultWidgets);
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/widgets'] });
    } catch (error) {
      console.error('Failed to initialize default widgets:', error);
    }
  };

  const toggleWidgetVisibility = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    try {
      const { apiRequest } = await import('@/lib/queryClient');
      await apiRequest(`/api/dashboard/widgets/${widgetId}`, {
        method: 'PUT',
        body: {
          isVisible: !widget.isVisible,
        },
      });

      setWidgets(widgets.map(w => 
        w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
      ));
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/widgets'] });
    } catch (error) {
      console.error('Failed to toggle widget visibility:', error);
    }
  };

  const addWidget = async (widgetType: string) => {
    try {
      const { apiRequest } = await import('@/lib/queryClient');
      const newWidget = await apiRequest('/api/dashboard/widgets', {
        method: 'POST',
        body: {
          widgetType,
          position: { x: 0, y: widgets.length, width: 1, height: 1 },
          config: {},
          isVisible: true,
        },
      });

      setWidgets([...widgets, newWidget]);
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/widgets'] });
    } catch (error) {
      console.error('Failed to add widget:', error);
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    const widgetConfig = AVAILABLE_WIDGETS.find(w => w.type === widget.widgetType);
    if (!widgetConfig || !analytics) return null;

    const WidgetComponent = widgetConfig.component;
    
    // Map analytics data to widget props
    const getWidgetProps = () => {
      switch (widget.widgetType) {
        case 'total_expenses':
          return { 
            totalExpenses: analytics.totalExpenses, 
            avgProcessingTime: analytics.avgProcessingTime 
          };
        case 'pending_approvals':
          return { count: analytics.pendingApprovals };
        case 'expense_trends':
          return { data: analytics.monthlyTrends };
        case 'recent_claims':
          return { claims: analytics.recentClaims };
        case 'category_breakdown':
          return { data: analytics.categoryBreakdown };
        case 'vendor_spending':
          return { data: analytics.vendorSpending };
        case 'period_filter':
          return { 
            onPeriodChange: handlePeriodChange,
            currentPeriod,
            totalExpenses: analytics.totalExpenses || '0',
            previousPeriodExpenses: '0' // TODO: Add previous period comparison
          };
        case 'monthly_insights':
          return { 
            data: analytics.monthlyTrends || [],
            period: currentPeriod
          };
        case 'cost_to_company':
          return {
            data: costToCompanyData || {
              employeeClaims: { total: 0, count: 0 },
              directExpenses: { total: 0, count: 0 },
              vendorPayments: { total: 0, count: 0 },
              corporateCard: { total: 0, count: 0 }
            }
          };
        default:
          return {};
      }
    };

    return (
      <div
        key={widget.id}
        className={`relative ${widget.isVisible ? '' : 'opacity-50'}`}
        style={{
          gridColumn: `span ${widget.position.width}`,
          gridRow: `span ${widget.position.height}`,
        }}
        data-testid={`widget-${widget.widgetType}`}
      >
        {isCustomizing && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleWidgetVisibility(widget.id)}
              className="h-6 w-6 p-0 hover:bg-red-50 hover:border-red-200"
              data-testid={`remove-widget-${widget.id}`}
              title="Remove widget"
            >
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        )}
        <WidgetComponent {...getWidgetProps()} />
      </div>
    );
  };

  if (widgetsLoading || analyticsLoading || costToCompanyLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Loading your expense insights...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <CardLoading 
                  key={i} 
                  text={i === 0 ? "Loading expenses..." : i === 1 ? "Loading analytics..." : "Loading data..."} 
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  const visibleWidgets = widgets.filter(w => w.isVisible);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900" data-testid="page-title">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                {currentView === 'admin' ? 'Company-wide expense analytics' : 'Your expense insights at a glance'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Role toggle for admin users */}
              {userProfile?.jwt_role === 'admin' && (
                <div className="flex items-center gap-2">
                  <Badge variant={currentView === 'employee' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCurrentView('employee')} data-testid="employee-view-toggle">
                    <User className="h-3 w-3 mr-1" />
                    My Data
                  </Badge>
                  <Badge variant={currentView === 'admin' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCurrentView('admin')} data-testid="admin-view-toggle">
                    <Users className="h-3 w-3 mr-1" />
                    Company Data
                  </Badge>
                </div>
              )}
              <Button
                variant={isCustomizing ? "default" : "outline"}
                onClick={() => setIsCustomizing(!isCustomizing)}
                className="flex items-center gap-2"
                data-testid="customize-dashboard"
              >
                <Settings className="h-4 w-4" />
                {isCustomizing ? 'Done' : 'Customize'}
              </Button>
            </div>
          </div>

          {isCustomizing && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Add Widgets</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_WIDGETS.map((widget) => {
                    const hasWidget = widgets.some(w => w.widgetType === widget.type && w.isVisible);
                    return (
                      <Button
                        key={widget.type}
                        variant="outline"
                        size="sm"
                        onClick={() => addWidget(widget.type)}
                        disabled={hasWidget}
                        className="flex items-center gap-1 text-xs h-7"
                        data-testid={`add-widget-${widget.type}`}
                      >
                        <Plus className="h-2 w-2" />
                        {widget.name}
                        {hasWidget && <Badge variant="secondary" className="ml-1 text-xs">Added</Badge>}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-3 auto-rows-min">
            {visibleWidgets.map(renderWidget)}
          </div>

          {visibleWidgets.length === 0 && (
            <Card className="p-12 text-center">
              <CardContent>
                <div className="text-gray-400 mb-4">
                  <Settings className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium mb-2">No widgets visible</h3>
                <p className="text-gray-600 mb-4">
                  Customize your dashboard to add widgets and track your expenses.
                </p>
                <Button
                  onClick={() => setIsCustomizing(true)}
                  data-testid="start-customizing"
                >
                  Start Customizing
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}