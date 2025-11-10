import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateUserProfileSchema } from "@shared/schema";
import type { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User as UserIcon, Shield, ChevronDown, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type ProfileFormValues = z.infer<typeof updateUserProfileSchema>;

interface AdminPreferences {
  // Notification Preferences
  newLeadAlerts: boolean;
  taskAssignmentAlerts: boolean;
  taskCompletionAlerts: boolean;
  donationAlerts: boolean;
  emailCampaignAlerts: boolean;
  calendarEventReminders: boolean;
  notificationChannels: string[];
  
  // Workflow Preferences
  autoAssignNewLeads: boolean;
  defaultTaskDueDateOffset: number;
  defaultLeadSource?: string;
  defaultLeadStatus: string;
  preferredPipelineView: string;
  
  // Interface Preferences
  defaultLandingPage: string;
  theme: string;
  itemsPerPage: number;
  dataDensity: string;
  defaultContentFilter: string;
  
  // Communication Preferences
  dailyDigestEnabled: boolean;
  weeklyReportEnabled: boolean;
  criticalAlertsOnly: boolean;
}

export default function Profile() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isAdmin } = useUserRole();
  const [adminControlsOpen, setAdminControlsOpen] = useState(false);
  const [adminPrefs, setAdminPrefs] = useState<AdminPreferences | null>(null);
  const [hasAdminChanges, setHasAdminChanges] = useState(false);

  // Fetch current user data
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Fetch admin preferences if user is admin
  const { data: adminPreferences, isLoading: isLoadingAdminPrefs } = useQuery<AdminPreferences>({
    queryKey: ["/api/admin/preferences"],
    enabled: isAdmin,
  });

  // Initialize form with empty defaults
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      profileImageUrl: "",
      passions: [],
    },
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      form.reset(
        {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          profileImageUrl: user.profileImageUrl || "",
          passions: user.passions ?? [],
        },
        { keepDirtyValues: true } // Preserve user edits during refetches
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // Initialize admin prefs when data loads
  useEffect(() => {
    if (adminPreferences && isAdmin) {
      setAdminPrefs(adminPreferences);
    }
  }, [adminPreferences, isAdmin]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      if (response.status === 204) {
        return null; // No content
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "✓ Profile updated successfully",
        description: "Your changes have been saved.",
        duration: 3000,
      });
      setIsSubmitting(false);
      setJustSaved(true);
      
      // Clear any existing timer
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      
      // Set new timer to clear success state after 3 seconds
      successTimerRef.current = setTimeout(() => {
        setJustSaved(false);
        successTimerRef.current = null;
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Update admin preferences mutation
  const updateAdminPrefsMutation = useMutation({
    mutationFn: async (updates: Partial<AdminPreferences>) => {
      const response = await apiRequest("PATCH", "/api/admin/preferences", updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/preferences"] });
      toast({
        title: "Admin preferences saved",
        description: "Your admin preferences have been updated successfully.",
        duration: 3000,
      });
      setHasAdminChanges(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save admin preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    updateProfileMutation.mutate(data);
  };

  const handleAdminPrefChange = (key: keyof AdminPreferences, value: any) => {
    setAdminPrefs(prev => prev ? { ...prev, [key]: value } : null);
    setHasAdminChanges(true);
  };

  const handleSaveAdminPrefs = () => {
    if (adminPrefs) {
      updateAdminPrefsMutation.mutate(adminPrefs);
    }
  };

  const handleResetAdminPrefs = () => {
    setAdminPrefs(adminPreferences || null);
    setHasAdminChanges(false);
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstInitial = user.firstName?.[0] || "";
    const lastInitial = user.lastName?.[0] || "";
    return (firstInitial + lastInitial).toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>Please log in to view your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" data-testid="button-login">
              <a href="/api/login">Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile Settings</CardTitle>
            <CardDescription>
              Update your personal information and profile photo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {justSaved && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4" data-testid="success-banner">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Save className="h-5 w-5" />
                  <p className="font-medium">Changes saved successfully!</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-border">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Profile Photo</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Update your profile photo from the navigation menu.
                </p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter your first name"
                          data-testid="input-firstname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter your last name"
                          data-testid="input-lastname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passions"
                  render={() => {
                    const passions = form.watch("passions") || [];
                    const passionOptions = [
                      { value: "literacy", label: "Literacy & Reading" },
                      { value: "stem", label: "STEM & Technology" },
                      { value: "arts", label: "Arts & Creativity" },
                      { value: "nutrition", label: "Nutrition & Wellness" },
                      { value: "community", label: "Community Building" },
                    ];

                    return (
                      <FormItem>
                        <FormLabel>Your Interests</FormLabel>
                        <FormDescription>
                          Select topics you're passionate about to see personalized content
                        </FormDescription>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {passionOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`passion-${option.value}`}
                                checked={passions.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  const currentPassions = form.getValues("passions") || [];
                                  if (checked) {
                                    form.setValue("passions", [...currentPassions, option.value], {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                  } else {
                                    form.setValue(
                                      "passions",
                                      currentPassions.filter((p) => p !== option.value),
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      }
                                    );
                                  }
                                }}
                                data-testid={`checkbox-passion-${option.value}`}
                              />
                              <label
                                htmlFor={`passion-${option.value}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <div className="flex flex-col gap-2">
                  {form.formState.isDirty && !isSubmitting && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 text-right" data-testid="unsaved-changes-indicator">
                      You have unsaved changes
                    </p>
                  )}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (user) {
                          form.reset({
                            firstName: user.firstName || "",
                            lastName: user.lastName || "",
                            profileImageUrl: user.profileImageUrl || "",
                            passions: user.passions ?? [],
                          });
                        }
                      }}
                      disabled={isSubmitting || !form.formState.isDirty}
                      className={isSubmitting || !form.formState.isDirty ? "opacity-50 cursor-not-allowed" : ""}
                      data-testid="button-reset"
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !form.formState.isDirty}
                      className={isSubmitting || !form.formState.isDirty ? "opacity-50 cursor-not-allowed" : ""}
                      data-testid="button-save-profile"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Admin Controls Section */}
        {isAdmin && adminPrefs && (
          <Card className="mt-6" data-testid="card-admin-controls">
            <Collapsible open={adminControlsOpen} onOpenChange={setAdminControlsOpen}>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <CardTitle>Admin Controls</CardTitle>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform group-hover:text-primary ${adminControlsOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CardDescription>
                  Quick access to key admin preferences
                </CardDescription>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Key Notification Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="admin-new-lead-alerts">New Lead Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when a new lead is created
                        </p>
                      </div>
                      <Switch
                        id="admin-new-lead-alerts"
                        checked={adminPrefs.newLeadAlerts}
                        onCheckedChange={(checked) => handleAdminPrefChange("newLeadAlerts", checked)}
                        data-testid="switch-admin-new-lead-alerts"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="admin-donation-alerts">Donation Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when a donation is received
                        </p>
                      </div>
                      <Switch
                        id="admin-donation-alerts"
                        checked={adminPrefs.donationAlerts}
                        onCheckedChange={(checked) => handleAdminPrefChange("donationAlerts", checked)}
                        data-testid="switch-admin-donation-alerts"
                      />
                    </div>
                  </div>

                  {/* Key Communication Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Communication</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="admin-daily-digest">Daily Digest</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive a daily summary of admin activities
                        </p>
                      </div>
                      <Switch
                        id="admin-daily-digest"
                        checked={adminPrefs.dailyDigestEnabled}
                        onCheckedChange={(checked) => handleAdminPrefChange("dailyDigestEnabled", checked)}
                        data-testid="switch-admin-daily-digest"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Link href="/admin/preferences">
                      <Button variant="ghost" size="sm" data-testid="link-view-all-admin-prefs">
                        View all admin preferences
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </Link>
                    {hasAdminChanges && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetAdminPrefs}
                          disabled={updateAdminPrefsMutation.isPending}
                          data-testid="button-reset-admin-prefs"
                        >
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveAdminPrefs}
                          disabled={updateAdminPrefsMutation.isPending}
                          data-testid="button-save-admin-prefs"
                        >
                          {updateAdminPrefsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>
    </div>
  );
}
