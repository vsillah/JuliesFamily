import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Users, Mail, DollarSign, ArrowRight, RefreshCw, Plus, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrganizationWizardSchema, type CreateOrganizationWizard } from "@shared/schema";
import { useLocation } from "wouter";
import { useOrganization } from "@/contexts/OrganizationContext";

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { currentOrg, switchOrganization, clearOverride } = useOrganization();

  // Form with validation
  const form = useForm<CreateOrganizationWizard>({
    resolver: zodResolver(createOrganizationWizardSchema),
    defaultValues: {
      name: "",
      tier: "basic",
    },
  });

  // Fetch all organizations
  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useQuery<Organization[]>({
    queryKey: ['/api/admin/organizations'],
  });

  // Switch organization using context (no page reload needed!)
  const switchOrgMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      await switchOrganization(organizationId);
      return { organizationId };
    },
    onSuccess: async (data) => {
      toast({
        title: "Organization Switched",
        description: `Now viewing organization ${data.organizationId}`,
      });
      // Navigate to home - context will handle cache invalidation
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch organization",
        variant: "destructive",
      });
    },
  });

  // Clear override using context (no page reload needed!)
  const clearOverrideMutation = useMutation({
    mutationFn: async () => {
      await clearOverride();
    },
    onSuccess: () => {
      toast({
        title: "Override Cleared",
        description: "Returned to default organization detection",
      });
      // Context handles cache invalidation automatically
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear override",
        variant: "destructive",
      });
    },
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data: CreateOrganizationWizard) => {
      const response = await apiRequest('POST', '/api/admin/organizations', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organization Created",
        description: `Successfully created ${data.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      // Surface backend validation errors as inline form errors
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            form.setError(err.path[0] as any, {
              type: "manual",
              message: err.message,
            });
          }
        });
      }
      
      // Also show toast for general errors
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
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

  const handleCreateOrg = (data: CreateOrganizationWizard) => {
    createOrgMutation.mutate(data);
  };

  const handleViewWebsite = (orgId: string) => {
    // If not the current org, switch to it first (mutation handles navigation)
    if (currentOrg?.organizationId !== orgId) {
      switchOrgMutation.mutate(orgId);
    } else {
      // Already on this org, just navigate
      setLocation('/');
    }
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
        <div className="flex gap-2">
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
          <Button
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-create-org"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
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

                {/* Action Buttons */}
                <div className="space-y-2">
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
                  
                  <Button
                    variant="outline"
                    onClick={() => handleViewWebsite(org.id)}
                    className="w-full"
                    data-testid={`button-view-website-${org.id}`}
                  >
                    View Website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
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

      {/* Create Organization Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            form.reset();
            createOrgMutation.reset();
          }
        }}
      >
        <DialogContent data-testid="dialog-create-org">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">Create New Organization</DialogTitle>
            <DialogDescription data-testid="text-dialog-description">
              Set up a new organization for KinFlo platform demos
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateOrg)} className="space-y-4 py-4" data-testid="form-create-org">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-org-name">Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., MENTOR Rhode Island"
                        {...field}
                        data-testid="input-org-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-org-name" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-org-tier">Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-org-tier">
                          <SelectValue placeholder="Select a tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent data-testid="select-org-tier-content">
                        <SelectItem value="basic" data-testid="select-tier-basic">Basic</SelectItem>
                        <SelectItem value="pro" data-testid="select-tier-pro">Pro</SelectItem>
                        <SelectItem value="premium" data-testid="select-tier-premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-org-tier" />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    form.reset();
                    createOrgMutation.reset();
                  }}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
