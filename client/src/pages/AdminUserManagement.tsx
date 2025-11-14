import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, UserRole } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, ShieldCheck, User as UserIcon, UserPlus, Trash2, Crown, Settings, X, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Type definitions for Programs and Entitlements
type Program = {
  id: string;
  name: string;
  description: string | null;
  programType: 'student_program' | 'volunteer_opportunity';
  isActive: boolean;
  isAvailableForTesting: boolean;
};

type Entitlement = {
  id: string;
  adminId: string;
  programId: string;
  isActive: boolean;
  createdAt: string;
  program: Program;
};

export default function AdminUserManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    currentRole: UserRole;
    newRole: UserRole;
    userName: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "client" as UserRole,
  });
  const [entitlementDialogUserId, setEntitlementDialogUserId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    refetchOnMount: true, // Always refetch to handle auth/impersonation state changes
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Fetch all available programs
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/admin/programs', { isActive: 'true' }],
  });

  // Fetch all entitlements to show counts in table
  const { data: allEntitlements = [] } = useQuery<(Entitlement & { adminId: string })[]>({
    queryKey: ['/api/admin/all-entitlements'],
  });

  // Fetch entitlements for the selected user when dialog opens
  const { data: dialogUserEntitlements = [] } = useQuery<Entitlement[]>({
    queryKey: [`/api/admin/users/${entitlementDialogUserId}/entitlements`],
    enabled: !!entitlementDialogUserId,
  });

  // Helper function to get entitlements for a user
  const getUserEntitlements = (userId: string) => {
    return allEntitlements.filter(e => e.adminId === userId && e.isActive);
  };

  // Helper function to get role label
  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "admin": return "Admin";
      case "client": return "Client";
      default: return "Unknown";
    }
  };

  // Helper function to get role badge variant
  const getRoleBadgeVariant = (role: UserRole): "default" | "secondary" | "outline" => {
    switch (role) {
      case "super_admin": return "default";
      case "admin": return "outline";
      case "client": return "secondary";
      default: return "secondary";
    }
  };

  // Helper function to get role icon
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "super_admin": return Crown;
      case "admin": return Shield;
      case "client": return UserIcon;
      default: return UserIcon;
    }
  };

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: `User role updated to ${getRoleLabel(variables.role)} successfully`,
      });
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
      setConfirmAction(null);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setCreateDialogOpen(false);
      setNewUser({ email: "", firstName: "", lastName: "", role: "client" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
      setDeleteConfirm(null);
    },
  });

  const addEntitlementMutation = useMutation({
    mutationFn: async ({ userId, programId }: { userId: string; programId: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/entitlements`, { programId });
    },
    onSuccess: async (data, variables) => {
      // Invalidate queries to refetch entitlements
      await queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${variables.userId}/entitlements`] });
      
      toast({
        title: "Success",
        description: "Program entitlement added successfully",
      });
      
      // Reset dialog state
      setSelectedProgramId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add program entitlement",
        variant: "destructive",
      });
    },
  });

  const removeEntitlementMutation = useMutation({
    mutationFn: async ({ userId, entitlementId }: { userId: string; entitlementId: string }) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}/entitlements/${entitlementId}`);
    },
    onSuccess: async (data, variables) => {
      // Invalidate queries to refetch entitlements
      await queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${variables.userId}/entitlements`] });
      
      toast({
        title: "Success",
        description: "Program entitlement removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove program entitlement",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      (user.email?.toLowerCase().includes(query) ?? false)
    );
  });

  const handleRoleChange = (user: User, newRole: UserRole) => {
    if (newRole === user.role) return; // No change
    
    setConfirmAction({
      userId: user.id,
      currentRole: user.role,
      newRole,
      userName: `${user.firstName} ${user.lastName}`,
    });
  };

  const isCurrentUser = (userId: string) => userId === currentUser?.id;
  const isSuperAdmin = currentUser?.role === "super_admin";

  const confirmRoleChange = () => {
    if (!confirmAction) return;
    
    updateRoleMutation.mutate({
      userId: confirmAction.userId,
      role: confirmAction.newRole,
    });
  };

  const handleCreateUser = () => {
    if (!newUser.email.trim() || !newUser.firstName.trim() || !newUser.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleDeleteUser = (user: User) => {
    setDeleteConfirm({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
    });
  };

  const confirmDeleteUser = () => {
    if (!deleteConfirm) return;
    deleteUserMutation.mutate(deleteConfirm.userId);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Breadcrumbs
        items={[
          { label: "Admin Dashboard", href: "/admin" },
          { label: "User Management" },
        ]}
      />

      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  {isSuperAdmin 
                    ? "Manage user accounts and assign roles (Client, Admin, Super Admin)" 
                    : "View user accounts and their roles"}
                </CardDescription>
              </div>
              {isSuperAdmin && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="w-full sm:w-auto"
                  data-testid="button-create-user"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No users found matching your search" : "No users found"}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead className="min-w-[140px]">Role</TableHead>
                      <TableHead className="min-w-[120px]">Funnel Stage</TableHead>
                      <TableHead className="min-w-[200px]">Program Entitlements</TableHead>
                      {isSuperAdmin && <TableHead className="text-right min-w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const RoleIcon = getRoleIcon(user.role);
                      return (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="ml-2">
                                You
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {isSuperAdmin && !isCurrentUser(user.id) ? (
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleChange(user, value as UserRole)}
                                disabled={updateRoleMutation.isPending}
                              >
                                <SelectTrigger 
                                  className="w-[160px]" 
                                  data-testid={`select-role-${user.id}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="client" data-testid={`option-client-${user.id}`}>
                                    <div className="flex items-center gap-2">
                                      <UserIcon className="h-3 w-3" />
                                      <span>Client</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="admin" data-testid={`option-admin-${user.id}`}>
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-3 w-3" />
                                      <span>Admin</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="super_admin" data-testid={`option-super-admin-${user.id}`}>
                                    <div className="flex items-center gap-2">
                                      <Crown className="h-3 w-3" />
                                      <span>Super Admin</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge 
                                variant={getRoleBadgeVariant(user.role)} 
                                className="gap-1" 
                                data-testid={`badge-role-${user.id}`}
                              >
                                <RoleIcon className="h-3 w-3" />
                                {getRoleLabel(user.role)}
                              </Badge>
                            )}
                            {isCurrentUser(user.id) && isSuperAdmin && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (Cannot change own role)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const funnelStage = (user as any).funnelStage;
                              if (!funnelStage) {
                                return <Badge variant="secondary" className="text-xs">N/A</Badge>;
                              }
                              
                              // Map funnel stages to badge variants
                              const stageConfig: Record<string, { variant: "secondary" | "outline" | "default" | "destructive"; label: string }> = {
                                awareness: { variant: "secondary", label: "Awareness" },
                                consideration: { variant: "outline", label: "Consideration" },
                                decision: { variant: "default", label: "Decision" },
                                retention: { variant: "destructive", label: "Retention" },
                              };
                              
                              const config = stageConfig[funnelStage] || { variant: "secondary", label: funnelStage };
                              
                              // Override retention to use success-like styling
                              const badgeClass = funnelStage === 'retention' 
                                ? 'text-xs bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800'
                                : 'text-xs';
                              
                              return (
                                <Badge 
                                  variant={funnelStage === 'retention' ? 'outline' : config.variant} 
                                  className={badgeClass}
                                  data-testid={`badge-funnel-${user.id}`}
                                >
                                  {config.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const userEntitlements = getUserEntitlements(user.id);
                              if (userEntitlements.length > 0) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm flex-1" title={userEntitlements.map(e => e.program.name).join(', ')}>
                                      {userEntitlements.map(e => e.program.name).join(', ')}
                                    </span>
                                    {isSuperAdmin && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEntitlementDialogUserId(user.id)}
                                        data-testid={`button-manage-entitlements-${user.id}`}
                                        className="h-7 flex-shrink-0"
                                      >
                                        <Settings className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              } else if (isSuperAdmin) {
                                return (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEntitlementDialogUserId(user.id)}
                                    data-testid={`button-manage-entitlements-${user.id}`}
                                    className="h-7"
                                  >
                                    <Settings className="h-3 w-3 mr-1" />
                                    Manage Programs
                                  </Button>
                                );
                              } else {
                                return <span className="text-xs text-muted-foreground">-</span>;
                              }
                            })()}
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                disabled={deleteUserMutation.isPending || isCurrentUser(user.id)}
                                data-testid={`button-delete-${user.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              Total users: {filteredUsers.length}
              {searchQuery && ` (filtered from ${users.length})`}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change User Role?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change <strong>{confirmAction?.userName}</strong>'s role from{" "}
              <strong>{confirmAction && getRoleLabel(confirmAction.currentRole)}</strong> to{" "}
              <strong>{confirmAction && getRoleLabel(confirmAction.newRole)}</strong>?
              {confirmAction?.newRole === "super_admin" && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm">
                  <strong>Warning:</strong> Super Admins have complete control over the system,
                  including the ability to manage all users and roles.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-confirm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              data-testid="button-confirm-action"
            >
              Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-user">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user account. They will be able to log in with their email once created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                data-testid="input-firstname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                data-testid="input-lastname"
              />
            </div>
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
                >
                  <SelectTrigger id="role" data-testid="select-new-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client" data-testid="option-new-client">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-3 w-3" />
                        <span>Client</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin" data-testid="option-new-admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="super_admin" data-testid="option-new-super-admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-3 w-3" />
                        <span>Super Admin</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewUser({ email: "", firstName: "", lastName: "", role: "client" });
              }}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.userName}</strong>? This action
              cannot be undone. The user will lose access to their account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover-elevate"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!entitlementDialogUserId} onOpenChange={() => {
        setEntitlementDialogUserId(null);
        setSelectedProgramId("");
      }}>
        <DialogContent className="max-w-2xl" data-testid="dialog-manage-entitlements">
          <DialogHeader>
            <DialogTitle>Manage Program Entitlements</DialogTitle>
            <DialogDescription>
              Add or remove program entitlements for{" "}
              {entitlementDialogUserId && users.find(u => u.id === entitlementDialogUserId) && (
                <strong>
                  {users.find(u => u.id === entitlementDialogUserId)?.firstName}{" "}
                  {users.find(u => u.id === entitlementDialogUserId)?.lastName}
                </strong>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Entitlements */}
            <div className="space-y-2">
              <Label>Current Programs</Label>
              {dialogUserEntitlements.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 border rounded-md">
                  No program entitlements assigned
                </div>
              ) : (
                <div className="space-y-2">
                  {dialogUserEntitlements.map((entitlement) => (
                    <div
                      key={entitlement.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`entitlement-item-${entitlement.program.name}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{entitlement.program.name}</div>
                        {entitlement.program.description && (
                          <div className="text-sm text-muted-foreground">
                            {entitlement.program.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Type: {entitlement.program.programType === 'student_program' ? 'Student Program' : 'Volunteer Opportunity'}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (entitlementDialogUserId) {
                            removeEntitlementMutation.mutate({
                              userId: entitlementDialogUserId,
                              entitlementId: entitlement.id,
                            });
                          }
                        }}
                        disabled={removeEntitlementMutation.isPending}
                        data-testid={`button-remove-${entitlement.program.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Entitlement */}
            <div className="space-y-2">
              <Label htmlFor="program-select">Add Program</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedProgramId}
                  onValueChange={setSelectedProgramId}
                >
                  <SelectTrigger id="program-select" data-testid="select-program">
                    <SelectValue placeholder="Select a program..." />
                  </SelectTrigger>
                  <SelectContent>
                    {programs
                      .filter(program => 
                        !dialogUserEntitlements.some(e => e.programId === program.id)
                      )
                      .map(program => (
                        <SelectItem 
                          key={program.id} 
                          value={program.id}
                          data-testid={`option-program-${program.name}`}
                        >
                          {program.name} ({program.programType === 'student_program' ? 'Student' : 'Volunteer'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    if (entitlementDialogUserId && selectedProgramId) {
                      addEntitlementMutation.mutate({
                        userId: entitlementDialogUserId,
                        programId: selectedProgramId,
                      });
                    }
                  }}
                  disabled={!selectedProgramId || addEntitlementMutation.isPending}
                  data-testid="button-add-program"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEntitlementDialogUserId(null);
                setSelectedProgramId("");
              }}
              data-testid="button-close-dialog"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
