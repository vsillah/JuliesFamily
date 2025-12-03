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

interface OrganizationSwitcherProps {
  isScrolled?: boolean;
}

export function OrganizationSwitcher({ isScrolled = false }: OrganizationSwitcherProps) {
  const [, setLocation] = useLocation();
  const { currentOrg } = useOrganization();

  if (!currentOrg) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={currentOrg.isOverride ? "default" : (isScrolled ? "outline" : "ghost")}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-9 px-4 py-2 gap-2 transition-colors duration-300 false pt-[7px] pb-[7px]"
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
