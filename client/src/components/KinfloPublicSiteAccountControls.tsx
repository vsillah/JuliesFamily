import { Link } from "wouter";
import { LogIn, LogOut, Shield, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AdminPreviewDropdown } from "@/components/AdminPreviewDropdown";
import { DevAdminButton } from "@/components/DevAdminButton";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface KinfloPublicSiteAccountControlsProps {
  navSolid?: boolean;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "U";
}

export default function KinfloPublicSiteAccountControls({
  navSolid = false,
}: KinfloPublicSiteAccountControlsProps) {
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useUserRole();

  return (
    <div className="flex items-center gap-1.5" data-testid="kinflo-public-account-controls">
      {!isAdmin && isAuthenticated && <DevAdminButton />}
      {isAdmin && <AdminPreviewDropdown isScrolled={navSolid} />}
      {isAuthenticated && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full ${navSolid ? "hover:bg-muted" : "text-white hover:bg-white/15 hover:text-white"}`}
              aria-label="Open profile menu"
              title="Profile menu"
              data-testid="button-public-profile-menu"
            >
              <Avatar className="h-8 w-8 border border-current/30">
                {user.profileImageUrl ? <AvatarImage src={user.profileImageUrl} alt={`${user.firstName ?? "User"} ${user.lastName ?? ""}`} /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Your account"}</div>
              {user.email && <div className="mt-1 text-xs font-normal text-muted-foreground">{user.email}</div>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer" data-testid="menu-public-profile-settings">
                <User className="h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
            </Link>
            {isAdmin && (
              <Link href="/admin">
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-public-admin-dashboard">
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </DropdownMenuItem>
              </Link>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { window.location.href = "/api/logout"; }}
              className="cursor-pointer text-destructive focus:text-destructive"
              data-testid="menu-public-logout"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          type="button"
          size="sm"
          variant={navSolid ? "outline" : "ghost"}
          className={!navSolid ? "text-white hover:bg-white/15 hover:text-white" : undefined}
          onClick={() => { window.location.href = "/api/login"; }}
          data-testid="button-public-sign-in"
        >
          <LogIn className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Sign in</span>
        </Button>
      )}
    </div>
  );
}
