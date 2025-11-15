import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Users, Mail, DollarSign, ArrowRight, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OrganizationMetrics {
  leadsCount: number;
  donationsCount: number;
  campaignsCount: number;
  totalDonationAmount: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: string;
  primaryDomain: string | null;
  createdAt: string;
  metrics: OrganizationMetrics;
}

interface CurrentOrganization {
  organizationId: string;
  organization: Organization;
  isOverride: boolean;
}

export default function AdminOrganizations() {
  const { toast } = useToast();

  // Fetch all organizations
  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useQuery<Organization[]>({
    queryKey: ['/api/admin/organizations'],
  });

  // Fetch current organization context
  const { data: currentOrg, isLoading: currentLoading } = useQuery<CurrentOrganization>({
    queryKey: ['/api/admin/organization/current'],
  });

  // Switch organization mutation
  const switchOrgMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await apiRequest('POST', '/api/admin/organization/switch', { organizationId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organization Switched",
        description: `Now viewing organization ${data.organizationId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organization/current'] });
      // Reload the page to refresh all org-scoped data
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch organization",
        variant: "destructive",
      });
    },
  });

  // Clear override mutation
  const clearOverrideMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/admin/organization/switch');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Override Cleared",
        description: "Returned to default organization detection",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organization/current'] });
      // Reload the page to refresh all org-scoped data
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear override",
        variant: "destructive",
      });
    },
  });

  const handleSwitchOrg = (orgId: string) => {
    switchOrgMutation.mutate(orgId);
  };

  const handleClearOverride = () => {
    clearOverrideMutation.mutate();
  };

  if (orgsLoading || currentLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (orgsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load organizations. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground mt-2">
            Manage and switch between organizations
          </p>
        </div>
        {currentOrg?.isOverride && (
          <Button
            onClick={handleClearOverride}
            variant="outline"
            disabled={clearOverrideMutation.isPending}
            data-testid="button-clear-override"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Override
          </Button>
        )}
      </div>

      {/* Current Organization Badge */}
      {currentOrg && (
        <Card className="border-primary" data-testid="card-current-org">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Current Organization
              {currentOrg.isOverride && (
                <Badge variant="default" data-testid="badge-override">
                  Override Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              You are currently viewing data for: {currentOrg.organization?.name || currentOrg.organizationId}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Organizations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations?.map((org) => {
          const isCurrentOrg = org.id === currentOrg?.organizationId;
          
          return (
            <Card 
              key={org.id} 
              className={isCurrentOrg ? "border-primary" : ""}
              data-testid={`card-org-${org.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {org.name}
                      {isCurrentOrg && (
                        <Badge variant="default" data-testid={`badge-current-${org.id}`}>
                          Current
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Tier: {org.tier}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Leads
                    </div>
                    <p className="text-2xl font-bold" data-testid={`text-leads-${org.id}`}>
                      {org.metrics.leadsCount}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Campaigns
                    </div>
                    <p className="text-2xl font-bold" data-testid={`text-campaigns-${org.id}`}>
                      {org.metrics.campaignsCount}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Donations
                    </div>
                    <p className="text-2xl font-bold" data-testid={`text-donations-${org.id}`}>
                      {org.metrics.donationsCount}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Total
                    </div>
                    <p className="text-2xl font-bold" data-testid={`text-total-${org.id}`}>
                      ${org.metrics.totalDonationAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Domain Info */}
                {org.primaryDomain && (
                  <div className="text-sm text-muted-foreground">
                    Domain: {org.primaryDomain}
                  </div>
                )}

                {/* Switch Button */}
                {!isCurrentOrg && (
                  <Button
                    onClick={() => handleSwitchOrg(org.id)}
                    disabled={switchOrgMutation.isPending}
                    className="w-full"
                    data-testid={`button-switch-${org.id}`}
                  >
                    Switch to this Organization
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {organizations && organizations.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No organizations found.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
