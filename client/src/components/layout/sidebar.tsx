import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Receipt, ChevronDown, ChevronRight, User, Shield, X, Sun, Moon, Home, CheckCheck, HandHeart, FileText, Upload, Route, UserPlus, Building, Users, UserCircle, FileSignature, TrendingUp, Wallet, CreditCard, PlusCircle, Unlock, BarChart3, Settings, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRoleToggle } from "@/hooks/useRoleToggle";
import { useRoleMenus } from "@/hooks/useRoleMenus";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { ProductSwitcher } from "@/components/ui/product-switcher";
import { MobileProductSwitcher } from "../ui/mobile-product-switcher";
import { Button } from "@/components/ui/button";

// Modern icon mapping with beautiful Lucide React icons
const iconMap: Record<string, React.ComponentType<any>> = {
  "fas fa-home": Home,
  "fas fa-check-double": CheckCheck,
  "fas fa-hand-paper": HandHeart,
  "fas fa-file-invoice": FileText,
  "fas fa-cloud-upload-alt": Upload,
  "fas fa-route": Route,
  "fas fa-user-plus": UserPlus,
  "fas fa-building": Building,
  "fas fa-users": Users,
  "fas fa-user-circle": UserCircle,
  "fas fa-file-contract": FileSignature,
  "fas fa-chart-line": TrendingUp,
  "fas fa-wallet": Wallet,
  "fas fa-credit-card": CreditCard,
  "fas fa-plus-circle": PlusCircle,
  "fas fa-unlock": Unlock,
  "fas fa-receipt": Receipt,
  "fas fa-chart-bar": BarChart3,
  "fas fa-cog": Settings,
  "fas fa-users-cog": Users,
  "fas fa-project-diagram": Route,
  "fas fa-user-shield": UserCog,
};

const menuItems = [
  { path: "/", label: "Dashboard", icon: "fas fa-home" },
  { path: "/approvals", label: "Approvals", icon: "fas fa-check-double" },
  { 
    label: "Employee", 
    isSection: true,
    items: [
      { path: "/employee/request", label: "Request", icon: "fas fa-hand-paper" },
      { path: "/employee/claim", label: "Claim", icon: "fas fa-file-invoice" },
      { path: "/employee/uploads", label: "Uploads", icon: "fas fa-cloud-upload-alt" },
      { path: "/employee/approval-tracker", label: "Approval Tracker", icon: "fas fa-route" },
      { path: "/vendor-onboarding/request", label: "Request Vendor", icon: "fas fa-user-plus" },
    ]
  },
  { path: "/direct-expenses", label: "Direct Expenses", icon: "fas fa-building" },
  {
    label: "Vendor Management",
    isSection: true,
    items: [
      { path: "/vendors", label: "Vendor Master", icon: "fas fa-users" },
      { path: "/vendors/add", label: "Add Vendor", icon: "fas fa-user-plus" },
      { path: "/vendors/claim", label: "Vendor Claim", icon: "fas fa-file-invoice" },
      { path: "/contracts", label: "Contract Master", icon: "fas fa-file-contract" },
      { path: "/vendor-reports", label: "Vendor Reports", icon: "fas fa-chart-line" },
    ]
  },
  { path: "/petty-cash", label: "Petty Cash", icon: "fas fa-wallet" },
  {
    label: "Accountant",
    isSection: true,
    items: [
      { 
        label: "Payments", 
        icon: "fas fa-credit-card",
        isSubSection: true,
        items: [
          { path: "/accountant/payments/initiate", label: "Initiate Payments", icon: "fas fa-plus-circle" },
          { path: "/accountant/payments/process", label: "Process Payments", icon: "fas fa-credit-card" },
          { path: "/accountant/payments/release-bills", label: "Release Bills", icon: "fas fa-unlock" },
          { path: "/accountant/payments/card-stmt", label: "Card Statements", icon: "fas fa-credit-card" },
        ]
      },
      { path: "/accountant/receipts", label: "Receipts", icon: "fas fa-receipt" },
    ]
  },
  { path: "/reports", label: "Reports", icon: "fas fa-chart-bar" },
  {
    label: "Configuration",
    isSection: true,
    icon: "fas fa-cog",
    items: [
      { path: "/configuration/user-roles", label: "User Roles", icon: "fas fa-users-cog" },
      { path: "/configuration/workflows", label: "Workflows", icon: "fas fa-project-diagram" },
      { path: "/configuration", label: "General Settings", icon: "fas fa-cog" },
    ]
  },
  { path: "/admin", label: "Admin", icon: "fas fa-user-shield" },
];

