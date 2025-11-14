import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { useUserRole } from "@/hooks/useUserRole";

export function ImpersonationBanner() {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  // Fetch active impersonation session (only for admins)
  const { data: impersonationSession } = useQuery<{
    id: string;
    impersonatedUserId: string;
    isActive: boolean;
  } | null>({
    queryKey: ['/api/admin/impersonation/session'],
    enabled: isAdmin,
  });

  // Fetch all users to get impersonated user details
  const { data: users = [] } = useQuery<Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }>>({
    queryKey: ['/api/admin/users'],
    enabled: !!impersonationSession,
  });

  // End impersonation mutation
  const endImpersonationMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest('DELETE', `/api/admin/impersonation/end/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/impersonation/session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Impersonation ended",
        description: "Reloading page...",
      });
      // Reload page to clear impersonated context
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to end impersonation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!impersonationSession) {
    return null;
  }

  const impersonatedUser = users.find(u => u.id === impersonationSession.impersonatedUserId);
  const userName = impersonatedUser
    ? `${impersonatedUser.firstName} ${impersonatedUser.lastName}`
    : 'Unknown User';

  return (
    <div className="bg-yellow-500 dark:bg-yellow-600 text-yellow-950 dark:text-yellow-50 px-4 py-2 w-full shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold">Impersonating User:</span>
            <span className="font-medium">{userName}</span>
            <span className="text-sm opacity-90">({impersonatedUser?.email})</span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => endImpersonationMutation.mutate(impersonationSession.id)}
          disabled={endImpersonationMutation.isPending}
          data-testid="button-end-impersonation-banner"
        >
          <X className="w-4 h-4 mr-1" />
          End Impersonation
        </Button>
      </div>
    </div>
  );
}
