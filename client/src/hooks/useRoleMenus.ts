import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";

interface WorkflowRole {
  id: string;
  name: string;
  description?: string;
  menuKeys?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Menu key mapping - maps menu items to their permission keys
const MENU_KEY_MAPPING: Record<string, string> = {
  "/": "dashboard",
  "/vendors": "vendors",
  "/vendors/add": "vendor-add",
  "/vendors/claim": "vendor-claim",
  "/contracts": "contracts",
  "/vendor-reports": "vendor-reports",
  "/petty-cash": "petty-cash",
  "/direct-expenses": "direct-expenses",
  "/accountant/payments/initiate": "payments-initiate",
  "/accountant/payments/process": "payments-process",
  "/accountant/payments/release-bills": "payments-release",
  "/accountant/payments/card-stmt": "card-statements",
  "/accountant/receipts": "receipts",
  "/reports": "reports",
  "/configuration": "configuration",
  "/config/access-rights": "access-rights",
  "/config/utility-categories": "utility-categories",
  "/config/units-of-measurement": "units-of-measurement",
  "/admin": "admin",
  "/employee/request": "employee-request",
  "/employee/claim": "employee-claim",
  "/employee/uploads": "employee-uploads",
  "/employee/approval-tracker": "approval-tracker",
  "/vendor-onboarding/request": "vendor-onboarding",
  "/approvals": "approvals"
};

export function useRoleMenus() {
  const [allowedMenuKeys, setAllowedMenuKeys] = useState<string[]>([]);

  // Fetch user's menu permissions directly from the new endpoint
  const { data: menuPermissions, isLoading: rolesLoading } = useQuery<{ allowedMenuKeys: string[] }>({
    queryKey: ["/api/me/menu-permissions"],
  });

  // Process menu permissions
  useEffect(() => {
    if (menuPermissions && menuPermissions.allowedMenuKeys) {
      setAllowedMenuKeys(menuPermissions.allowedMenuKeys);
    } else {
      // Default permissions if no data
      setAllowedMenuKeys(["dashboard"]);
    }
  }, [menuPermissions]);

  // Function to check if a menu path is allowed
  const isMenuAllowed = useMemo(() => {
    return (menuPath: string): boolean => {
      const menuKey = MENU_KEY_MAPPING[menuPath];
      if (!menuKey) {
        // SECURITY: Fail-closed - deny access to unmapped paths by default
        console.warn("Menu path not found in mapping, denying access:", menuPath);
        return false;
      }
      return allowedMenuKeys.includes(menuKey);
    };
  }, [allowedMenuKeys]);

  // Function to check if a menu key is allowed
  const isMenuKeyAllowed = useMemo(() => {
    return (menuKey: string): boolean => {
      return allowedMenuKeys.includes(menuKey);
    };
  }, [allowedMenuKeys]);

  // Filter menu items based on permissions
  const filterMenuItems = useMemo(() => {
    return (menuItems: any[]): any[] => {
      return menuItems.filter(item => {
        // For leaf items with paths
        if (item.path) {
          return isMenuAllowed(item.path);
        }

        // For sections, check if any child items are allowed
        if (item.items) {
          const filteredChildItems = item.items.filter((childItem: any) => {
            if (childItem.path) {
              return isMenuAllowed(childItem.path);
            }
            
            // For sub-sections with nested items
            if (childItem.items) {
              return childItem.items.some((nestedItem: any) => 
                nestedItem.path ? isMenuAllowed(nestedItem.path) : true
              );
            }
            
            return true;
          });
          
          return filteredChildItems.length > 0;
        }

        // Default to allow if no specific rules
        return true;
      }).map(item => {
        // Filter child items for sections
        if (item.items) {
          return {
            ...item,
            items: item.items.filter((childItem: any) => {
              if (childItem.path) {
                return isMenuAllowed(childItem.path);
              }
              
              if (childItem.items) {
                const filteredNestedItems = childItem.items.filter((nestedItem: any) => 
                  nestedItem.path ? isMenuAllowed(nestedItem.path) : true
                );
                return filteredNestedItems.length > 0;
              }
              
              return true;
            }).map((childItem: any) => {
              // Filter nested items if any
              if (childItem.items) {
                return {
                  ...childItem,
                  items: childItem.items.filter((nestedItem: any) => 
                    nestedItem.path ? isMenuAllowed(nestedItem.path) : true
                  )
                };
              }
              return childItem;
            })
          };
        }
        return item;
      });
    };
  }, [isMenuAllowed]);

  return {
    allowedMenuKeys,
    userRoleName: null, // Not needed anymore since we get permissions directly from server
    isMenuAllowed,
    isMenuKeyAllowed,
    filterMenuItems,
    rolesLoading,
    hasPermissions: allowedMenuKeys.length > 0
  };
}