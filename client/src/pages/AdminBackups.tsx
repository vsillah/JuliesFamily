import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BackupSnapshot, BackupSchedule } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Download, 
  Trash2, 
  RotateCcw, 
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Play,
  Pause
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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

// Scheduled Backups Tab Component
function ScheduledBackupsTab({ availableTables }: { availableTables: string[] }) {
  const { toast } = useToast();
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<BackupSchedule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    scheduleId: string;
    tableName: string;
  } | null>(null);

  const [newSchedule, setNewSchedule] = useState({
    tableName: "",
    scheduleType: "daily" as "daily" | "weekly" | "monthly" | "custom",
    scheduleConfig: { hour: 2, minute: 0, timezone: "America/New_York" } as any,
    retentionCount: 7,
    isActive: true,
  });

  // Fetch all schedules
  const { data: schedules = [], isLoading } = useQuery<BackupSchedule[]>({
    queryKey: ["/api/admin/backup-schedules"],
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/backup-schedules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backup-schedules"] });
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
      setCreateScheduleOpen(false);
      resetForm();
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
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/admin/backup-schedules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backup-schedules"] });
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      setEditSchedule(null);
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
      return apiRequest("DELETE", `/api/admin/backup-schedules/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backup-schedules"] });
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

  const resetForm = () => {
    setNewSchedule({
      tableName: "",
      scheduleType: "daily",
      scheduleConfig: { hour: 2, minute: 0, timezone: "America/New_York" },
      retentionCount: 7,
      isActive: true,
    });
  };

  const handleCreateSchedule = () => {
    if (!newSchedule.tableName) {
      toast({
        title: "Error",
        description: "Please select a table",
        variant: "destructive",
      });
      return;
    }
    createScheduleMutation.mutate(newSchedule);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const formatTableName = (tableName: string) => {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatScheduleType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatScheduleDetails = (schedule: BackupSchedule) => {
    const config = schedule.scheduleConfig as any;
    const hour = String(config.hour || 0).padStart(2, '0');
    const minute = String(config.minute || 0).padStart(2, '0');
    
    let details = `${hour}:${minute}`;
    
    if (schedule.scheduleType === 'weekly' && config.dayOfWeek !== undefined) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      details += ` on ${days[config.dayOfWeek]}`;
    } else if (schedule.scheduleType === 'monthly' && config.dayOfMonth) {
      details += ` on day ${config.dayOfMonth}`;
    }
    
    return details;
  };

  return (
    <>
      <div className="flex justify-end">
        <Button 
          onClick={() => setCreateScheduleOpen(true)}
          data-testid="button-create-schedule"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Backups</CardTitle>
          <CardDescription>
            Automated backups that run on a recurring schedule with retention policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled backups configured
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <Badge variant="outline" data-testid={`badge-schedule-table-${schedule.tableName}`}>
                          {formatTableName(schedule.tableName)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-schedule-type-${schedule.id}`}>
                        {formatScheduleType(schedule.scheduleType)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-schedule-details-${schedule.id}`}>
                        {formatScheduleDetails(schedule)}
                      </TableCell>
                      <TableCell data-testid={`text-schedule-retention-${schedule.id}`}>
                        Keep {schedule.retentionCount}
                      </TableCell>
                      <TableCell>
                        {schedule.isActive ? (
                          <Badge variant="default" data-testid={`badge-schedule-active-${schedule.id}`}>
                            <Play className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" data-testid={`badge-schedule-inactive-${schedule.id}`}>
                            <Pause className="w-3 h-3 mr-1" />
                            Paused
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground" data-testid={`text-schedule-next-run-${schedule.id}`}>
                          <Clock className="w-3 h-3" />
                          {formatDate(schedule.nextRun)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateScheduleMutation.mutate({
                              id: schedule.id,
                              data: { isActive: !schedule.isActive }
                            })}
                            data-testid={`button-toggle-schedule-${schedule.id}`}
                          >
                            {schedule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm({ 
                              scheduleId: schedule.id, 
                              tableName: schedule.tableName 
                            })}
                            data-testid={`button-delete-schedule-${schedule.id}`}
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

      {/* Create Schedule Dialog */}
      <Dialog open={createScheduleOpen} onOpenChange={setCreateScheduleOpen}>
        <DialogContent data-testid="dialog-create-schedule">
          <DialogHeader>
            <DialogTitle>Create Backup Schedule</DialogTitle>
            <DialogDescription>
              Configure a recurring backup schedule with retention policy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-table">Table *</Label>
              <Select
                value={newSchedule.tableName}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, tableName: value })}
              >
                <SelectTrigger id="schedule-table" data-testid="select-schedule-table">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table} value={table} data-testid={`select-item-schedule-table-${table}`}>
                      {formatTableName(table)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-type">Schedule Type *</Label>
              <Select
                value={newSchedule.scheduleType}
                onValueChange={(value: any) => {
                  const baseConfig = { 
                    hour: newSchedule.scheduleConfig.hour || 2, 
                    minute: newSchedule.scheduleConfig.minute || 0,
                    timezone: newSchedule.scheduleConfig.timezone || "America/New_York"
                  };
                  
                  let config = { ...baseConfig };
                  if (value === 'weekly') config = { ...baseConfig, dayOfWeek: 0 };
                  if (value === 'monthly') config = { ...baseConfig, dayOfMonth: 1 };
                  
                  setNewSchedule({ ...newSchedule, scheduleType: value, scheduleConfig: config });
                }}
              >
                <SelectTrigger id="schedule-type" data-testid="select-schedule-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily" data-testid="select-item-type-daily">Daily</SelectItem>
                  <SelectItem value="weekly" data-testid="select-item-type-weekly">Weekly</SelectItem>
                  <SelectItem value="monthly" data-testid="select-item-type-monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-hour">Hour (0-23) *</Label>
                <Input
                  id="schedule-hour"
                  type="number"
                  min="0"
                  max="23"
                  value={newSchedule.scheduleConfig.hour || 2}
                  onChange={(e) => setNewSchedule({ 
                    ...newSchedule, 
                    scheduleConfig: { ...newSchedule.scheduleConfig, hour: parseInt(e.target.value) || 0 }
                  })}
                  data-testid="input-schedule-hour"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-minute">Minute (0-59) *</Label>
                <Input
                  id="schedule-minute"
                  type="number"
                  min="0"
                  max="59"
                  value={newSchedule.scheduleConfig.minute || 0}
                  onChange={(e) => setNewSchedule({ 
                    ...newSchedule, 
                    scheduleConfig: { ...newSchedule.scheduleConfig, minute: parseInt(e.target.value) || 0 }
                  })}
                  data-testid="input-schedule-minute"
                />
              </div>
            </div>

            {newSchedule.scheduleType === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="schedule-day-of-week">Day of Week *</Label>
                <Select
                  value={String(newSchedule.scheduleConfig.dayOfWeek ?? 0)}
                  onValueChange={(value) => setNewSchedule({ 
                    ...newSchedule, 
                    scheduleConfig: { ...newSchedule.scheduleConfig, dayOfWeek: parseInt(value) }
                  })}
                >
                  <SelectTrigger id="schedule-day-of-week" data-testid="select-schedule-day-of-week">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" data-testid="select-item-dow-sunday">Sunday</SelectItem>
                    <SelectItem value="1" data-testid="select-item-dow-monday">Monday</SelectItem>
                    <SelectItem value="2" data-testid="select-item-dow-tuesday">Tuesday</SelectItem>
                    <SelectItem value="3" data-testid="select-item-dow-wednesday">Wednesday</SelectItem>
                    <SelectItem value="4" data-testid="select-item-dow-thursday">Thursday</SelectItem>
                    <SelectItem value="5" data-testid="select-item-dow-friday">Friday</SelectItem>
                    <SelectItem value="6" data-testid="select-item-dow-saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {newSchedule.scheduleType === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="schedule-day-of-month">Day of Month (1-31) *</Label>
                <Input
                  id="schedule-day-of-month"
                  type="number"
                  min="1"
                  max="31"
                  value={newSchedule.scheduleConfig.dayOfMonth || 1}
                  onChange={(e) => setNewSchedule({ 
                    ...newSchedule, 
                    scheduleConfig: { ...newSchedule.scheduleConfig, dayOfMonth: parseInt(e.target.value) || 1 }
                  })}
                  data-testid="input-schedule-day-of-month"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="schedule-retention">Retention Count *</Label>
              <Input
                id="schedule-retention"
                type="number"
                min="1"
                max="100"
                value={newSchedule.retentionCount}
                onChange={(e) => setNewSchedule({ ...newSchedule, retentionCount: parseInt(e.target.value) || 7 })}
                data-testid="input-schedule-retention"
              />
              <p className="text-xs text-muted-foreground">
                Number of recent backups to keep for this schedule
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateScheduleOpen(false)}
              data-testid="button-cancel-create-schedule"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSchedule} 
              disabled={createScheduleMutation.isPending}
              data-testid="button-confirm-create-schedule"
            >
              {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent data-testid="dialog-delete-schedule">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Delete Schedule
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the backup schedule for{" "}
                <strong>{formatTableName(deleteConfirm.tableName)}</strong>?
                <br />
                <br />
                This will not delete existing backups, only the recurring schedule.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-schedule">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteScheduleMutation.mutate(deleteConfirm.scheduleId)}
                data-testid="button-confirm-delete-schedule"
              >
                {deleteScheduleMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

export default function AdminBackups() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterTable, setFilterTable] = useState<string>("all");
  const [restoreDialog, setRestoreDialog] = useState<{
    backup: BackupSnapshot;
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<"replace" | "merge">("replace");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    backupId: string;
    backupName: string;
  } | null>(null);
  const [newBackup, setNewBackup] = useState({
    tableName: "",
    backupName: "",
    description: "",
  });

  // Fetch available tables
  const { data: availableTables = [] } = useQuery<string[]>({
    queryKey: ["/api/admin/backups/tables"],
  });

  // Fetch all backups
  const { data: allBackups = [], isLoading } = useQuery<BackupSnapshot[]>({
    queryKey: ["/api/admin/backups"],
  });

  // Filter backups by selected table
  const filteredBackups = filterTable === "all" 
    ? allBackups 
    : allBackups.filter(b => b.tableName === filterTable);

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async (data: { tableName: string; backupName?: string; description?: string }) => {
      return apiRequest("POST", "/api/admin/backups/create", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backups"] });
      toast({
        title: "Success",
        description: "Backup created successfully",
      });
      setCreateDialogOpen(false);
      setNewBackup({ tableName: "", backupName: "", description: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create backup",
        variant: "destructive",
      });
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async ({ id, mode }: { id: string; mode: "replace" | "merge" }) => {
      return apiRequest("POST", `/api/admin/backups/${id}/restore`, { mode });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backups"] });
      toast({
        title: "Success",
        description: `Restored ${data.rowsRestored} rows to ${data.tableName} table`,
      });
      setRestoreDialog(null);
      setRestoreMode("replace");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore from backup",
        variant: "destructive",
      });
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/backups/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backups"] });
      toast({
        title: "Success",
        description: "Backup deleted successfully",
      });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete backup",
        variant: "destructive",
      });
    },
  });

  const handleCreateBackup = () => {
    if (!newBackup.tableName) {
      toast({
        title: "Error",
        description: "Please select a table to backup",
        variant: "destructive",
      });
      return;
    }
    createBackupMutation.mutate(newBackup);
  };

  const handleRestoreBackup = () => {
    if (!restoreDialog) return;
    restoreBackupMutation.mutate({
      id: restoreDialog.backup.id,
      mode: restoreMode,
    });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const formatTableName = (tableName: string) => {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumbs items={[
          { label: "Admin", href: "/admin" },
          { label: "Database Backups" }
        ]} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database Backups</h1>
            <p className="text-muted-foreground mt-1">
              Surgical table-level backup and restore capabilities
            </p>
          </div>
        </div>

        {/* Tabs for Manual and Scheduled Backups */}
        <Tabs defaultValue="manual" className="w-full">
          <TabsList data-testid="tabs-backup-list">
            <TabsTrigger value="manual" data-testid="tab-manual-backups">
              <Database className="w-4 h-4 mr-2" />
              Manual Backups
            </TabsTrigger>
            <TabsTrigger value="scheduled" data-testid="tab-scheduled-backups">
              <Calendar className="w-4 h-4 mr-2" />
              Scheduled Backups
            </TabsTrigger>
          </TabsList>

          {/* Manual Backups Tab */}
          <TabsContent value="manual" className="space-y-6 mt-6">
            <div className="flex justify-end">
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                data-testid="button-create-backup"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Backup
              </Button>
            </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Backup Overview
            </CardTitle>
            <CardDescription>
              Create table-level backups for surgical restore capabilities. Backups are stored as separate database tables and can be restored using either replace (overwrites current data) or merge (adds missing rows) mode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold" data-testid="text-total-backups">{allBackups.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Tables</p>
                <p className="text-2xl font-bold" data-testid="text-available-tables">{availableTables.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rows Backed Up</p>
                <p className="text-2xl font-bold" data-testid="text-total-rows">
                  {allBackups.reduce((sum, b) => sum + b.rowCount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backups List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Backup History</CardTitle>
              <div className="w-full sm:w-auto">
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-table">
                    <SelectValue placeholder="Filter by table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="select-item-all-tables">All Tables</SelectItem>
                    {availableTables.map((table) => (
                      <SelectItem key={table} value={table} data-testid={`select-item-table-${table}`}>
                        {formatTableName(table)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading backups...</div>
            ) : filteredBackups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No backups found{filterTable !== "all" && ` for ${formatTableName(filterTable)}`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>Backup Name</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBackups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-table-${backup.tableName}`}>
                            {formatTableName(backup.tableName)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium" data-testid={`text-backup-name-${backup.id}`}>
                              {backup.backupName}
                            </span>
                            {backup.description && (
                              <span className="text-xs text-muted-foreground">
                                {backup.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-row-count-${backup.id}`}>
                          {backup.rowCount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(backup.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRestoreDialog({ backup })}
                              data-testid={`button-restore-${backup.id}`}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm({ 
                                backupId: backup.id, 
                                backupName: backup.backupName || "Unnamed backup" 
                              })}
                              data-testid={`button-delete-${backup.id}`}
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
          </TabsContent>

          {/* Scheduled Backups Tab */}
          <TabsContent value="scheduled" className="space-y-6 mt-6">
            <ScheduledBackupsTab availableTables={availableTables} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Backup Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-backup">
          <DialogHeader>
            <DialogTitle>Create Database Backup</DialogTitle>
            <DialogDescription>
              Select a table and optionally provide a name and description for this backup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table">Table *</Label>
              <Select
                value={newBackup.tableName}
                onValueChange={(value) => setNewBackup({ ...newBackup, tableName: value })}
              >
                <SelectTrigger id="table" data-testid="select-backup-table">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table} value={table} data-testid={`select-item-create-table-${table}`}>
                      {formatTableName(table)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backupName">Backup Name (optional)</Label>
              <Input
                id="backupName"
                placeholder="e.g., Before migration"
                value={newBackup.backupName}
                onChange={(e) => setNewBackup({ ...newBackup, backupName: e.target.value })}
                data-testid="input-backup-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this backup..."
                value={newBackup.description}
                onChange={(e) => setNewBackup({ ...newBackup, description: e.target.value })}
                data-testid="textarea-backup-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBackup} 
              disabled={createBackupMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createBackupMutation.isPending ? "Creating..." : "Create Backup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      {restoreDialog && (
        <AlertDialog open={!!restoreDialog} onOpenChange={() => setRestoreDialog(null)}>
          <AlertDialogContent data-testid="dialog-restore-backup">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Restore from Backup
              </AlertDialogTitle>
              <AlertDialogDescription>
                You are about to restore the <strong>{formatTableName(restoreDialog.backup.tableName)}</strong> table from backup:
                <br />
                <strong>{restoreDialog.backup.backupName}</strong>
                <br />
                <span className="text-xs text-muted-foreground">
                  Created: {formatDate(restoreDialog.backup.createdAt)} | Rows: {restoreDialog.backup.rowCount.toLocaleString()}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <Label>Restore Mode</Label>
              <RadioGroup value={restoreMode} onValueChange={(value) => setRestoreMode(value as "replace" | "merge")}>
                <div className="flex items-start space-x-2 rounded-md border p-4">
                  <RadioGroupItem value="replace" id="replace" data-testid="radio-mode-replace" />
                  <div className="flex-1">
                    <Label htmlFor="replace" className="font-semibold cursor-pointer">
                      Replace (Overwrite)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Deletes all current data in the table and replaces it with the backup data. Use this when you want to completely restore to a previous state.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 rounded-md border p-4">
                  <RadioGroupItem value="merge" id="merge" data-testid="radio-mode-merge" />
                  <div className="flex-1">
                    <Label htmlFor="merge" className="font-semibold cursor-pointer">
                      Merge (Add Missing Rows)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adds rows from the backup that don't exist in the current table (based on ID). Use this when you want to recover deleted rows without affecting existing data.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-restore">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRestoreBackup}
                disabled={restoreBackupMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600"
                data-testid="button-confirm-restore"
              >
                {restoreBackupMutation.isPending ? "Restoring..." : "Restore Backup"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent data-testid="dialog-delete-backup">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Backup</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the backup "{deleteConfirm.backupName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteBackupMutation.mutate(deleteConfirm.backupId)}
                disabled={deleteBackupMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteBackupMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
