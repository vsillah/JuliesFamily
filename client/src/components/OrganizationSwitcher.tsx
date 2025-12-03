import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useOrganization } from "@/contexts/OrganizationContext";

export function OrganizationSwitcher() {
  const [, setLocation] = useLocation();
  const { currentOrg } = useOrganization();

  if (!currentOrg) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          data-testid="button-org-switcher"
        >
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">
            {currentOrg.organizationName || currentOrg.name || "Unknown Organization"}
          </span>
          {currentOrg.isOverride && (
            <Badge variant="secondary" className="ml-1 text-xs">
              Override
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Current Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setLocation('/admin/organizations')}
          data-testid="menuitem-manage-orgs"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Manage Organizations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
