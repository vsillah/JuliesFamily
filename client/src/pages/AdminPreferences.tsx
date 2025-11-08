import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, Workflow, Monitor, Mail, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

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

export default function AdminPreferences() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<AdminPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current preferences
  const { data, isLoading } = useQuery<AdminPreferences>({
    queryKey: ["/api/admin/preferences"],
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AdminPreferences>) => {
      return await apiRequest("/api/admin/preferences", {
        method: "PATCH",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/preferences"] });
      toast({
        title: "Preferences saved",
        description: "Your admin preferences have been updated successfully.",
      });
      setHasChanges(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  const handleChange = (key: keyof AdminPreferences, value: any) => {
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (preferences) {
      updateMutation.mutate(preferences);
    }
  };

  const handleReset = () => {
    setPreferences(data || null);
    setHasChanges(false);
  };

  if (isLoading || !preferences) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize your admin experience with notifications, workflow automation, and interface settings.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="workflow" data-testid="tab-workflow">
            <Workflow className="w-4 h-4 mr-2" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="interface" data-testid="tab-interface">
            <Monitor className="w-4 h-4 mr-2" />
            Interface
          </TabsTrigger>
          <TabsTrigger value="communication" data-testid="tab-communication">
            <Mail className="w-4 h-4 mr-2" />
            Communication
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>
                Choose which events you'd like to be notified about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newLeadAlerts">New Lead Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a new lead is created
                  </p>
                </div>
                <Switch
                  id="newLeadAlerts"
                  checked={preferences.newLeadAlerts}
                  onCheckedChange={(checked) => handleChange("newLeadAlerts", checked)}
                  data-testid="switch-new-lead-alerts"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="taskAssignmentAlerts">Task Assignment Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you're assigned a task
                  </p>
                </div>
                <Switch
                  id="taskAssignmentAlerts"
                  checked={preferences.taskAssignmentAlerts}
                  onCheckedChange={(checked) => handleChange("taskAssignmentAlerts", checked)}
                  data-testid="switch-task-assignment-alerts"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="taskCompletionAlerts">Task Completion Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your tasks are completed
                  </p>
                </div>
                <Switch
                  id="taskCompletionAlerts"
                  checked={preferences.taskCompletionAlerts}
                  onCheckedChange={(checked) => handleChange("taskCompletionAlerts", checked)}
                  data-testid="switch-task-completion-alerts"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="donationAlerts">Donation Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a donation is received
                  </p>
                </div>
                <Switch
                  id="donationAlerts"
                  checked={preferences.donationAlerts}
                  onCheckedChange={(checked) => handleChange("donationAlerts", checked)}
                  data-testid="switch-donation-alerts"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailCampaignAlerts">Email Campaign Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about email campaign status changes
                  </p>
                </div>
                <Switch
                  id="emailCampaignAlerts"
                  checked={preferences.emailCampaignAlerts}
                  onCheckedChange={(checked) => handleChange("emailCampaignAlerts", checked)}
                  data-testid="switch-email-campaign-alerts"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="calendarEventReminders">Calendar Event Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for upcoming calendar events
                  </p>
                </div>
                <Switch
                  id="calendarEventReminders"
                  checked={preferences.calendarEventReminders}
                  onCheckedChange={(checked) => handleChange("calendarEventReminders", checked)}
                  data-testid="switch-calendar-event-reminders"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure workflow automation and default values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoAssignNewLeads">Auto-assign New Leads</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign new leads to yourself
                  </p>
                </div>
                <Switch
                  id="autoAssignNewLeads"
                  checked={preferences.autoAssignNewLeads}
                  onCheckedChange={(checked) => handleChange("autoAssignNewLeads", checked)}
                  data-testid="switch-auto-assign-leads"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTaskDueDateOffset">Default Task Due Date Offset (days)</Label>
                <Input
                  id="defaultTaskDueDateOffset"
                  type="number"
                  min="0"
                  max="365"
                  value={preferences.defaultTaskDueDateOffset}
                  onChange={(e) => handleChange("defaultTaskDueDateOffset", parseInt(e.target.value) || 0)}
                  data-testid="input-task-due-date-offset"
                />
                <p className="text-sm text-muted-foreground">
                  Tasks will be due this many days from creation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLeadStatus">Default Lead Status</Label>
                <Select
                  value={preferences.defaultLeadStatus}
                  onValueChange={(value) => handleChange("defaultLeadStatus", value)}
                >
                  <SelectTrigger id="defaultLeadStatus" data-testid="select-default-lead-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_lead" data-testid="option-lead-status-new-lead">New Lead</SelectItem>
                    <SelectItem value="contacted" data-testid="option-lead-status-contacted">Contacted</SelectItem>
                    <SelectItem value="qualified" data-testid="option-lead-status-qualified">Qualified</SelectItem>
                    <SelectItem value="nurturing" data-testid="option-lead-status-nurturing">Nurturing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredPipelineView">Preferred Pipeline View</Label>
                <Select
                  value={preferences.preferredPipelineView}
                  onValueChange={(value) => handleChange("preferredPipelineView", value)}
                >
                  <SelectTrigger id="preferredPipelineView" data-testid="select-pipeline-view">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kanban" data-testid="option-pipeline-view-kanban">Kanban Board</SelectItem>
                    <SelectItem value="list" data-testid="option-pipeline-view-list">List View</SelectItem>
                    <SelectItem value="table" data-testid="option-pipeline-view-table">Table View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interface Tab */}
        <TabsContent value="interface" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize your admin interface appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultLandingPage">Default Landing Page</Label>
                <Select
                  value={preferences.defaultLandingPage}
                  onValueChange={(value) => handleChange("defaultLandingPage", value)}
                >
                  <SelectTrigger id="defaultLandingPage" data-testid="select-default-landing-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/admin" data-testid="option-landing-page-dashboard">Dashboard</SelectItem>
                    <SelectItem value="/admin/leads" data-testid="option-landing-page-leads">Leads</SelectItem>
                    <SelectItem value="/admin/pipeline" data-testid="option-landing-page-pipeline">Pipeline</SelectItem>
                    <SelectItem value="/admin/tasks" data-testid="option-landing-page-tasks">Tasks</SelectItem>
                    <SelectItem value="/admin/content-manager" data-testid="option-landing-page-content">Content Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => handleChange("theme", value)}
                >
                  <SelectTrigger id="theme" data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" data-testid="option-theme-light">Light</SelectItem>
                    <SelectItem value="dark" data-testid="option-theme-dark">Dark</SelectItem>
                    <SelectItem value="system" data-testid="option-theme-system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemsPerPage">Items Per Page</Label>
                <Select
                  value={String(preferences.itemsPerPage)}
                  onValueChange={(value) => handleChange("itemsPerPage", parseInt(value))}
                >
                  <SelectTrigger id="itemsPerPage" data-testid="select-items-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10" data-testid="option-items-per-page-10">10</SelectItem>
                    <SelectItem value="25" data-testid="option-items-per-page-25">25</SelectItem>
                    <SelectItem value="50" data-testid="option-items-per-page-50">50</SelectItem>
                    <SelectItem value="100" data-testid="option-items-per-page-100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataDensity">Data Density</Label>
                <Select
                  value={preferences.dataDensity}
                  onValueChange={(value) => handleChange("dataDensity", value)}
                >
                  <SelectTrigger id="dataDensity" data-testid="select-data-density">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact" data-testid="option-data-density-compact">Compact</SelectItem>
                    <SelectItem value="comfortable" data-testid="option-data-density-comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious" data-testid="option-data-density-spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultContentFilter">Default Content Filter</Label>
                <Select
                  value={preferences.defaultContentFilter}
                  onValueChange={(value) => handleChange("defaultContentFilter", value)}
                >
                  <SelectTrigger id="defaultContentFilter" data-testid="select-content-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="option-content-filter-all">All Personas</SelectItem>
                    <SelectItem value="student" data-testid="option-content-filter-student">Student</SelectItem>
                    <SelectItem value="parent" data-testid="option-content-filter-parent">Parent</SelectItem>
                    <SelectItem value="donor" data-testid="option-content-filter-donor">Donor</SelectItem>
                    <SelectItem value="volunteer" data-testid="option-content-filter-volunteer">Volunteer</SelectItem>
                    <SelectItem value="provider" data-testid="option-content-filter-provider">Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication Digest</CardTitle>
              <CardDescription>
                Configure your email digest and report preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dailyDigestEnabled">Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of admin activities
                  </p>
                </div>
                <Switch
                  id="dailyDigestEnabled"
                  checked={preferences.dailyDigestEnabled}
                  onCheckedChange={(checked) => handleChange("dailyDigestEnabled", checked)}
                  data-testid="switch-daily-digest"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyReportEnabled">Weekly Report</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary report
                  </p>
                </div>
                <Switch
                  id="weeklyReportEnabled"
                  checked={preferences.weeklyReportEnabled}
                  onCheckedChange={(checked) => handleChange("weeklyReportEnabled", checked)}
                  data-testid="switch-weekly-report"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="criticalAlertsOnly">Critical Alerts Only</Label>
                  <p className="text-sm text-muted-foreground">
                    Only receive notifications for critical events
                  </p>
                </div>
                <Switch
                  id="criticalAlertsOnly"
                  checked={preferences.criticalAlertsOnly}
                  onCheckedChange={(checked) => handleChange("criticalAlertsOnly", checked)}
                  data-testid="switch-critical-alerts-only"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center justify-end gap-4 sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={updateMutation.isPending}
            data-testid="button-reset-preferences"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            data-testid="button-save-preferences"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      )}
    </div>
  );
}
