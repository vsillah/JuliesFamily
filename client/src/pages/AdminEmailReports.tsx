import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { EmailReportSchedule } from "@shared/schema";
import { insertEmailReportScheduleSchema } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Trash2, 
  Plus,
  Clock,
  Send,
  Play,
  Pause,
  Edit
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

// Form schema that accepts recipientsText and transforms to recipients array
const emailReportFormSchema = insertEmailReportScheduleSchema.omit({ recipients: true }).extend({
  recipientsText: z.string()
    .min(1, "At least one recipient email is required")
    .refine((val) => {
      const emails = val.split(',').map(e => e.trim()).filter(e => e.length > 0);
      return emails.length > 0;
    }, "At least one valid email is required")
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = val.split(',').map(e => e.trim()).filter(e => e.length > 0);
      return emails.every(email => emailRegex.test(email));
    }, "All emails must be valid email addresses"),
});

type EmailReportFormValues = z.infer<typeof emailReportFormSchema>;

export default function AdminEmailReports() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<EmailReportSchedule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    scheduleId: string;
    scheduleName: string;
  } | null>(null);

  // Create form
  const createForm = useForm<EmailReportFormValues>({
    resolver: zodResolver(emailReportFormSchema),
    defaultValues: {
      name: "",
      recipientsText: "",
      frequency: "daily",
      reportType: "campaign_summary",
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<EmailReportFormValues>({
    resolver: zodResolver(emailReportFormSchema),
    defaultValues: {
      name: "",
      recipientsText: "",
      frequency: "daily",
      reportType: "campaign_summary",
      isActive: true,
    },
  });

  // Fetch all schedules
  const { data: schedules = [], isLoading } = useQuery<EmailReportSchedule[]>({
    queryKey: ["/api/email-report-schedules"],
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: EmailReportFormValues) => {
      // Transform recipientsText to recipients array
      const recipients = data.recipientsText
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const payload = {
        name: data.name,
        recipients,
        frequency: data.frequency,
        reportType: data.reportType,
        isActive: data.isActive,
      };

      return apiRequest("POST", "/api/email-report-schedules", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-report-schedules"] });
      toast({
        title: "Success",
        description: "Email report schedule created successfully",
      });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive",
      });
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EmailReportFormValues }) => {
      // Transform recipientsText to recipients array
      const recipients = data.recipientsText
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const payload = {
        name: data.name,
        recipients,
        frequency: data.frequency,
        reportType: data.reportType,
        isActive: data.isActive,
      };

      return apiRequest("PATCH", `/api/email-report-schedules/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-report-schedules"] });
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      setEditSchedule(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/email-report-schedules/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-report-schedules"] });
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

  // Manual send mutation
  const sendNowMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/email-report-schedules/${id}/send-now`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send report",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = (schedule: EmailReportSchedule) => {
    editForm.reset({
      name: schedule.name,
      recipientsText: schedule.recipients.join(', '),
      frequency: schedule.frequency as 'daily' | 'weekly' | 'monthly',
      reportType: schedule.reportType as 'campaign_summary' | 'engagement_summary' | 'full_analytics',
      isActive: schedule.isActive,
    });
    setEditSchedule(schedule);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const formatReportType = (reportType: string) => {
    const typeMap: Record<string, string> = {
      campaign_summary: "Campaign Summary",
      engagement_summary: "Engagement Summary",
      full_analytics: "Full Analytics",
    };
    return typeMap[reportType] || reportType;
  };

  const formatRecipients = (recipients: string[]) => {
    if (recipients.length === 0) return "No recipients";
    if (recipients.length === 1) return recipients[0];
    if (recipients.length === 2) return recipients.join(", ");
    return `${recipients.slice(0, 2).join(", ")} +${recipients.length - 2} more`;
  };

  const onCreateSubmit = (data: EmailReportFormValues) => {
    createScheduleMutation.mutate(data);
  };

  const onEditSubmit = (data: EmailReportFormValues) => {
    if (!editSchedule) return;
    updateScheduleMutation.mutate({ id: editSchedule.id, data });
  };

  return (
    <div className="min-h-screen">
      <Breadcrumbs 
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Email Report Schedules", href: "/admin/email-reports" }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Email Report Schedules</h1>
            <p className="text-muted-foreground mt-2">
              Automated email reports sent to stakeholders on a recurring schedule
            </p>
          </div>
          <Button 
            onClick={() => {
              createForm.reset();
              setCreateDialogOpen(true);
            }}
            data-testid="button-create-schedule"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Schedule
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Scheduled Reports
            </CardTitle>
            <CardDescription>
              Configure automated email reports for campaign performance, engagement metrics, and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No email report schedules configured
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Report Type</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div className="font-medium" data-testid={`text-schedule-name-${schedule.id}`}>
                            {schedule.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-report-type-${schedule.id}`}>
                            {formatReportType(schedule.reportType)}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-frequency-${schedule.id}`}>
                          {formatFrequency(schedule.frequency)}
                        </TableCell>
                        <TableCell>
                          <div 
                            className="text-sm text-muted-foreground max-w-xs truncate" 
                            title={schedule.recipients.join(', ')}
                            data-testid={`text-recipients-${schedule.id}`}
                          >
                            {formatRecipients(schedule.recipients)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {schedule.isActive ? (
                            <Badge variant="default" data-testid={`badge-status-active-${schedule.id}`}>
                              <Play className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" data-testid={`badge-status-inactive-${schedule.id}`}>
                              <Pause className="w-3 h-3 mr-1" />
                              Paused
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground" data-testid={`text-next-run-${schedule.id}`}>
                            <Clock className="w-3 h-3" />
                            {formatDate(schedule.nextRunAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground" data-testid={`text-last-run-${schedule.id}`}>
                            {formatDate(schedule.lastRunAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendNowMutation.mutate(schedule.id)}
                              disabled={sendNowMutation.isPending}
                              data-testid={`button-send-now-${schedule.id}`}
                              title="Send report now"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Simple partial update for toggle - only updates isActive field
                                apiRequest("PATCH", `/api/email-report-schedules/${schedule.id}`, {
                                  isActive: !schedule.isActive
                                }).then(() => {
                                  queryClient.invalidateQueries({ queryKey: ["/api/email-report-schedules"] });
                                  toast({
                                    title: "Success",
                                    description: `Schedule ${!schedule.isActive ? 'activated' : 'paused'} successfully`,
                                  });
                                }).catch((error: any) => {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to toggle schedule",
                                    variant: "destructive",
                                  });
                                });
                              }}
                              data-testid={`button-toggle-${schedule.id}`}
                              title={schedule.isActive ? "Pause schedule" : "Activate schedule"}
                            >
                              {schedule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(schedule)}
                              data-testid={`button-edit-${schedule.id}`}
                              title="Edit schedule"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm({ 
                                scheduleId: schedule.id, 
                                scheduleName: schedule.name 
                              })}
                              data-testid={`button-delete-${schedule.id}`}
                              title="Delete schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Schedule Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-schedule">
          <DialogHeader>
            <DialogTitle>Create Email Report Schedule</DialogTitle>
            <DialogDescription>
              Configure a recurring email report schedule with recipients and timing
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Weekly Campaign Performance Report"
                        {...field}
                        data-testid="input-schedule-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="recipientsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipients (comma-separated emails) *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="email1@example.com, email2@example.com"
                        rows={3}
                        {...field}
                        data-testid="textarea-recipients"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter email addresses separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="reportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-report-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="campaign_summary" data-testid="select-item-campaign-summary">
                            Campaign Summary
                          </SelectItem>
                          <SelectItem value="engagement_summary" data-testid="select-item-engagement-summary">
                            Engagement Summary
                          </SelectItem>
                          <SelectItem value="full_analytics" data-testid="select-item-full-analytics">
                            Full Analytics
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-frequency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily" data-testid="select-item-daily">Daily</SelectItem>
                          <SelectItem value="weekly" data-testid="select-item-weekly">Weekly</SelectItem>
                          <SelectItem value="monthly" data-testid="select-item-monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 rounded-md border">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Schedule will run automatically when active
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> The next run time will be automatically calculated based on the frequency:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 ml-4 list-disc">
                  <li>Daily: Tomorrow at 8:00 AM (or today if before 8:00 AM)</li>
                  <li>Weekly: Next Monday at 8:00 AM</li>
                  <li>Monthly: 1st of next month at 8:00 AM</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Times are in America/New_York timezone
                </p>
              </div>

              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createScheduleMutation.isPending}
                  data-testid="button-confirm-create"
                >
                  {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      {editSchedule && (
        <Dialog open={!!editSchedule} onOpenChange={() => setEditSchedule(null)}>
          <DialogContent className="max-w-2xl" data-testid="dialog-edit-schedule">
            <DialogHeader>
              <DialogTitle>Edit Email Report Schedule</DialogTitle>
              <DialogDescription>
                Update the schedule configuration
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Weekly Campaign Performance Report"
                          {...field}
                          data-testid="input-edit-schedule-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="recipientsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipients (comma-separated emails) *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="email1@example.com, email2@example.com"
                          rows={3}
                          {...field}
                          data-testid="textarea-edit-recipients"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter email addresses separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-report-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="campaign_summary" data-testid="select-item-edit-campaign-summary">
                              Campaign Summary
                            </SelectItem>
                            <SelectItem value="engagement_summary" data-testid="select-item-edit-engagement-summary">
                              Engagement Summary
                            </SelectItem>
                            <SelectItem value="full_analytics" data-testid="select-item-edit-full-analytics">
                              Full Analytics
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-frequency">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily" data-testid="select-item-edit-daily">Daily</SelectItem>
                            <SelectItem value="weekly" data-testid="select-item-edit-weekly">Weekly</SelectItem>
                            <SelectItem value="monthly" data-testid="select-item-edit-monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 rounded-md border">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Schedule will run automatically when active
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> If you change the frequency, the next run time will be recalculated automatically.
                  </p>
                </div>

                <DialogFooter>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setEditSchedule(null)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateScheduleMutation.isPending}
                    data-testid="button-confirm-edit"
                  >
                    {updateScheduleMutation.isPending ? "Updating..." : "Update Schedule"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent data-testid="dialog-delete-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Email Report Schedule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the schedule "{deleteConfirm.scheduleName}"? 
                This action cannot be undone and will stop all future automated reports.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteScheduleMutation.mutate(deleteConfirm.scheduleId)}
                disabled={deleteScheduleMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteScheduleMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
