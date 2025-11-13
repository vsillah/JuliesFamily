import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Shield, BarChart3, Plus, Trash2, Edit } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminAutomationConfig() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [newProfile, setNewProfile] = useState({
    name: "",
    description: "",
    clickThroughWeight: 30,
    engagementWeight: 40,
    conversionWeight: 30,
  });

  // Fetch safety limits
  const { data: safetyLimits, isLoading: limitsLoading } = useQuery({
    queryKey: ["/api/automation/safety-limits"],
  });

  // Fetch metric weight profiles
  const { data: metricProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["/api/automation/metric-weight-profiles"],
  });

  const [limits, setLimits] = useState({
    maxConcurrentTests: 10,
    maxDailyGenerations: 20,
    maxVariantsPerTest: 3,
  });

  // Sync limits state when safety limits data loads
  useEffect(() => {
    if (safetyLimits) {
      setLimits({
        maxConcurrentTests: safetyLimits.maxConcurrentTests || 10,
        maxDailyGenerations: safetyLimits.maxDailyGenerations || 20,
        maxVariantsPerTest: safetyLimits.maxVariantsPerTest || 3,
      });
    }
  }, [safetyLimits]);

  // Update safety limits mutation
  const updateLimitsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/automation/safety-limits", {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/safety-limits"] });
      toast({
        title: "Safety limits updated",
        description: "Automation safety limits have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update safety limits",
        variant: "destructive",
      });
    },
  });

  // Create metric profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/automation/metric-weight-profiles", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/metric-weight-profiles"] });
      setIsProfileDialogOpen(false);
      setNewProfile({
        name: "",
        description: "",
        clickThroughWeight: 30,
        engagementWeight: 40,
        conversionWeight: 30,
      });
      toast({
        title: "Profile created",
        description: "Metric weight profile has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create metric profile",
        variant: "destructive",
      });
    },
  });

  // Update metric profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/automation/metric-weight-profiles/${id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/metric-weight-profiles"] });
      setIsProfileDialogOpen(false);
      setEditingProfile(null);
      toast({
        title: "Profile updated",
        description: "Metric weight profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update metric profile",
        variant: "destructive",
      });
    },
  });

  // Delete metric profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/automation/metric-weight-profiles/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/metric-weight-profiles"] });
      toast({
        title: "Profile deleted",
        description: "Metric weight profile has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete metric profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveLimits = () => {
    updateLimitsMutation.mutate(limits);
  };

  const handleCreateOrUpdateProfile = () => {
    if (editingProfile) {
      updateProfileMutation.mutate({
        id: editingProfile.id,
        data: newProfile,
      });
    } else {
      createProfileMutation.mutate(newProfile);
    }
  };

  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile);
    setNewProfile({
      name: profile.name,
      description: profile.description || "",
      clickThroughWeight: profile.clickThroughWeight,
      engagementWeight: profile.engagementWeight,
      conversionWeight: profile.conversionWeight,
    });
    setIsProfileDialogOpen(true);
  };

  const handleDeleteProfile = (id: string) => {
    if (confirm("Are you sure you want to delete this metric weight profile?")) {
      deleteProfileMutation.mutate(id);
    }
  };

  const breadcrumbItems = [
    { label: "Admin", href: "/admin" },
    { label: "Automation", href: "/admin/automation-rules" },
    { label: "Configuration" },
  ];

  if (!user?.role || !["admin", "super_admin"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h1 className="text-3xl font-bold">Automation Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Configure safety limits and metric evaluation profiles
          </p>
        </div>
      </div>

      {/* Safety Limits Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Safety Limits</CardTitle>
          </div>
          <CardDescription>
            Configure automation safety limits to prevent runaway testing and AI usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxConcurrentTests">Max Concurrent Tests</Label>
              <Input
                id="maxConcurrentTests"
                type="number"
                min={1}
                max={50}
                value={limits.maxConcurrentTests}
                onChange={(e) => setLimits({ ...limits, maxConcurrentTests: parseInt(e.target.value) || 10 })}
                data-testid="input-max-concurrent-tests"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of automated tests running simultaneously
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDailyGenerations">Max Daily AI Generations</Label>
              <Input
                id="maxDailyGenerations"
                type="number"
                min={1}
                max={200}
                value={limits.maxDailyGenerations}
                onChange={(e) => setLimits({ ...limits, maxDailyGenerations: parseInt(e.target.value) || 20 })}
                data-testid="input-max-daily-generations"
              />
              <p className="text-xs text-muted-foreground">
                Maximum AI variant generations per day
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxVariantsPerTest">Max Variants Per Test</Label>
              <Input
                id="maxVariantsPerTest"
                type="number"
                min={2}
                max={5}
                value={limits.maxVariantsPerTest}
                onChange={(e) => setLimits({ ...limits, maxVariantsPerTest: parseInt(e.target.value) || 3 })}
                data-testid="input-max-variants-per-test"
              />
              <p className="text-xs text-muted-foreground">
                Maximum variants to generate per automated test
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveLimits}
            disabled={updateLimitsMutation.isPending}
            data-testid="button-save-limits"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateLimitsMutation.isPending ? "Saving..." : "Save Limits"}
          </Button>
        </CardContent>
      </Card>

      {/* Metric Weight Profiles Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <div>
                <CardTitle>Metric Weight Profiles</CardTitle>
                <CardDescription>
                  Define how different metrics contribute to performance evaluation
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingProfile(null);
                setNewProfile({
                  name: "",
                  description: "",
                  clickThroughWeight: 30,
                  engagementWeight: 40,
                  conversionWeight: 30,
                });
                setIsProfileDialogOpen(true);
              }}
              data-testid="button-create-profile"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profilesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading profiles...</div>
          ) : metricProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No metric weight profiles configured. Create one to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {metricProfiles.map((profile: any) => (
                <div
                  key={profile.id}
                  className="border rounded-md p-4 space-y-2"
                  data-testid={`profile-${profile.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{profile.name}</h3>
                      {profile.description && (
                        <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProfile(profile)}
                        data-testid={`button-edit-profile-${profile.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProfile(profile.id)}
                        data-testid={`button-delete-profile-${profile.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Click-Through:</span>{" "}
                      <span className="font-medium">{profile.clickThroughWeight}%</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Engagement:</span>{" "}
                      <span className="font-medium">{profile.engagementWeight}%</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Conversion:</span>{" "}
                      <span className="font-medium">{profile.conversionWeight}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? "Edit Metric Weight Profile" : "Create Metric Weight Profile"}
            </DialogTitle>
            <DialogDescription>
              Define weights for different performance metrics (must total 100%)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Profile Name</Label>
              <Input
                id="profileName"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                placeholder="e.g., Hero Default, CTA Conversion-Focused"
                data-testid="input-profile-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileDescription">Description (Optional)</Label>
              <Textarea
                id="profileDescription"
                value={newProfile.description}
                onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                placeholder="Describe when to use this profile..."
                rows={2}
                data-testid="input-profile-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clickThroughWeight">Click-Through Weight (%)</Label>
              <Input
                id="clickThroughWeight"
                type="number"
                min={0}
                max={100}
                value={newProfile.clickThroughWeight}
                onChange={(e) =>
                  setNewProfile({ ...newProfile, clickThroughWeight: parseInt(e.target.value) || 0 })
                }
                data-testid="input-click-through-weight"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="engagementWeight">Engagement Weight (%)</Label>
              <Input
                id="engagementWeight"
                type="number"
                min={0}
                max={100}
                value={newProfile.engagementWeight}
                onChange={(e) =>
                  setNewProfile({ ...newProfile, engagementWeight: parseInt(e.target.value) || 0 })
                }
                data-testid="input-engagement-weight"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversionWeight">Conversion Weight (%)</Label>
              <Input
                id="conversionWeight"
                type="number"
                min={0}
                max={100}
                value={newProfile.conversionWeight}
                onChange={(e) =>
                  setNewProfile({ ...newProfile, conversionWeight: parseInt(e.target.value) || 0 })
                }
                data-testid="input-conversion-weight"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Total:{" "}
              <span
                className={
                  newProfile.clickThroughWeight + newProfile.engagementWeight + newProfile.conversionWeight ===
                  100
                    ? "text-green-600 font-medium"
                    : "text-destructive font-medium"
                }
              >
                {newProfile.clickThroughWeight + newProfile.engagementWeight + newProfile.conversionWeight}%
              </span>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrUpdateProfile}
                disabled={
                  !newProfile.name ||
                  newProfile.clickThroughWeight + newProfile.engagementWeight + newProfile.conversionWeight !==
                    100 ||
                  createProfileMutation.isPending ||
                  updateProfileMutation.isPending
                }
                data-testid="button-save-profile"
              >
                {createProfileMutation.isPending || updateProfileMutation.isPending
                  ? "Saving..."
                  : editingProfile
                  ? "Update Profile"
                  : "Create Profile"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
