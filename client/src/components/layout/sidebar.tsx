import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Receipt, ChevronDown, ChevronRight, User, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRoleToggle } from "@/hooks/useRoleToggle";
import { useRoleMenus } from "@/hooks/useRoleMenus";
import { Switch } from "@/components/ui/switch";
import { ProductSwitcher } from "@/components/ui/product-switcher";

const menuItems = [
  { path: "/", label: "Dashboard", icon: "fas fa-home" },
  { path: "/approvals", label: "Pending Approvals", icon: "fas fa-check-double" },
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
  { path: "/configuration", label: "Configuration", icon: "fas fa-cog" },
  { path: "/admin", label: "Admin", icon: "fas fa-user-shield" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { isAdmin, currentRole, toggleRole } = useRoleToggle();
  const { filterMenuItems, rolesLoading, hasPermissions, userRoleName } = useRoleMenus();
  
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
    <div className="flex">
      <ProductSwitcher />
      <div key={`sidebar-${currentRole}-${isAdmin}-${forceUpdate}`} className="w-60 bg-[#2C3E50] text-white flex-shrink-0 h-screen sticky top-0 z-10">
      {/* Single Scrollable Container */}
      <div className="h-full overflow-y-auto overflow-x-hidden">
        {/* Logo Section */}
        <div className="p-6 border-b border-[#34495E]">
          <Link href="/" className="flex flex-col items-center text-center group" data-testid="link-logo">
            {/* Use organization logo from API if available */}
            <div className="relative mb-3">
              {userProfile?.data?.organization_logo ? (
                <img 
                  src={userProfile.data.organization_logo} 
                  alt="Organization Logo" 
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Receipt className="h-7 w-7 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
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
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
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
                        className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2 w-full text-left hover:text-white"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
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
                                  className="w-full px-6 py-2 ml-2 text-left hover:bg-[#34495E] transition-colors"
                                >
                                  <p className="text-xs font-medium text-gray-300 uppercase tracking-wider flex items-center gap-2">
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
                                            "flex items-center gap-3 px-6 py-2 text-sm transition-colors ml-8 hover:bg-[#34495E]",
                                            isActivePath(nestedItem.path) && "bg-[#3498DB] font-medium"
                                          )}
                                          data-testid={`link-${nestedItem.label.toLowerCase().replace(/\s+/g, '-')}`}
                                        >
                                          <i className={`${nestedItem.icon} text-gray-300 w-4 text-xs`}></i>
                                          <span>{nestedItem.label}</span>
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
                                  "flex items-center gap-3 px-6 py-2 text-sm transition-colors ml-4 hover:bg-[#34495E]",
                                  isActivePath(subItem.path!) && "bg-[#3498DB] font-medium"
                                )}
                                data-testid={`link-${subItem.label.toLowerCase()}`}
                              >
                                <i className={`${subItem.icon} text-gray-300 w-4`}></i>
                                <span>{subItem.label}</span>
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
                      "flex items-center gap-3 px-6 py-3 text-sm transition-colors hover:bg-[#34495E]",
                      isActivePath(item.path!) ? "bg-[#3498DB] font-medium" : ""
                    )}
                    data-testid={`link-${item.label.toLowerCase()}`}
                  >
                    <i className={`${item.icon} text-gray-300 w-4`}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })
            )}
          </ul>
        </nav>

        {/* Role Toggle - Part of Scrollable Content */}
        <div className="border-t border-[#34495E] p-3 mt-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Role:</span>
            <div className="flex items-center gap-2 bg-[#34495E] px-2 py-1.5 rounded">
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-gray-300" />
                <span className="text-xs font-medium text-gray-300">Employee</span>
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
            <div className={`px-2 py-1 rounded text-center ${isAdmin ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
              <span className="text-xs font-medium" data-testid="text-current-role">
                {isAdmin ? "Admin View" : "Employee View"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}