import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Eye, EyeOff, Users, User, X, Bot, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { CashFlowProjectionsWidget } from "@/components/dashboard/CashFlowProjectionsWidget";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Loading, CardLoading } from "@/components/ui/loading";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePlanStatus } from "@/hooks/usePlanStatus";

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
  { type: 'cash_flow_projections', name: '📊 Cash Flow Projections', component: CashFlowProjectionsWidget },
];

const DEFAULT_WIDGETS = [
  { type: 'pending_approvals', position: { x: 0, y: 0, width: 1, height: 1 } },
  { type: 'category_breakdown', position: { x: 1, y: 0, width: 1, height: 1 } },
  { type: 'payment_calendar', position: { x: 2, y: 0, width: 1, height: 1 } },
  { type: 'period_filter', position: { x: 3, y: 0, width: 1, height: 1 } },
  { type: 'cost_to_company', position: { x: 0, y: 1, width: 1, height: 1 } },
  { type: 'monthly_insights', position: { x: 1, y: 1, width: 1, height: 1 } },
  { type: 'expense_trends', position: { x: 2, y: 1, width: 2, height: 1 } },
  { type: 'cash_flow_projections', position: { x: 0, y: 2, width: 4, height: 1 } },
];

export default function CustomizableDashboard() {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [currentView, setCurrentView] = useState<'employee' | 'admin'>('employee');
  const [currentPeriod, setCurrentPeriod] = useState('last6months');
  const { toast } = useToast();
  const { data: planStatus } = usePlanStatus();

  // Dynamic branding based on plan status
  const assistantName = planStatus?.isSaas === false ? 'PAYAI' : 'eziiAI';
  const sessionKey = planStatus?.isSaas === false ? 'PAYAI-notification-shown' : 'eziiAI-notification-shown';

  // Use JWT authentication from localStorage ONLY - no more session auth queries
  const { user: userProfile } = useAuth();

  // Session-based notification for AI agent
  useEffect(() => {
    const hasSeenAgentNotification = sessionStorage.getItem(sessionKey);
    
    if (!hasSeenAgentNotification && userProfile) {
      // Show notification after a brief delay to let dashboard load
      const timer = setTimeout(() => {
        toast({
          title: `🤖 Meet ${assistantName}`,
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
        sessionStorage.setItem(sessionKey, 'true');
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
    if (!widgetConfig) return null;

    const WidgetComponent = widgetConfig.component;
    
    // Map analytics data to widget props
    const getWidgetProps = () => {
      switch (widget.widgetType) {
        case 'total_expenses':
          return { 
            totalExpenses: analytics?.totalExpenses || 0, 
            avgProcessingTime: analytics?.avgProcessingTime || 0 
          };
        case 'pending_approvals':
          return { count: analytics?.pendingApprovals || 0 };
        case 'expense_trends':
          return { data: analytics?.monthlyTrends || [] };
        case 'recent_claims':
          return { claims: analytics?.recentClaims || [] };
        case 'category_breakdown':
          return { data: analytics?.categoryBreakdown || [] };
        case 'vendor_spending':
          return { data: analytics?.vendorSpending || [] };
        case 'period_filter':
          return { 
            onPeriodChange: handlePeriodChange,
            currentPeriod,
            totalExpenses: analytics?.totalExpenses || '0',
            previousPeriodExpenses: '0' // TODO: Add previous period comparison
          };
        case 'monthly_insights':
          return { 
            data: analytics?.monthlyTrends || [],
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
        className={cn(
          "relative group transition-all duration-300 hover-lift",
          widget.isVisible ? 'animate-scale-in' : 'opacity-50 scale-95'
        )}
        style={{
          gridColumn: `span ${widget.position.width}`,
          gridRow: `span ${widget.position.height}`,
        }}
        data-testid={`widget-${widget.widgetType}`}
      >
        {/* Beautiful Widget Container with Enhanced Styling */}
        <div className="h-full w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
          {/* Subtle Gradient Overlay for Visual Depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary-600/[0.02] pointer-events-none" />
          
          {/* Modern Remove Button - Only Visible During Customization */}
          {isCustomizing && (
            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => toggleWidgetVisibility(widget.id)}
                className="h-7 w-7 p-0 rounded-full shadow-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 hover:scale-110 transition-all duration-200"
                data-testid={`remove-widget-${widget.id}`}
                title="Remove widget"
              >
                <X className="h-3 w-3 text-white" />
              </Button>
            </div>
          )}
          
          {/* Widget Content with Proper Styling Context */}
          <div className="relative z-10 h-full">
            <WidgetComponent {...getWidgetProps()} />
          </div>
        </div>
      </div>
    );
  };

  // Only block dashboard if widget configuration is loading
  if (widgetsLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            {/* Beautiful Loading Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-300">✨ Loading your expense insights...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse"></div>
                <div className="h-10 w-24 bg-gradient-to-r from-primary/20 to-primary-600/20 rounded-xl animate-pulse"></div>
              </div>
            </div>
            
            {/* Beautiful Loading Grid */}
            <div className="grid-dashboard">
              {[...Array(6)].map((_, i) => (
                <CardLoading 
                  key={i} 
                  text={i === 0 ? "Loading expenses..." : i === 1 ? "Loading analytics..." : "Loading insights..."} 
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
    <>
      {/* Skip Navigation Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg z-50 focus-ring"
        tabIndex={0}
      >
        Skip to main content
      </a>
      
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" data-testid="dashboard-container">
        <nav aria-label="Main navigation">
          <Sidebar />
        </nav>
        
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
        
        <main id="main-content" className="flex-1 overflow-y-auto p-4 lg:p-8" role="main" aria-label="Dashboard content">
          {/* Beautiful Header Section with Enhanced Typography */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent animate-fade-in" data-testid="page-title">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 font-medium" id="dashboard-description">
                {currentView === 'admin' ? '🏢 Company-wide expense analytics and insights' : '📊 Your expense insights at a glance'}
              </p>
            </div>
            {/* Enhanced Action Section with Modern Design */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Beautiful Role Toggle for Admin Users */}
              {userProfile?.jwt_role === 'admin' && (
                <div className="flex items-center gap-2 p-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <Badge 
                    variant={currentView === 'employee' ? 'default' : 'outline'} 
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:scale-105",
                      currentView === 'employee' 
                        ? "bg-gradient-to-r from-primary to-primary-600 hover:shadow-colored" 
                        : "hover:bg-primary/10"
                    )} 
                    onClick={() => setCurrentView('employee')} 
                    data-testid="employee-view-toggle"
                  >
                    <User className="h-3 w-3 mr-1" />
                    My Data
                  </Badge>
                  <Badge 
                    variant={currentView === 'admin' ? 'default' : 'outline'} 
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:scale-105",
                      currentView === 'admin' 
                        ? "bg-gradient-to-r from-primary to-primary-600 hover:shadow-colored" 
                        : "hover:bg-primary/10"
                    )} 
                    onClick={() => setCurrentView('admin')} 
                    data-testid="admin-view-toggle"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Company Data
                  </Badge>
                </div>
              )}
              
              {/* Beautiful Customize Button */}
              <Button
                variant={isCustomizing ? "default" : "outline"}
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={cn(
                  "flex items-center gap-2 transition-all duration-200 hover:scale-105 backdrop-blur-sm focus-ring interactive",
                  isCustomizing 
                    ? "bg-gradient-to-r from-primary to-primary-600 hover:shadow-colored" 
                    : "hover:bg-primary/10 border-2"
                )}
                aria-expanded={isCustomizing}
                aria-controls="widget-customization-panel"
                aria-label={`${isCustomizing ? 'Finish' : 'Start'} customizing dashboard widgets`}
                data-testid="button-customize-dashboard"
                data-tutorial-element="dashboard-customize"
                data-tutorial-description="Customize your dashboard widgets and layout"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">{isCustomizing ? '✅ Done' : '⚙️ Customize'}</span>
              </Button>
            </div>
          </div>


          {/* Stunning Widget Customization Panel */}
          {isCustomizing && (
            <Card className="mb-8 glass border-2 border-primary/20 bg-gradient-to-r from-white/90 to-primary/5 dark:from-gray-800/90 dark:to-primary/10 shadow-xl animate-slide-up" data-testid="widget-customization-panel">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Add Widgets
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">Choose widgets to customize your dashboard experience</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3" data-testid="add-widgets">
                  {AVAILABLE_WIDGETS.map((widget) => {
                    const hasWidget = widgets.some(w => w.widgetType === widget.type && w.isVisible);
                    return (
                      <Button
                        key={widget.type}
                        variant="outline"
                        size="sm"
                        onClick={() => addWidget(widget.type)}
                        disabled={hasWidget}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 h-auto text-xs transition-all duration-200 hover-lift",
                          hasWidget 
                            ? "border-success bg-success/10 text-success-foreground" 
                            : "hover:bg-primary/10 hover:border-primary/50"
                        )}
                        data-testid={`add-widget-${widget.type}`}
                      >
                        <Plus className={cn("h-4 w-4", hasWidget ? "text-success" : "text-primary")} />
                        <span className="font-medium text-center leading-tight">{widget.name}</span>
                        {hasWidget && (
                          <Badge variant="secondary" className="text-xs bg-success/20 text-success-foreground">
                            ✅ Added
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stunning Responsive Widget Grid */}
          <section 
            className="grid-dashboard animate-fade-in" 
            data-testid="dashboard-widgets"
            aria-label="Dashboard widgets"
            role="region"
            aria-describedby="dashboard-description"
          >
            {visibleWidgets.map(renderWidget)}
          </section>

          {/* Beautiful Empty State */}
          {visibleWidgets.length === 0 && (
            <Card className="p-12 text-center glass bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border-2 border-dashed border-primary/30 hover-lift">
              <CardContent className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary-600/20 rounded-full blur-lg" />
                  <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-primary/10 to-primary-600/10 rounded-full flex items-center justify-center">
                    <Settings className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">No widgets visible</h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                    Transform your dashboard experience by adding beautiful widgets to track and analyze your expenses.
                  </p>
                </div>
                <Button
                  onClick={() => setIsCustomizing(true)}
                  data-testid="start-customizing"
                  className="bg-gradient-to-r from-primary to-primary-600 hover:shadow-colored transition-all duration-200 hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start Customizing
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
    </>
  );
}