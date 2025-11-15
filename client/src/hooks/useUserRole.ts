import { useAuth } from "./useAuth";
import type { UserRole } from "@shared/schema";

export function useUserRole() {
  const { user } = useAuth();
  
  const role = user?.role as UserRole | undefined;
  
  const isClient = role === "client" || !role;
  // Use isAdminSession to check if the real user (not impersonated user) is an admin
  // This ensures admin controls remain visible during impersonation
  const isAdmin = (user as any)?.isAdminSession || role === "admin" || role === "kinflo_admin";
  const isKinfloAdmin = role === "kinflo_admin";
  // Backward compatibility alias - isSuperAdmin refers to KinFlo platform admin
  const isSuperAdmin = isKinfloAdmin;
  
  const hasRole = (requiredRole: UserRole | UserRole[]) => {
    if (!role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    
    return role === requiredRole;
  };
  
  const canAccess = (feature: "admin" | "kinflo_admin" | "super_admin" | "crm" | "content_management" | "user_management") => {
    switch (feature) {
      case "admin":
      case "crm":
      case "content_management":
        return isAdmin;
      case "kinflo_admin":
      case "super_admin": // Backward compatibility
      case "user_management":
        return isKinfloAdmin;
      default:
        return false;
    }
  };
  
  return {
    role,
    isClient,
    isAdmin,
    isKinfloAdmin,
    isSuperAdmin, // Backward compatibility alias
    hasRole,
    canAccess,
  };
}
