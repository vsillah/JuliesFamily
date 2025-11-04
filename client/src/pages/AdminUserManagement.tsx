import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, ShieldOff, User as UserIcon } from "lucide-react";
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
    if (user.id === currentUser?.id && user.isAdmin) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot remove your own admin privileges",
        variant: "destructive",
      });
      return;
    }

    setConfirmAction({
      userId: user.id,
      currentStatus: user.isAdmin ?? false,
      userName: `${user.firstName} ${user.lastName}`,
    });
  };

  const confirmToggleAdmin = () => {
    if (!confirmAction) return;
    
    updateAdminStatusMutation.mutate({
      userId: confirmAction.userId,
      isAdmin: !confirmAction.currentStatus,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Breadcrumbs
        items={[
          { label: "Admin Dashboard", href: "/admin/dashboard" },
          { label: "User Management" },
        ]}
      />

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts and admin privileges
            </CardDescription>
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
                          {user.isAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAdmin(user)}
                              disabled={updateAdminStatusMutation.isPending}
                              data-testid={`button-revoke-admin-${user.id}`}
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Revoke Admin
                            </Button>
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
    </div>
  );
}
