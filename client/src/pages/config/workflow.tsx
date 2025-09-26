import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  insertWorkflowRoleSchema, 
  insertWorkflowSchema,
  insertWorkflowLevelSchema,
  insertWorkflowAssignmentSchema,
  type WorkflowRole, 
  type InsertWorkflowRole,
  type Workflow,
  type InsertWorkflow,
  type WorkflowLevel,
  type InsertWorkflowLevel,
  type WorkflowAssignment,
  type InsertWorkflowAssignment
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings,
  Users,
  Workflow as WorkflowIcon,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Target
} from "lucide-react";

export default function WorkflowConfig() {
  const [activeTab, setActiveTab] = useState("roles");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<WorkflowRole | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<WorkflowAssignment | null>(null);
  const { toast } = useToast();

  // Process type options
  const processTypeOptions = [
    { value: "request", label: "Expense Request" },
    { value: "claim", label: "Expense Claim" },
    { value: "payment", label: "Payment Processing" },
    { value: "vendor", label: "Vendor Onboarding" },
    { value: "vendorclaim", label: "Vendor Claims" },
    { value: "pettycash", label: "Petty Cashbox" },
    { value: "directexpense", label: "Direct Expense" },
  ];

  // Fetch workflow roles
  const { data: workflowRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/workflow-roles"],
    retry: false,
  }) as { data: WorkflowRole[], isLoading: boolean };

  // Fetch workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows"],
    retry: false,
  }) as { data: Workflow[], isLoading: boolean };

  // Fetch workflow assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/workflow-assignments"],
    retry: false,
  }) as { data: WorkflowAssignment[], isLoading: boolean };

  // Fetch vendors for assignment options
  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/vendors"],
    retry: false,
  }) as { data: Array<{ id: string; name: string }> };

  // Fetch expense categories for assignment options
  const { data: expenseCategories = [] } = useQuery({
    queryKey: ["/api/expense-categories"],
    retry: false,
  }) as { data: Array<{ id: string; name: string }> };

  // Role form setup
  const roleForm = useForm<InsertWorkflowRole>({
    resolver: zodResolver(insertWorkflowRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  // Workflow form setup with levels
  const workflowForm = useForm<InsertWorkflow & { levels: Array<Omit<InsertWorkflowLevel, 'workflowId'>> }>({
    resolver: zodResolver(insertWorkflowSchema.extend({
      levels: z.array(z.object({
        level: z.number().min(1),
        roleId: z.string().min(1, "Role is required"),
        minAmount: z.string().optional(),
        maxAmount: z.string().optional(),
        isRequired: z.boolean().default(true),
      })).min(1, "At least one approval level is required"),
    })),
    defaultValues: {
      name: "",
      description: "",
      processTypes: "[]",
      approvalConditionType: "process-based",
      isActive: true,
      isDefault: false,
      levels: [{ level: 1, roleId: "", minAmount: "", maxAmount: "", isRequired: true }],
    },
  });

  // Assignment form setup
  const assignmentForm = useForm<InsertWorkflowAssignment>({
    resolver: zodResolver(insertWorkflowAssignmentSchema),
    defaultValues: {
      workflowId: "",
      processType: "",
      vendorId: "",
      expenseHeadId: "",
      isDefault: false,
      priority: 0,
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: InsertWorkflowRole) =>
      apiRequest("/api/workflow-roles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-roles"] });
      setRoleDialogOpen(false);
      roleForm.reset();
      toast({
        title: "Success",
        description: "Workflow role created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workflow role",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertWorkflowRole }) =>
      apiRequest(`/api/workflow-roles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-roles"] });
      setRoleDialogOpen(false);
      setEditingRole(null);
      roleForm.reset();
      toast({
        title: "Success",
        description: "Workflow role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update workflow role",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/workflow-roles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-roles"] });
      toast({
        title: "Success",
        description: "Workflow role deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete workflow role",
        variant: "destructive",
      });
    },
  });

  const handleAddRole = () => {
    setEditingRole(null);
    roleForm.reset({
      name: "",
      description: "",
      isActive: true,
    });
    setRoleDialogOpen(true);
  };

  const handleEditRole = (role: WorkflowRole) => {
    setEditingRole(role);
    roleForm.reset({
      name: role.name,
      description: role.description || "",
      isActive: role.isActive,
    });
    setRoleDialogOpen(true);
  };

  const handleDeleteRole = (id: string) => {
    deleteRoleMutation.mutate(id);
  };

  const onSubmitRole = (data: InsertWorkflowRole) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: (data: InsertWorkflow & { levels: Array<Omit<InsertWorkflowLevel, 'workflowId'>> }) =>
      apiRequest("/api/workflows", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setWorkflowDialogOpen(false);
      workflowForm.reset();
      toast({
        title: "Success",
        description: "Workflow created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workflow",
        variant: "destructive",
      });
    },
  });

  // Update workflow mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertWorkflow & { levels: Array<Omit<InsertWorkflowLevel, 'workflowId'>> } }) =>
      apiRequest(`/api/workflows/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setWorkflowDialogOpen(false);
      setEditingWorkflow(null);
      workflowForm.reset();
      toast({
        title: "Success",
        description: "Workflow updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update workflow",
        variant: "destructive",
      });
    },
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/workflows/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete workflow",
        variant: "destructive",
      });
    },
  });

  const handleAddWorkflow = () => {
    setEditingWorkflow(null);
    workflowForm.reset({
      name: "",
      description: "",
      processTypes: "[]",
      approvalConditionType: "process-based",
      isActive: true,
      isDefault: false,
      levels: [{ level: 1, roleId: "", minAmount: "", maxAmount: "", isRequired: true }],
    });
    setWorkflowDialogOpen(true);
  };

  const handleEditWorkflow = async (workflow: Workflow) => {
    try {
      setEditingWorkflow(workflow);
      const processTypes = JSON.parse(workflow.processTypes || '[]');
      
      // Fetch the workflow levels first, then open dialog
      const levels = await queryClient.fetchQuery({
        queryKey: ["/api/workflows", workflow.id, "levels"],
      });
      
      const typedLevels = levels as WorkflowLevel[] || [];
      workflowForm.reset({
        name: workflow.name,
        description: workflow.description || "",
        processTypes: JSON.stringify(processTypes),
        approvalConditionType: (workflow as any).approvalConditionType || "process-based",
        isActive: workflow.isActive,
        isDefault: workflow.isDefault,
        levels: typedLevels.length > 0 
          ? typedLevels.map(level => ({
              level: level.level,
              roleId: level.roleId,
              minAmount: level.minAmount?.toString() || "",
              maxAmount: level.maxAmount?.toString() || "",
              isRequired: level.isRequired,
            }))
          : [{ level: 1, roleId: "", minAmount: "", maxAmount: "", isRequired: true }],
      });
      
      // Only open dialog after form is populated
      setWorkflowDialogOpen(true);
      
    } catch (error) {
      console.error("Error loading workflow for editing:", error);
      toast({
        title: "Error",
        description: "Failed to load workflow data for editing",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkflow = (id: string) => {
    deleteWorkflowMutation.mutate(id);
  };

  const onSubmitWorkflow = (data: InsertWorkflow & { levels: Array<Omit<InsertWorkflowLevel, 'workflowId'>> }) => {
    if (editingWorkflow) {
      updateWorkflowMutation.mutate({ id: editingWorkflow.id, data });
    } else {
      createWorkflowMutation.mutate(data);
    }
  };

  // Level management functions
  const addLevel = () => {
    const currentLevels = workflowForm.getValues("levels");
    const nextLevel = currentLevels.length + 1;
    workflowForm.setValue("levels", [
      ...currentLevels,
      { level: nextLevel, roleId: "", minAmount: "", maxAmount: "", isRequired: true }
    ]);
  };

  const removeLevel = (index: number) => {
    const currentLevels = workflowForm.getValues("levels");
    if (currentLevels.length > 1) {
      const newLevels = currentLevels.filter((_, i) => i !== index);
      // Renumber levels
      const renumberedLevels = newLevels.map((level, i) => ({ ...level, level: i + 1 }));
      workflowForm.setValue("levels", renumberedLevels);
    }
  };

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (data: InsertWorkflowAssignment) =>
      apiRequest("/api/workflow-assignments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-assignments"] });
      setAssignmentDialogOpen(false);
      assignmentForm.reset();
      toast({
        title: "Success",
        description: "Workflow assignment created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workflow assignment",
        variant: "destructive",
      });
    },
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertWorkflowAssignment }) =>
      apiRequest(`/api/workflow-assignments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-assignments"] });
      setAssignmentDialogOpen(false);
      setEditingAssignment(null);
      assignmentForm.reset();
      toast({
        title: "Success",
        description: "Workflow assignment updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update workflow assignment",
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/workflow-assignments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-assignments"] });
      toast({
        title: "Success",
        description: "Workflow assignment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete workflow assignment",
        variant: "destructive",
      });
    },
  });

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    assignmentForm.reset({
      workflowId: "",
      processType: "",
      vendorId: "",
      expenseHeadId: "",
      isDefault: false,
      priority: 0,
    });
    setAssignmentDialogOpen(true);
  };

  const handleEditAssignment = (assignment: WorkflowAssignment) => {
    setEditingAssignment(assignment);
    assignmentForm.reset({
      workflowId: assignment.workflowId,
      processType: assignment.processType,
      vendorId: assignment.vendorId || "",
      expenseHeadId: assignment.expenseHeadId || "",
      isDefault: assignment.isDefault,
      priority: assignment.priority,
    });
    setAssignmentDialogOpen(true);
  };

  const handleDeleteAssignment = (id: string) => {
    deleteAssignmentMutation.mutate(id);
  };

  const onSubmitAssignment = (data: InsertWorkflowAssignment) => {
    // Clean up empty optional fields
    const cleanData = {
      ...data,
      vendorId: data.vendorId || undefined,
      expenseHeadId: data.expenseHeadId || undefined,
    };
    
    if (editingAssignment) {
      updateAssignmentMutation.mutate({ id: editingAssignment.id, data: cleanData });
    } else {
      createAssignmentMutation.mutate(cleanData);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Workflow Configuration
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Configure roles, workflows, and assignments for your expense management system
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Workflow Roles
                </TabsTrigger>
                <TabsTrigger value="workflows" className="flex items-center gap-2">
                  <WorkflowIcon className="h-4 w-4" />
                  Workflows
                </TabsTrigger>
                <TabsTrigger value="assignments" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Assignments
                </TabsTrigger>
              </TabsList>

              {/* Workflow Roles Tab */}
              <TabsContent value="roles" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Workflow Roles
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage roles that can be assigned to workflow levels
                      </p>
                    </div>
                    <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={handleAddRole}
                          className="flex items-center gap-2"
                          data-testid="button-add-role"
                        >
                          <Plus className="h-4 w-4" />
                          Add Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>
                            {editingRole ? "Edit Workflow Role" : "Add New Workflow Role"}
                          </DialogTitle>
                        </DialogHeader>
                        <Form {...roleForm}>
                          <form onSubmit={roleForm.handleSubmit(onSubmitRole)} className="space-y-4">
                            <FormField
                              control={roleForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Role Name *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g., Finance Manager, Department Head" 
                                      {...field}
                                      data-testid="input-role-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Brief description of this role's responsibilities..."
                                      rows={3}
                                      {...field}
                                      value={field.value || ""}
                                      data-testid="input-role-description"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>Active Role</FormLabel>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      Inactive roles cannot be assigned to workflows
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid="switch-role-active"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end gap-2 pt-4">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setRoleDialogOpen(false)}
                                data-testid="button-cancel-role"
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                                data-testid="button-save-role"
                              >
                                {createRoleMutation.isPending || updateRoleMutation.isPending 
                                  ? "Saving..." 
                                  : editingRole ? "Update Role" : "Create Role"
                                }
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {rolesLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Loading roles...</div>
                      </div>
                    ) : workflowRoles.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No workflow roles configured
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Create your first workflow role to get started with configurable approvals
                        </p>
                        <Button 
                          onClick={handleAddRole}
                          className="flex items-center gap-2" 
                          data-testid="button-create-first-role"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Role
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workflowRoles.map((role: any) => (
                          <div
                            key={role.id}
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                            data-testid={`card-role-${role.id}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white" data-testid={`text-role-name-${role.id}`}>
                                  {role.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {role.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={role.isActive ? "default" : "secondary"}
                                data-testid={`status-role-${role.id}`}
                              >
                                {role.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditRole(role)}
                                data-testid={`button-edit-role-${role.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-delete-role-${role.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Workflow Role</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the role "{role.name}"? This action cannot be undone and may affect existing workflows that use this role.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel data-testid={`button-cancel-delete-role-${role.id}`}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteRole(role.id)}
                                      disabled={deleteRoleMutation.isPending}
                                      data-testid={`button-confirm-delete-role-${role.id}`}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Workflows Tab */}
              <TabsContent value="workflows" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <WorkflowIcon className="h-5 w-5" />
                        Workflows
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Configure multi-level approval workflows for different processes
                      </p>
                    </div>
                    <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={handleAddWorkflow}
                          className="flex items-center gap-2"
                          data-testid="button-add-workflow"
                        >
                          <Plus className="h-4 w-4" />
                          Create Workflow
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
                        <DialogHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
                          <DialogTitle className="text-2xl font-bold text-center">
                            {editingWorkflow ? "Edit Workflow" : "Create New Workflow"}
                          </DialogTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                            Configure approval workflows with custom conditions and multi-level approvals
                          </p>
                        </DialogHeader>
                        <Form {...workflowForm}>
                          <form onSubmit={workflowForm.handleSubmit(onSubmitWorkflow)} className="space-y-8 pt-6">
                            {/* Basic Information Section */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                  1
                                </div>
                                Basic Information
                              </h3>
                              <div className="grid grid-cols-1 gap-6">
                              <FormField
                                control={workflowForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Workflow Name *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="e.g., Standard Expense Approval, High Value Payment Approval" 
                                        {...field}
                                        data-testid="input-workflow-name"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={workflowForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Brief description of when this workflow should be used..."
                                        rows={2}
                                        {...field}
                                        value={field.value || ""}
                                        data-testid="input-workflow-description"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              </div>
                            </div>

                            {/* Approval Condition Type Section */}
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
                                  2
                                </div>
                                Approval Strategy
                              </h3>
                            <FormField
                              control={workflowForm.control}
                              name="approvalConditionType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Approval Condition Type *</FormLabel>
                                  <FormControl>
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          id="process-based"
                                          name="approvalConditionType"
                                          value="process-based"
                                          checked={field.value === "process-based"}
                                          onChange={() => field.onChange("process-based")}
                                          className="h-4 w-4"
                                          data-testid="radio-process-based"
                                        />
                                        <label htmlFor="process-based" className="text-sm font-medium">
                                          <span className="font-semibold text-blue-600 dark:text-blue-400">Process-based</span>
                                          <span className="block text-xs text-gray-600 dark:text-gray-400">
                                            Assign approvers based on process type (claims, requests, vendor management, etc.)
                                          </span>
                                        </label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          id="monetary-threshold"
                                          name="approvalConditionType"
                                          value="monetary-threshold"
                                          checked={field.value === "monetary-threshold"}
                                          onChange={() => field.onChange("monetary-threshold")}
                                          className="h-4 w-4"
                                          data-testid="radio-monetary-threshold"
                                        />
                                        <label htmlFor="monetary-threshold" className="text-sm font-medium">
                                          <span className="font-semibold text-green-600 dark:text-green-400">Monetary Threshold-based</span>
                                          <span className="block text-xs text-gray-600 dark:text-gray-400">
                                            Assign approvers based on transaction amount and approval limits per role
                                          </span>
                                        </label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          id="combined"
                                          name="approvalConditionType"
                                          value="combined"
                                          checked={field.value === "combined"}
                                          onChange={() => field.onChange("combined")}
                                          className="h-4 w-4"
                                          data-testid="radio-combined"
                                        />
                                        <label htmlFor="combined" className="text-sm font-medium">
                                          <span className="font-semibold text-purple-600 dark:text-purple-400">Combined</span>
                                          <span className="block text-xs text-gray-600 dark:text-gray-400">
                                            Use both process types and monetary thresholds for flexible approval routing
                                          </span>
                                        </label>
                                      </div>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            </div>

                            {/* Process Types - Conditional rendering based on approval condition */}
                            {(workflowForm.watch("approvalConditionType") === "process-based" || 
                              workflowForm.watch("approvalConditionType") === "combined") && (
                            <FormField
                              control={workflowForm.control}
                              name="processTypes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Process Types *</FormLabel>
                                  {workflowForm.watch("approvalConditionType") === "process-based" && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      Select which processes this workflow will handle. Approval routing will be based on these process types.
                                    </p>
                                  )}
                                  {workflowForm.watch("approvalConditionType") === "combined" && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      Select processes that will use both process-based routing and monetary thresholds.
                                    </p>
                                  )}
                                  <div className="grid grid-cols-2 gap-3">
                                    {processTypeOptions.map((option) => {
                                      const selectedTypes = JSON.parse(field.value || '[]');
                                      const isSelected = selectedTypes.includes(option.value);
                                      
                                      return (
                                        <div key={option.value} className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`process-${option.value}`}
                                            checked={isSelected}
                                            onChange={(e) => {
                                              const currentTypes = JSON.parse(field.value || '[]');
                                              if (e.target.checked) {
                                                field.onChange(JSON.stringify([...currentTypes, option.value]));
                                              } else {
                                                field.onChange(JSON.stringify(currentTypes.filter((t: string) => t !== option.value)));
                                              }
                                            }}
                                            className="h-4 w-4"
                                            data-testid={`checkbox-process-${option.value}`}
                                          />
                                          <label
                                            htmlFor={`process-${option.value}`}
                                            className="text-sm font-medium leading-none"
                                          >
                                            {option.label}
                                          </label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            )}

                            {/* Monetary Threshold Info */}
                            {workflowForm.watch("approvalConditionType") === "monetary-threshold" && (
                              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                                  <strong>Monetary Threshold-based Approval:</strong>
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                  In this mode, approvers are assigned based on transaction amounts and the approval limits set for each role. 
                                  For example: up to ₹50,000 can be approved by Manager, ₹50,001–₹5,00,000 by Director, and above ₹5,00,000 by CEO.
                                  Configure the amount thresholds in the approval levels below.
                                </p>
                              </div>
                            )}

                            {/* Approval Levels Section */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                                  {(workflowForm.watch("approvalConditionType") === "process-based" || workflowForm.watch("approvalConditionType") === "combined") ? "4" : "3"}
                                </div>
                                Approval Levels
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Define the approval hierarchy and assign roles for each level. Each level represents a step in the approval process.
                              </p>
                              
                              <div className="flex items-center justify-between mb-6">
                                <FormLabel className="text-base font-medium">Configure Approval Levels *</FormLabel>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={addLevel}
                                  className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-300 dark:border-purple-700"
                                  data-testid="button-add-level"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add Level
                                </Button>
                              </div>
                              
                              <div className="space-y-6">
                              
                              {workflowForm.watch("levels").map((level, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {level.level}
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-lg">Approval Level {level.level}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Configure the approval role and conditions</p>
                                      </div>
                                    </div>
                                    {workflowForm.watch("levels").length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLevel(index)}
                                        data-testid={`button-remove-level-${index}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-3">
                                    <FormField
                                      control={workflowForm.control}
                                      name={`levels.${index}.roleId`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Approval Role *</FormLabel>
                                          <FormControl>
                                            <select
                                              {...field}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                              data-testid={`select-level-role-${index}`}
                                            >
                                              <option value="">Select a role...</option>
                                              {workflowRoles
                                                .filter((role: WorkflowRole) => role.isActive)
                                                .map((role: WorkflowRole) => (
                                                <option key={role.id} value={role.id}>
                                                  {role.name}
                                                </option>
                                              ))}
                                            </select>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    {/* Monetary Threshold Fields - Conditional rendering based on approval condition */}
                                    {(workflowForm.watch("approvalConditionType") === "monetary-threshold" || 
                                      workflowForm.watch("approvalConditionType") === "combined") && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <FormField
                                        control={workflowForm.control}
                                        name={`levels.${index}.minAmount`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Min Amount (₹) *</FormLabel>
                                            <FormControl>
                                              <Input 
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                value={field.value || ""}
                                                data-testid={`input-level-min-amount-${index}`}
                                              />
                                            </FormControl>
                                            {workflowForm.watch("approvalConditionType") === "monetary-threshold" && (
                                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                                Minimum amount this role can approve
                                              </p>
                                            )}
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={workflowForm.control}
                                        name={`levels.${index}.maxAmount`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Max Amount (₹)</FormLabel>
                                            <FormControl>
                                              <Input 
                                                type="number"
                                                placeholder="No limit"
                                                {...field}
                                                value={field.value || ""}
                                                data-testid={`input-level-max-amount-${index}`}
                                              />
                                            </FormControl>
                                            {workflowForm.watch("approvalConditionType") === "monetary-threshold" && (
                                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                                Maximum amount this role can approve (leave blank for no limit)
                                              </p>
                                            )}
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                    )}
                                    
                                    <FormField
                                      control={workflowForm.control}
                                      name={`levels.${index}.isRequired`}
                                      render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                          <div className="space-y-0.5">
                                            <FormLabel>Required Approval</FormLabel>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                              This level must approve before proceeding
                                            </div>
                                          </div>
                                          <FormControl>
                                            <Switch
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                              data-testid={`switch-level-required-${index}`}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                              ))}
                              </div>
                            </div>

                            {/* Workflow Settings */}
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={workflowForm.control}
                                name="isActive"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Active Workflow</FormLabel>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Inactive workflows cannot be used
                                      </div>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        data-testid="switch-workflow-active"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={workflowForm.control}
                                name="isDefault"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Default Workflow</FormLabel>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Used when no specific assignment exists
                                      </div>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        data-testid="switch-workflow-default"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setWorkflowDialogOpen(false)}
                                data-testid="button-cancel-workflow"
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={createWorkflowMutation.isPending || updateWorkflowMutation.isPending}
                                data-testid="button-save-workflow"
                              >
                                {createWorkflowMutation.isPending || updateWorkflowMutation.isPending 
                                  ? "Saving..." 
                                  : editingWorkflow ? "Update Workflow" : "Create Workflow"
                                }
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {workflowsLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Loading workflows...</div>
                      </div>
                    ) : workflows.length === 0 ? (
                      <div className="text-center py-8">
                        <WorkflowIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No workflows configured
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Create your first workflow with Level 1, Level 2 approvals
                        </p>
                        <Button 
                          onClick={handleAddWorkflow}
                          className="flex items-center gap-2" 
                          data-testid="button-create-first-workflow"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Workflow
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workflows.map((workflow: any) => (
                          <div
                            key={workflow.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                            data-testid={`card-workflow-${workflow.id}`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                  <WorkflowIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white" data-testid={`text-workflow-name-${workflow.id}`}>
                                    {workflow.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {workflow.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={workflow.isActive ? "default" : "secondary"}
                                  data-testid={`status-workflow-${workflow.id}`}
                                >
                                  {workflow.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {workflow.isDefault && (
                                  <Badge variant="outline" data-testid={`badge-default-${workflow.id}`}>
                                    Default
                                  </Badge>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditWorkflow(workflow)}
                                  data-testid={`button-edit-workflow-${workflow.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      data-testid={`button-delete-workflow-${workflow.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the workflow "{workflow.name}"? This action cannot be undone and will remove all associated approval levels and assignments.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-testid={`button-cancel-delete-workflow-${workflow.id}`}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteWorkflow(workflow.id)}
                                        disabled={deleteWorkflowMutation.isPending}
                                        data-testid={`button-confirm-delete-workflow-${workflow.id}`}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deleteWorkflowMutation.isPending ? "Deleting..." : "Delete Workflow"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            
                            {/* Workflow Flowchart */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Approval Flow
                              </h5>
                              
                              <div className="flex items-center justify-center">
                                <div className="flex items-center gap-4 overflow-x-auto pb-2">
                                  
                                  {/* Start Node */}
                                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg" data-testid={`flowchart-start-${workflow.id}`}>
                                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                    </div>
                                    <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                                      <div className="font-medium">START</div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {JSON.parse(workflow.processTypes || '[]').map((type: string, index: number) => (
                                          <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs">
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Arrow to first level */}
                                  {workflow.levels && workflow.levels.length > 0 && (
                                    <ArrowRight className="h-6 w-6 text-blue-400 flex-shrink-0" />
                                  )}

                                  {/* Approval Levels */}
                                  {workflow.levels && workflow.levels.length > 0 && 
                                    workflow.levels
                                      .sort((a: any, b: any) => a.level - b.level)
                                      .map((level: any, index: number) => (
                                        <div key={level.id} className="flex items-center gap-4 flex-shrink-0">
                                          <div className="flex flex-col items-center gap-2">
                                            <div 
                                              className={`w-14 h-14 bg-gradient-to-br ${
                                                level.isRequired 
                                                  ? 'from-red-500 to-red-600 shadow-red-200 dark:shadow-red-900/50' 
                                                  : 'from-blue-500 to-blue-600 shadow-blue-200 dark:shadow-blue-900/50'
                                              } rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg`}
                                              data-testid={`flowchart-level-${workflow.id}-${level.level}`}
                                            >
                                              {level.level}
                                            </div>
                                            <div className="text-xs text-center text-gray-600 dark:text-gray-400 max-w-20">
                                              <div className="font-medium truncate">{level.role?.name || 'Role Deleted'}</div>
                                              {level.isRequired && (
                                                <div className="text-red-600 dark:text-red-400 font-medium">REQUIRED</div>
                                              )}
                                              {(level.minAmount || level.maxAmount) && (
                                                <div className="text-green-600 dark:text-green-400 font-medium text-xs">
                                                  {level.minAmount && `₹${level.minAmount}+`}
                                                  {level.maxAmount && ` - ₹${level.maxAmount}`}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* Arrow to next level */}
                                          {index < workflow.levels.length - 1 && (
                                            <ArrowRight className="h-6 w-6 text-blue-400 flex-shrink-0" />
                                          )}
                                        </div>
                                      ))
                                  }

                                  {/* Arrow to end */}
                                  {workflow.levels && workflow.levels.length > 0 && (
                                    <ArrowRight className="h-6 w-6 text-blue-400 flex-shrink-0" />
                                  )}

                                  {/* End Node */}
                                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg" data-testid={`flowchart-end-${workflow.id}`}>
                                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                                      <div className="font-medium">APPROVED</div>
                                    </div>
                                  </div>
                                  
                                </div>
                              </div>

                              {/* Workflow Condition Type */}
                              {workflow.approvalConditionType && (
                                <div className="mt-4 flex justify-center">
                                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                    {workflow.approvalConditionType === 'process-based' && 'Process-Based Workflow'}
                                    {workflow.approvalConditionType === 'monetary-threshold' && 'Monetary Threshold Workflow'}
                                    {workflow.approvalConditionType === 'combined' && 'Combined Workflow (Process + Monetary)'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Workflow Assignments
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Map workflows to specific processes, vendors, or expense categories
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        setEditingAssignment(null);
                        assignmentForm.reset({
                          workflowId: "",
                          processType: "",
                          vendorId: "",
                          expenseHeadId: "",
                          isDefault: false,
                          priority: 0,
                        });
                        setAssignmentDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                      data-testid="button-add-assignment"
                    >
                      <Plus className="h-4 w-4" />
                      Create Assignment
                    </Button>

                    <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>
                            {editingAssignment ? "Edit Workflow Assignment" : "Create New Workflow Assignment"}
                          </DialogTitle>
                        </DialogHeader>
                        <Form {...assignmentForm}>
                          <form onSubmit={assignmentForm.handleSubmit(onSubmitAssignment)} className="space-y-4">
                            <FormField
                              control={assignmentForm.control}
                              name="workflowId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Workflow *</FormLabel>
                                  <FormControl>
                                    <select
                                      {...field}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      data-testid="select-assignment-workflow"
                                    >
                                      <option value="">Select a workflow...</option>
                                      {workflows
                                        .filter((workflow: Workflow) => workflow.isActive)
                                        .map((workflow: Workflow) => (
                                        <option key={workflow.id} value={workflow.id}>
                                          {workflow.name}
                                        </option>
                                      ))}
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={assignmentForm.control}
                              name="processType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Process Type *</FormLabel>
                                  <FormControl>
                                    <select
                                      {...field}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      data-testid="select-assignment-process-type"
                                    >
                                      <option value="">Select a process type...</option>
                                      {processTypeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={assignmentForm.control}
                              name="vendorId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Specific Vendor (Optional)</FormLabel>
                                  <FormControl>
                                    <select
                                      {...field}
                                      value={field.value || ""}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      data-testid="select-assignment-vendor"
                                    >
                                      <option value="">All vendors (no specific vendor)</option>
                                      {vendors.map((vendor: any) => (
                                        <option key={vendor.id} value={vendor.id}>
                                          {vendor.name}
                                        </option>
                                      ))}
                                    </select>
                                  </FormControl>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Leave empty to apply to all vendors
                                  </p>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={assignmentForm.control}
                              name="expenseHeadId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Specific Expense Category (Optional)</FormLabel>
                                  <FormControl>
                                    <select
                                      {...field}
                                      value={field.value || ""}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      data-testid="select-assignment-expense-category"
                                    >
                                      <option value="">All categories (no specific category)</option>
                                      {expenseCategories.map((category: any) => (
                                        <option key={category.id} value={category.id}>
                                          {category.name}
                                        </option>
                                      ))}
                                    </select>
                                  </FormControl>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Leave empty to apply to all expense categories
                                  </p>
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={assignmentForm.control}
                                name="priority"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                        data-testid="input-assignment-priority"
                                      />
                                    </FormControl>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Higher = higher precedence
                                    </p>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={assignmentForm.control}
                                name="isDefault"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Default Assignment</FormLabel>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Used when no specific assignment matches
                                      </div>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        data-testid="switch-assignment-default"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setAssignmentDialogOpen(false)}
                                data-testid="button-cancel-assignment"
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="button"
                                disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
                                data-testid="button-save-assignment"
                                onClick={() => {
                                  // Direct API call to test if mutation works
                                  console.log("🔧 Button clicked - bypassing form validation");
                                  const testData = {
                                    workflowId: workflows.find(w => w.isActive)?.id || "",
                                    processType: "request",
                                    companyId: "13", // Using the orgId from JWT
                                    vendorId: undefined,
                                    expenseHeadId: undefined,
                                    isDefault: true,
                                    priority: 0,
                                  };
                                  console.log("🔧 Test data:", testData);
                                  createAssignmentMutation.mutate(testData);
                                }}
                              >
                                {createAssignmentMutation.isPending || updateAssignmentMutation.isPending 
                                  ? "Saving..." 
                                  : editingAssignment ? "Update Assignment" : "Create Assignment"
                                }
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {assignmentsLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Loading assignments...</div>
                      </div>
                    ) : assignments.length === 0 ? (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No workflow assignments configured
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Assign workflows to specific processes, vendors, or expense categories
                        </p>
                        <Button 
                          onClick={handleAddAssignment}
                          className="flex items-center gap-2" 
                          data-testid="button-create-first-assignment"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Assignment
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {assignments.map((assignment: any) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                            data-testid={`card-assignment-${assignment.id}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white" data-testid={`text-assignment-workflow-${assignment.id}`}>
                                  {assignment.workflow?.name || 'Workflow Deleted'}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Process: <span className="capitalize font-medium">{assignment.processType}</span>
                                  {assignment.vendorId && " • Vendor-specific"}
                                  {assignment.expenseHeadId && " • Category-specific"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {assignment.isDefault && (
                                <Badge variant="outline" data-testid={`badge-default-assignment-${assignment.id}`}>
                                  Default
                                </Badge>
                              )}
                              <Badge variant="secondary" data-testid={`badge-priority-${assignment.id}`}>
                                Priority: {assignment.priority}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditAssignment(assignment)}
                                data-testid={`button-edit-assignment-${assignment.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-delete-assignment-${assignment.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Workflow Assignment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this workflow assignment? This action cannot be undone and may affect how workflows are applied to processes.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel data-testid={`button-cancel-delete-assignment-${assignment.id}`}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteAssignment(assignment.id)}
                                      disabled={deleteAssignmentMutation.isPending}
                                      data-testid={`button-confirm-delete-assignment-${assignment.id}`}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {deleteAssignmentMutation.isPending ? "Deleting..." : "Delete Assignment"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}