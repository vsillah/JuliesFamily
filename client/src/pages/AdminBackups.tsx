import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BackupSnapshot } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Download, 
  Trash2, 
  RotateCcw, 
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock
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
