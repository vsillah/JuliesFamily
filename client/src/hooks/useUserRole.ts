import { useAuth } from "./useAuth";
import type { UserRole } from "@shared/schema";

export function useUserRole() {
  const { user } = useAuth();
  
  const role = user?.role as UserRole | undefined;
  
  const isClient = role === "client" || !role;
  // Use isAdminSession to check if the real user (not impersonated user) is an admin
  // This ensures admin controls remain visible during impersonation
  const isAdmin = (user as any)?.isAdminSession || role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";
  
  const hasRole = (requiredRole: UserRole | UserRole[]) => {
    if (!role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    
    return role === requiredRole;
  };
  
  const canAccess = (feature: "admin" | "super_admin" | "crm" | "content_management" | "user_management") => {
    switch (feature) {
      case "admin":
      case "crm":
      case "content_management":
        return isAdmin;
      case "super_admin":
      case "user_management":
        return isSuperAdmin;
      default:
        return false;
    }
  };
  
  return {
    role,
    isClient,
    isAdmin,
    isSuperAdmin,
    hasRole,
    canAccess,
  };
}
