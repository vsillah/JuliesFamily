// Authentication hook for client-side auth state
// Reference: blueprint:javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnMount: false,  // Don't refetch on every mount
    refetchOnWindowFocus: true,  // Refetch when window regains focus (after login redirect)
    staleTime: 5 * 60 * 1000,  // Consider fresh for 5 minutes
  });

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated: !!user,
  };
}
