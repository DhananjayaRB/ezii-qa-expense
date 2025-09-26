import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {
  Shield,
  Plus,
  Save,
  Trash2,
  Edit,
  Users,
  Menu,
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// Define available menu items that can be assigned to roles - SYNCHRONIZED with MENU_KEY_MAPPING for security
const AVAILABLE_MENUS = [
  { key: "dashboard", label: "Dashboard", path: "/" },
  { key: "vendors", label: "Vendor Master", path: "/vendors" },
  { key: "vendor-add", label: "Add Vendor", path: "/vendors/add" },
  { key: "vendor-claim", label: "Vendor Claim", path: "/vendors/claim" },
  { key: "contracts", label: "Contract Master", path: "/contracts" },
  { key: "vendor-reports", label: "Vendor Reports", path: "/vendor-reports" },
  { key: "petty-cash", label: "Petty Cash", path: "/petty-cash" },
  { key: "direct-expenses", label: "Direct Expenses", path: "/direct-expenses" },
  { key: "payments-initiate", label: "Initiate Payments", path: "/accountant/payments/initiate" },
  { key: "payments-process", label: "Process Payments", path: "/accountant/payments/process" },
  { key: "payments-release", label: "Release Bills", path: "/accountant/payments/release-bills" },
  { key: "card-statements", label: "Card Statements", path: "/accountant/payments/card-stmt" },
  { key: "receipts", label: "Receipts", path: "/accountant/receipts" },
  { key: "reports", label: "Reports", path: "/reports" },
  { key: "configuration", label: "Configuration", path: "/configuration" },
  { key: "access-rights", label: "Access Rights Management", path: "/config/access-rights" },
  { key: "admin", label: "Admin", path: "/admin" },
  { key: "employee-request", label: "Employee Request", path: "/employee/request" },
  { key: "employee-claim", label: "Employee Claim", path: "/employee/claim" },
  { key: "employee-uploads", label: "Employee Uploads", path: "/employee/uploads" },
  { key: "approval-tracker", label: "Approval Tracker", path: "/employee/approval-tracker" },
  { key: "vendor-onboarding", label: "Vendor Onboarding Request", path: "/vendor-onboarding/request" },
  { key: "approvals", label: "Approvals", path: "/approvals" }
];

interface WorkflowRole {
  id: string;
  name: string;
  description?: string;
  menuKeys?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoleMenuAssignment {
  roleId: string;
  roleName: string;
  assignedMenus: string[];
}

export default function AccessRights() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<WorkflowRole | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [roleMenus, setRoleMenus] = useState<string[]>([]);

  // Fetch workflow roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<WorkflowRole[]>({
    queryKey: ["/api/workflow-roles"],
  });

  // Update role menu assignment
  const updateRoleMenus = useMutation({
    mutationFn: async ({ roleId, menuKeys }: { roleId: string; menuKeys: string[] }) => {
      return apiRequest(`/api/workflow-roles/${roleId}`, {
        method: "PUT",
        body: {
          menuKeys: JSON.stringify(menuKeys)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-roles"] });
      toast({
        title: "Success",
        description: "Role access rights updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update role access rights",
        variant: "destructive"
      });
    }
  });

  // Handle role selection
  const handleRoleSelect = (role: WorkflowRole) => {
    setSelectedRole(role);
    setIsEditing(true); // Automatically enable editing mode
    
    // Parse existing menu keys
    let existingMenus: string[] = [];
    if (role.menuKeys) {
      try {
        existingMenus = JSON.parse(role.menuKeys);
      } catch (e) {
        // If menuKeys is not valid JSON, treat as empty array
        existingMenus = [];
      }
    }
    setRoleMenus(existingMenus);
  };

  // Handle menu selection
  const handleMenuToggle = (menuKey: string) => {
    setRoleMenus(prev => {
      if (prev.includes(menuKey)) {
        return prev.filter(key => key !== menuKey);
      } else {
        return [...prev, menuKey];
      }
    });
  };

  // Save changes
  const handleSave = () => {
    if (!selectedRole) return;
    
    updateRoleMenus.mutate({
      roleId: selectedRole.id,
      menuKeys: roleMenus
    });
  };

  // Get assigned menu count for a role
  const getAssignedMenuCount = (role: WorkflowRole) => {
    if (!role.menuKeys) return 0;
    try {
      const menus = JSON.parse(role.menuKeys);
      return Array.isArray(menus) ? menus.length : 0;
    } catch (e) {
      return 0;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Access Rights Management</h1>
                <p className="text-gray-600">Configure menu access rights for different roles</p>
              </div>
              <span className="text-sm text-gray-500 flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Configuration
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Roles List */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-blue-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <Users className="w-5 h-5 mr-2" />
                    Workflow Roles
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {rolesLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading roles...</div>
                  ) : roles.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No roles found</div>
                  ) : (
                    <div className="space-y-0">
                      {roles.map((role: WorkflowRole) => (
                        <div
                          key={role.id}
                          className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedRole?.id === role.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          data-testid={`role-item-${role.name.toLowerCase()}`}
                          onClick={() => handleRoleSelect(role)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{role.name}</h3>
                              {role.description && (
                                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={role.isActive ? "default" : "secondary"}>
                                  {role.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline">
                                  {getAssignedMenuCount(role)} menus
                                </Badge>
                              </div>
                            </div>
                            {selectedRole?.id === role.id && (
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Menu Assignment */}
              <Card className="lg:col-span-2 border-0 shadow-md">
                <CardHeader className="bg-orange-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center justify-between text-lg font-semibold">
                    <div className="flex items-center">
                      <Menu className="w-5 h-5 mr-2" />
                      Menu Access Rights
                      {selectedRole && (
                        <span className="ml-2 text-sm font-normal opacity-90">
                          for {selectedRole.name}
                        </span>
                      )}
                    </div>
                    {selectedRole && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // Reset to original state
                            handleRoleSelect(selectedRole);
                          }}
                          data-testid="button-reset-changes"
                        >
                          Reset
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSave}
                          disabled={updateRoleMenus.isPending}
                          data-testid="button-save-access"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {updateRoleMenus.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {!selectedRole ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Role</h3>
                      <p className="text-gray-600">
                        Choose a role from the left panel to configure its menu access rights
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Role Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Role Information</h4>
                        <p className="text-sm text-gray-600">
                          <strong>Name:</strong> {selectedRole.name}
                        </p>
                        {selectedRole.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Description:</strong> {selectedRole.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Status:</strong> 
                          <Badge variant={selectedRole.isActive ? "default" : "secondary"} className="ml-2">
                            {selectedRole.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </p>
                      </div>

                      {/* Menu Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Available Menus</h4>
                          <div className="text-sm text-gray-600">
                            {roleMenus.length} of {AVAILABLE_MENUS.length} selected
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                          {AVAILABLE_MENUS.map((menu) => (
                            <div
                              key={menu.key}
                              className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors hover:bg-gray-50 cursor-pointer ${
                                roleMenus.includes(menu.key) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                              }`}
                              onClick={() => handleMenuToggle(menu.key)}
                              data-testid={`menu-item-${menu.key}`}
                            >
                              <Checkbox
                                checked={roleMenus.includes(menu.key)}
                                onCheckedChange={() => handleMenuToggle(menu.key)}
                                data-testid={`checkbox-${menu.key}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">{menu.label}</div>
                                <div className="text-xs text-gray-500">{menu.path}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      {roleMenus.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h5 className="font-medium text-green-900 mb-2">Selected Menus Summary</h5>
                          <div className="flex flex-wrap gap-2">
                            {roleMenus.map((menuKey) => {
                              const menu = AVAILABLE_MENUS.find(m => m.key === menuKey);
                              return menu ? (
                                <Badge key={menuKey} variant="outline" className="text-green-700 border-green-300">
                                  {menu.label}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Help Information */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Access Rights Overview</h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Configure which menu items each role can access in the system. Users with specific roles will only see 
                the menu items assigned to their role. Changes take effect immediately after saving. Make sure to assign 
                essential menus like Dashboard to each active role for proper system navigation.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}