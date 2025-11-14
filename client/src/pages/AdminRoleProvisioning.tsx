import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, UserCog, X, Search } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSearchCommand } from "@/components/UserSearchCommand";

type Program = {
  id: string;
  name: string;
  description: string | null;
  programType: 'student_program' | 'volunteer_opportunity';
  isActive: boolean;
  isAvailableForTesting: boolean;
  volunteerShiftId: string | null;
  autoPopulateConfig: Record<string, any> | null;
};

type Entitlement = {
  id: string;
  adminId: string;
  programId: string;
  tghEnrollmentId: string | null;
  volunteerEnrollmentId: string | null;
  metadata: Record<string, any> | null;
  isActive: boolean;
  createdAt: string;
  program: Program;
};

type ImpersonationSession = {
  id: string;
  adminId: string;
  impersonatedUserId: string;
  reason: string | null;
  isActive: boolean;
  startedAt: string;
  endedAt: string | null;
};

type User = {
  id: string;
  email: string;
  name: string | null;
};

export default function AdminRoleProvisioning() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [impersonationDialogOpen, setImpersonationDialogOpen] = useState(false);
  const [impersonatedUserId, setImpersonatedUserId] = useState("");
  const [impersonationReason, setImpersonationReason] = useState("");
  const [userSearchOpen, setUserSearchOpen] = useState(false);

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  // Fetch available programs for testing (only when authenticated)
  const { data: programs = [], isLoading: programsLoading, isError: programsError } = useQuery<Program[]>({
    queryKey: ['/api/admin/programs', { isAvailableForTesting: 'true', isActive: 'true' }],
    enabled: !!user,
  });

  // Fetch active entitlements (only when authenticated)
  const { data: entitlements = [], isLoading: entitlementsLoading } = useQuery<Entitlement[]>({
    queryKey: ['/api/admin/entitlements'],
    enabled: !!user,
  });

  // Fetch active impersonation session (only when authenticated)
  const { data: impersonationSession } = useQuery<ImpersonationSession | null>({
    queryKey: ['/api/admin/impersonation/session'],
    enabled: !!user,
  });

  // Fetch all users for impersonation (only when authenticated)
  const { data: users = [], isLoading: usersLoading, isError: usersError } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user,
  });

  // Create entitlement mutation
  const createEntitlementMutation = useMutation({
    mutationFn: async (programId: string) => {
      return await apiRequest('POST', '/api/admin/entitlements', { programId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/entitlements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/programs'] });
      setCreateDialogOpen(false);
      setSelectedProgramId("");
      toast({
        title: "Test enrollment created",
        description: "Your test enrollment is now active with auto-populated data.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create entitlement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete entitlement mutation
  const deleteEntitlementMutation = useMutation({
    mutationFn: async (entitlementId: string) => {
      return await apiRequest('DELETE', `/api/admin/entitlements/${entitlementId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/entitlements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/programs'] });
      toast({
        title: "Test enrollment deleted",
        description: "All test data has been cleaned up.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete entitlement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start impersonation mutation
  const startImpersonationMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return await apiRequest('POST', '/api/admin/impersonation/start', {
        impersonatedUserId: userId,
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/impersonation/session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setImpersonationDialogOpen(false);
      setImpersonatedUserId("");
      setImpersonationReason("");
      toast({
        title: "Impersonation started",
        description: "You are now viewing the site as the selected user.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start impersonation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // End impersonation mutation
  const endImpersonationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/impersonation/end');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/impersonation/session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Impersonation ended",
        description: "You are now viewing the site as yourself.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to end impersonation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateEntitlement = () => {
    if (!selectedProgramId) return;
    createEntitlementMutation.mutate(selectedProgramId);
  };

  const handleStartImpersonation = () => {
    if (!impersonatedUserId) return;
    startImpersonationMutation.mutate({
      userId: impersonatedUserId,
      reason: impersonationReason,
    });
  };

  // Show loading while authenticating
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Role Provisioning</h1>
        <p className="text-muted-foreground">
          Create temporary test enrollments and impersonate users for debugging
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Enrollments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Test Enrollments</h2>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              disabled={programsLoading || programsError}
              data-testid="button-create-entitlement"
            >
              {programsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Test Enrollment
                </>
              )}
            </Button>
          </div>

          {entitlementsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </CardContent>
            </Card>
          ) : entitlements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No active test enrollments
                </p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  variant="outline"
                  data-testid="button-create-first-entitlement"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Test Enrollment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {entitlements.map((entitlement) => (
                <Card key={entitlement.id} data-testid={`card-entitlement-${entitlement.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {entitlement.program.name}
                        </CardTitle>
                        <CardDescription>
                          {entitlement.program.description}
                        </CardDescription>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteEntitlementMutation.mutate(entitlement.id)}
                        disabled={deleteEntitlementMutation.isPending}
                        data-testid={`button-delete-entitlement-${entitlement.id}`}
                      >
                        {deleteEntitlementMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" data-testid={`badge-program-type-${entitlement.id}`}>
                        {entitlement.program.programType === 'student_program' 
                          ? 'Student Program' 
                          : 'Volunteer Opportunity'}
                      </Badge>
                      {entitlement.tghEnrollmentId && (
                        <Badge variant="outline" data-testid={`badge-tgh-${entitlement.id}`}>
                          TGH Enrollment: {entitlement.tghEnrollmentId.slice(0, 8)}
                        </Badge>
                      )}
                      {entitlement.volunteerEnrollmentId && (
                        <Badge variant="outline" data-testid={`badge-volunteer-${entitlement.id}`}>
                          Volunteer: {entitlement.volunteerEnrollmentId.slice(0, 8)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Impersonation Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">User Impersonation</h2>

          {impersonationSession ? (
            <Card data-testid="card-active-impersonation">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCog className="w-5 h-5" />
                      Active Impersonation
                    </CardTitle>
                    <CardDescription>
                      Viewing site as another user
                    </CardDescription>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => endImpersonationMutation.mutate()}
                    disabled={endImpersonationMutation.isPending}
                    data-testid="button-end-impersonation"
                  >
                    {endImpersonationMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">User ID:</span>
                  <p className="text-sm text-muted-foreground" data-testid="text-impersonated-user">
                    {impersonationSession.impersonatedUserId}
                  </p>
                </div>
                {impersonationSession.reason && (
                  <div>
                    <span className="text-sm font-medium">Reason:</span>
                    <p className="text-sm text-muted-foreground">
                      {impersonationSession.reason}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium">Started:</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(impersonationSession.startedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <UserCog className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No active impersonation session
                </p>
                <Button
                  onClick={() => setImpersonationDialogOpen(true)}
                  variant="outline"
                  data-testid="button-start-impersonation"
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  Start Impersonation
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">About Impersonation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Impersonation allows you to view the site exactly as another user sees it,
                including their enrollments, permissions, and personalized content.
              </p>
              <p className="font-medium text-foreground">
                Use this feature responsibly for debugging and support purposes only.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Entitlement Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-entitlement">
          <DialogHeader>
            <DialogTitle>Create Test Enrollment</DialogTitle>
            <DialogDescription>
              Select a program to create a test enrollment with auto-populated progress data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="program-select">Program</Label>
              {programsLoading ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading programs...</span>
                </div>
              ) : programsError ? (
                <div className="flex items-center justify-center p-4 border border-destructive rounded-md">
                  <span className="text-sm text-destructive">Failed to load programs</span>
                </div>
              ) : programs.length === 0 ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <span className="text-sm text-muted-foreground">No programs available for testing</span>
                </div>
              ) : (
                <Select
                  value={selectedProgramId}
                  onValueChange={setSelectedProgramId}
                  disabled={programsLoading || programsError}
                >
                  <SelectTrigger id="program-select" data-testid="select-program">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem 
                        key={program.id} 
                        value={program.id}
                        data-testid={`option-program-${program.id}`}
                      >
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!selectedProgramId && !programsLoading && !programsError && programs.length > 0 && (
                <p className="text-sm text-destructive">Please select a program</p>
              )}
            </div>

            {selectedProgramId && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium mb-1">Auto-populated data:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {programs.find(p => p.id === selectedProgramId)?.programType === 'student_program' ? (
                    <>
                      <li>8 attendance records (weekly classes)</li>
                      <li>16 hours of credit</li>
                      <li>Active enrollment status</li>
                    </>
                  ) : (
                    <>
                      <li>1 volunteer session (2 hours)</li>
                      <li>Confirmed enrollment status</li>
                      <li>Approved application</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEntitlement}
              disabled={!selectedProgramId || createEntitlementMutation.isPending || programsLoading || programsError}
              data-testid="button-confirm-create"
            >
              {createEntitlementMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Test Enrollment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Impersonation Dialog */}
      <Dialog open={impersonationDialogOpen} onOpenChange={setImpersonationDialogOpen}>
        <DialogContent data-testid="dialog-start-impersonation">
          <DialogHeader>
            <DialogTitle>Start User Impersonation</DialogTitle>
            <DialogDescription>
              Select a user to impersonate for debugging purposes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">User</Label>
              {usersLoading ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading users...</span>
                </div>
              ) : usersError ? (
                <div className="flex items-center justify-center p-4 border border-destructive rounded-md">
                  <span className="text-sm text-destructive">Failed to load users</span>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <span className="text-sm text-muted-foreground">No users available</span>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setUserSearchOpen(true)}
                    disabled={usersLoading || usersError}
                    data-testid="button-open-user-search"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {impersonatedUserId ? (
                      (() => {
                        const selectedUser = users.find((u) => u.id === impersonatedUserId);
                        return selectedUser 
                          ? selectedUser.name || selectedUser.email
                          : "Select a user";
                      })()
                    ) : (
                      "Select a user"
                    )}
                  </Button>
                  {!impersonatedUserId && (
                    <p className="text-sm text-destructive">Please select a user</p>
                  )}
                  
                  {/* User Search Dialog */}
                  <UserSearchCommand
                    users={users.map((u) => ({
                      id: u.id,
                      email: u.email,
                      firstName: u.name?.split(' ')[0] || null,
                      lastName: u.name?.split(' ').slice(1).join(' ') || null,
                      profilePhotoUrl: null,
                    }))}
                    open={userSearchOpen}
                    onOpenChange={setUserSearchOpen}
                    onSelect={setImpersonatedUserId}
                    selectedUserId={impersonatedUserId}
                    placeholder="Search users by name or email..."
                    emptyMessage="No users found matching your search."
                  />
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason-input">Reason (optional)</Label>
              <Input
                id="reason-input"
                placeholder="e.g., Debugging enrollment issue"
                value={impersonationReason}
                onChange={(e) => setImpersonationReason(e.target.value)}
                data-testid="input-impersonation-reason"
              />
            </div>

            <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-3 text-sm">
              <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                Important:
              </p>
              <p className="text-yellow-800 dark:text-yellow-200">
                All actions taken while impersonating will be audited.
                Use this feature responsibly.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImpersonationDialogOpen(false)}
              data-testid="button-cancel-impersonation"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartImpersonation}
              disabled={!impersonatedUserId || startImpersonationMutation.isPending || usersLoading || usersError}
              data-testid="button-confirm-impersonation"
            >
              {startImpersonationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Impersonation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
