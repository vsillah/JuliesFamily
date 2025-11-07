import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, ShieldOff, User as UserIcon, UserPlus, Trash2 } from "lucide-react";
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

export default function AdminUserManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    currentStatus: boolean;
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
    isAdmin: false,
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const updateAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/admin-status`, { isAdmin });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: variables.isAdmin 
          ? "Admin privileges granted successfully" 
          : "Admin privileges revoked successfully",
      });
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update admin status",
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
      setNewUser({ email: "", firstName: "", lastName: "", isAdmin: false });
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

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      (user.email?.toLowerCase().includes(query) ?? false)
    );
  });

  const handleToggleAdmin = (user: User) => {
    setConfirmAction({
      userId: user.id,
      currentStatus: user.isAdmin ?? false,
      userName: `${user.firstName} ${user.lastName}`,
    });
  };

  const isCurrentUser = (userId: string) => userId === currentUser?.id;

  const confirmToggleAdmin = () => {
    if (!confirmAction) return;
    
    updateAdminStatusMutation.mutate({
      userId: confirmAction.userId,
      isAdmin: !confirmAction.currentStatus,
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
                  Manage user accounts and admin privileges
                </CardDescription>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="w-full sm:w-auto"
                data-testid="button-create-user"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
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
                          {user.isAdmin ? (
                            <Badge variant="default" className="gap-1" data-testid={`badge-admin-${user.id}`}>
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" data-testid={`badge-user-${user.id}`}>
                              User
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.isAdmin ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleAdmin(user)}
                                  disabled={updateAdminStatusMutation.isPending || isCurrentUser(user.id)}
                                  data-testid={`button-revoke-admin-${user.id}`}
                                >
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  Revoke Admin
                                </Button>
                                {isCurrentUser(user.id) && (
                                  <span className="text-xs text-muted-foreground">
                                    (Cannot remove own access)
                                  </span>
                                )}
                              </>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleToggleAdmin(user)}
                                disabled={updateAdminStatusMutation.isPending}
                                data-testid={`button-grant-admin-${user.id}`}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Grant Admin
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              disabled={deleteUserMutation.isPending || isCurrentUser(user.id)}
                              data-testid={`button-delete-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
              {confirmAction?.currentStatus ? "Revoke Admin Privileges?" : "Grant Admin Privileges?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.currentStatus ? (
                <>
                  Are you sure you want to revoke admin privileges from{" "}
                  <strong>{confirmAction.userName}</strong>? They will no longer be able to access
                  admin features.
                </>
              ) : (
                <>
                  Are you sure you want to grant admin privileges to{" "}
                  <strong>{confirmAction?.userName}</strong>? They will have full access to all
                  admin features including user management, content management, and analytics.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-confirm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleAdmin}
              data-testid="button-confirm-action"
            >
              {confirmAction?.currentStatus ? "Revoke Admin" : "Grant Admin"}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="isAdmin">Admin Privileges</Label>
              <Switch
                id="isAdmin"
                checked={newUser.isAdmin}
                onCheckedChange={(checked) => setNewUser({ ...newUser, isAdmin: checked })}
                data-testid="switch-admin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewUser({ email: "", firstName: "", lastName: "", isAdmin: false });
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
    </div>
  );
}