// Helper function to get Lucide icon component
const getIconComponent = (iconClass: string) => {
  return iconMap[iconClass] || Settings; // Default to Settings icon
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { isAdmin, currentRole, toggleRole } = useRoleToggle();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();
  const { filterMenuItems, rolesLoading, hasPermissions, userRoleName } = useRoleMenus();
  const { sidebarTheme, toggleSidebarTheme } = useTheme();
  
  // Simple state for expanded sections with role-based initial values
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Update sections when role changes - force re-render by resetting state
  useEffect(() => {
    // Keep all sections collapsed by default
    setExpandedSections([]);
    // Force a complete re-render of the component
    setForceUpdate(prev => prev + 1);
  }, [isAdmin, currentRole]); // Use both isAdmin and currentRole as dependencies

  const toggleSection = (sectionLabel: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionLabel) 
        ? prev.filter(s => s !== sectionLabel)
        : [...prev, sectionLabel]
    );
  };

  const isActivePath = (path: string) => {
    // Exact match first
    if (location === path) return true;
    
    // Special case for dashboard/home
    if (path === "/" && location === "/") return true;
    
    // For other paths, only do exact matching to avoid double highlighting
    return false;
  };


  // Dynamic role-based menu filtering using database permissions
  const currentMenuItems = React.useMemo(() => {
    if (rolesLoading) {
      // Show skeleton or empty state while loading
      return [];
    }
    
    return filterMenuItems(menuItems);
  }, [filterMenuItems, rolesLoading]);

  // Force complete re-render when role changes by using role as key
  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileMenu}
          data-testid="mobile-backdrop"
        />
      )}
      
      <div className="flex">
        {/* ProductSwitcher - Always visible on desktop */}
        <div className="hidden lg:block">
          <ProductSwitcher />
        </div>
        
        <div 
          key={`sidebar-${currentRole}-${isAdmin}-${forceUpdate}`} 
          className={cn(
            // Modern gradient background with glass effect
            sidebarTheme === 'dark' 
              ? "bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white border-r border-gray-700/50" 
              : "bg-gradient-to-b from-white via-gray-50 to-white text-gray-700 border-r border-gray-200/50",
            "flex-shrink-0 h-screen z-50 backdrop-blur-xl",
            // Desktop: always visible, fixed width
            "lg:block lg:w-64 lg:sticky lg:top-0 lg:z-10",
            // Mobile: hidden by default, slide in from left when open
            !isMobileMenuOpen && "hidden lg:block",
            isMobileMenuOpen && "fixed inset-y-0 left-0 w-80 block lg:relative lg:inset-auto lg:w-64",
            "shadow-2xl"
          )}
        >
      {/* Single Scrollable Container */}
      <div className="h-full overflow-y-auto overflow-x-hidden">
        {/* Mobile Close Button */}
        <div className={cn(
          "lg:hidden flex justify-end p-4 border-b",
          sidebarTheme === 'dark' ? "border-[#34495E]" : "border-gray-300"
        )}>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={closeMobileMenu}
            className={cn(
              sidebarTheme === 'dark' ? "text-white hover:bg-[#34495E]" : "text-gray-700 hover:bg-gray-200"
            )}
            data-testid="button-close-mobile-menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Beautiful Logo Section */}
        <div className={cn(
          "p-6 border-b backdrop-blur-sm",
          sidebarTheme === 'dark' ? "border-gray-700/30" : "border-gray-200/30"
        )}>
          <Link href="/" className="flex flex-col items-center text-center group hover-lift" data-testid="link-logo" onClick={closeMobileMenu}>
            {/* Enhanced organization logo with gradient backdrop */}
            <div className="relative mb-4">
              {userProfile?.data?.organization_logo ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary-600/20 rounded-xl blur-lg" />
                  <img 
                    src={userProfile.data.organization_logo} 
                    alt="Organization Logo" 
                    className="relative h-14 w-14 object-contain rounded-xl shadow-lg"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-600 rounded-xl blur-lg opacity-50" />
                  <div className="relative h-14 w-14 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center shadow-xl">
                    <Receipt className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}
            </div>
            <div>
              <h1 className={cn(
                "text-sm font-bold transition-all duration-200",
                sidebarTheme === 'dark' 
                  ? "text-white group-hover:text-primary-300" 
                  : "text-gray-800 group-hover:text-primary-600"
              )}>
                {profileLoading ? "Loading..." : (userProfile?.data?.organization_name || "EZII")}
              </h1>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="py-2">
          <ul className="space-y-1">
            {rolesLoading ? (
              // Loading skeleton
              <div className="px-6 py-2">
                <div className="animate-pulse">
                  <div className={cn(
                    "h-4 rounded mb-2",
                    sidebarTheme === 'dark' ? "bg-gray-600" : "bg-gray-300"
                  )}></div>
                  <div className={cn(
                    "h-4 rounded w-3/4",
                    sidebarTheme === 'dark' ? "bg-gray-600" : "bg-gray-300"
                  )}></div>
                </div>
              </div>
            ) : (
              currentMenuItems.map((item, index) => {
              if (item.isSection) {
                const isExpanded = expandedSections.includes(item.label);
                return (
                  <li key={index}>
                    <div className="px-6 py-2">
                      <button
                        onClick={() => toggleSection(item.label)}
                        className={cn(
                          "text-xs font-bold uppercase tracking-wider flex items-center gap-3 w-full text-left transition-all duration-200 px-2 py-1 rounded-lg group focus-ring",
                          sidebarTheme === 'dark' 
                            ? "text-gray-400 hover:text-white hover:bg-gray-700/50" 
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                        )}
                        aria-expanded={isExpanded}
                        aria-controls={`section-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label} section`}
                      >
                        {isExpanded ? 
                          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" /> : 
                          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        }
                        {item.label}
                      </button>
                    </div>
                    {item.items && isExpanded && (
                      <ul className="space-y-1">
                        {item.items.map((subItem: any, subIndex: number) => {
                          // Handle subsections (like Payments with nested items)
                          if (subItem.isSubSection) {
                            const subSectionKey = `${item.label}-${subItem.label}`;
                            const isSubExpanded = expandedSections.includes(subSectionKey);
                            return (
                              <li key={subIndex}>
                                <button
                                  onClick={() => toggleSection(subSectionKey)}
                                  className={cn(
                                    "w-full px-6 py-2 ml-2 text-left transition-colors",
                                    sidebarTheme === 'dark' ? "hover:bg-[#34495E]" : "hover:bg-gray-200"
                                  )}
                                >
                                  <p className={cn(
                                    "text-xs font-medium uppercase tracking-wider flex items-center gap-2",
                                    sidebarTheme === 'dark' ? "text-gray-300" : "text-gray-600"
                                  )}>
                                    {isSubExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    <i className={`${subItem.icon} w-3`}></i>
                                    {subItem.label}
                                  </p>
                                </button>
                                {subItem.items && isSubExpanded && (
                                  <ul className="space-y-1">
                                    {subItem.items.map((nestedItem: any, nestedIndex: number) => (
                                      <li key={nestedIndex}>
                                        <Link
                                          href={nestedItem.path}
                                          className={cn(
                                            "flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ml-8 rounded-lg mx-2 group hover-lift",
                                            sidebarTheme === 'dark' ? "hover:bg-gray-700/30" : "hover:bg-primary/5",
                                            isActivePath(nestedItem.path) 
                                              ? "bg-gradient-to-r from-primary to-primary-600 text-white font-semibold shadow-md" 
                                              : sidebarTheme === 'dark' ? "text-gray-300" : "text-gray-700"
                                          )}
                                          onClick={closeMobileMenu}
                                          data-testid={`link-${nestedItem.label.toLowerCase().replace(/\s+/g, '-')}`}
                                        >
                                          {(() => {
                                            const IconComponent = getIconComponent(nestedItem.icon);
                                            return <IconComponent className={cn(
                                              "w-4 h-4 transition-all duration-200 group-hover:scale-110",
                                              isActivePath(nestedItem.path) 
                                                ? "text-white" 
                                                : sidebarTheme === 'dark' ? "text-gray-400" : "text-gray-500"
                                            )} />;
                                          })()}
                                          <span className="font-medium">{nestedItem.label}</span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          }
                          
                          // Handle regular sub-items (like Receipts)
                          return (
                            <li key={subIndex}>
                              <Link
                                href={subItem.path!}
                                className={cn(
                                  "flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ml-4 rounded-lg mx-2 group hover-lift",
                                  sidebarTheme === 'dark' ? "hover:bg-gray-700/30" : "hover:bg-primary/5",
                                  isActivePath(subItem.path!) 
                                    ? "bg-gradient-to-r from-primary to-primary-600 text-white font-semibold shadow-md" 
                                    : sidebarTheme === 'dark' ? "text-gray-300" : "text-gray-700"
                                )}
                                onClick={closeMobileMenu}
                                data-testid={`nav-${subItem.label.toLowerCase().replace(/\s+/g, '-')}`}
                                data-tutorial-element={`navigation-${subItem.label.toLowerCase().replace(/\s+/g, '-')}`}
                                data-tutorial-description={`Navigate to ${subItem.label} section`}
                              >
                                {(() => {
                                  const IconComponent = getIconComponent(subItem.icon);
                                  return <IconComponent className={cn(
                                    "w-4 h-4 transition-all duration-200 group-hover:scale-110",
                                    isActivePath(subItem.path!) 
                                      ? "text-white" 
                                      : sidebarTheme === 'dark' ? "text-gray-400" : "text-gray-500"
                                  )} />;
                                })()}
                                <span className="font-medium">{subItem.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={index}>
                  <Link
                    href={item.path!}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 rounded-lg mx-2 group hover-lift focus-ring interactive",
                      sidebarTheme === 'dark' ? "hover:bg-gray-700/30" : "hover:bg-primary/5",
                      isActivePath(item.path!) 
                        ? "bg-gradient-to-r from-primary to-primary-600 text-white font-semibold shadow-md shadow-primary/25" 
                        : sidebarTheme === 'dark' ? "text-gray-300" : "text-gray-700"
                    )}
                    onClick={closeMobileMenu}
                    aria-current={isActivePath(item.path!) ? "page" : undefined}
                    aria-label={`Navigate to ${item.label} section`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    data-tutorial-element={`navigation-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    data-tutorial-description={`Navigate to ${item.label} section`}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(item.icon);
                      return <IconComponent className={cn(
                        "w-5 h-5 transition-all duration-200 group-hover:scale-110",
                        isActivePath(item.path!) 
                          ? "text-white" 
                          : sidebarTheme === 'dark' ? "text-gray-400" : "text-gray-500"
                      )} />;
                    })()}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })
            )}
          </ul>
        </nav>

        {/* Role Toggle - Part of Scrollable Content */}
        <div className={cn(
          "border-t p-3 mt-4",
          sidebarTheme === 'dark' ? "border-[#34495E]" : "border-gray-300"
        )}>
          <div className="flex flex-col gap-2">
            <span className={cn(
              "text-xs uppercase tracking-wider",
              sidebarTheme === 'dark' ? "text-gray-400" : "text-gray-500"
            )}>Role:</span>
            <div className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded",
              sidebarTheme === 'dark' ? "bg-[#34495E]" : "bg-gray-200"
            )}>
              <div className="flex items-center gap-1.5">
                <User className={cn(
                  "h-3 w-3",
                  sidebarTheme === 'dark' ? "text-gray-300" : "text-gray-600"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  sidebarTheme === 'dark' ? "text-gray-300" : "text-gray-600"
                )}>Employee</span>
              </div>
              <Switch 
                checked={isAdmin}
                onCheckedChange={toggleRole}
                data-testid="toggle-admin-role"
                className="data-[state=checked]:bg-blue-500 scale-75"
              />
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">Admin</span>
              </div>
            </div>
            <div className={cn(
              "px-2 py-1 rounded text-center",
              isAdmin 
                ? (sidebarTheme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700')
                : (sidebarTheme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700')
            )}>
              <span className="text-xs font-medium" data-testid="text-current-role">
                {isAdmin ? "Admin View" : "Employee View"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  {/* Mobile ProductSwitcher - Bottom Bar */}
  <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gray-800 border-t border-gray-700">
    <div className="flex overflow-x-auto py-2 px-4 space-x-4">
      <MobileProductSwitcher />
    </div>
  </div>
  </>
  );
}