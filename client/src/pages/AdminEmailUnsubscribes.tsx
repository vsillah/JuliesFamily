import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { EmailUnsubscribe } from "@shared/schema";
import { insertEmailUnsubscribeSchema } from "@shared/schema";
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
  Phone,
  RotateCcw,
  BellOff,
  Filter
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Form schema - use insertEmailUnsubscribeSchema as-is (already has channel-aware validation)
type ManualUnsubscribeFormValues = z.infer<typeof insertEmailUnsubscribeSchema>;

export default function AdminEmailUnsubscribes() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'sms'>('all');
  const [showInactive, setShowInactive] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    unsubscribeId: string;
    identifier: string;
  } | null>(null);

  // Create form - use insertEmailUnsubscribeSchema directly
  const form = useForm<ManualUnsubscribeFormValues>({
    resolver: zodResolver(insertEmailUnsubscribeSchema),
    defaultValues: {
      email: undefined,
      phone: undefined,
      channel: "email",
      reason: undefined,
      source: "manual_admin",
    },
  });

  // Fetch all unsubscribes
  const { data: unsubscribes = [], isLoading } = useQuery<EmailUnsubscribe[]>({
    queryKey: ["/api/email-unsubscribes"],
  });

  // Create unsubscribe mutation
  const createUnsubscribeMutation = useMutation({
    mutationFn: async (data: ManualUnsubscribeFormValues) => {
      return await apiRequest("POST", "/api/email-unsubscribes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-unsubscribes"] });
      toast({
        title: "Unsubscribe Created",
        description: "The unsubscribe record has been created successfully.",
      });
      // Only close dialog and reset on success
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      // Show error but keep dialog open so user can fix input
      toast({
        title: "Error Creating Unsubscribe",
        description: error.message || "Failed to create unsubscribe record",
        variant: "destructive",
      });
      // Dialog stays open, form keeps user's data
    },
  });

  // Delete unsubscribe mutation
  const deleteUnsubscribeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/email-unsubscribes/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-unsubscribes"] });
      toast({
        title: "Unsubscribe Deleted",
        description: "The unsubscribe record has been removed.",
      });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete unsubscribe record",
        variant: "destructive",
      });
    },
  });

  // Filter unsubscribes based on channel and active status
  const filteredUnsubscribes = unsubscribes.filter((unsub) => {
    // Filter by channel
    if (channelFilter !== 'all' && unsub.channel !== channelFilter) {
      return false;
    }
    
    // Filter by active status
    if (!showInactive && !unsub.isActive) {
      return false;
    }
    
    return true;
  });

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onSubmit = (data: ManualUnsubscribeFormValues) => {
    // Transform empty strings to undefined for optional fields
    const payload = {
      ...data,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      reason: data.reason?.trim() || undefined,
      source: data.source?.trim() || undefined,
    };
    createUnsubscribeMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <Breadcrumbs 
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Communication Unsubscribes' }
          ]} 
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Communication Unsubscribes</h1>
            <p className="text-muted-foreground mt-1">
              Manage email and SMS opt-outs for CAN-SPAM and TCPA compliance
            </p>
          </div>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-create-unsubscribe"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Unsubscribe
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Unsubscribe Records</CardTitle>
                <CardDescription>
                  All communication opt-outs across email and SMS channels
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={showInactive ? "all" : "active"} onValueChange={(val) => setShowInactive(val === "all")}>
                  <SelectTrigger className="w-32" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={channelFilter} onValueChange={(val) => setChannelFilter(val as any)} className="w-full">
              <TabsList className="mb-4" data-testid="tabs-channel-filter">
                <TabsTrigger value="all" data-testid="tab-all-channels">All Channels ({unsubscribes.length})</TabsTrigger>
                <TabsTrigger value="email" data-testid="tab-email">
                  <Mail className="w-4 h-4 mr-2" />
                  Email ({unsubscribes.filter(u => u.channel === 'email').length})
                </TabsTrigger>
                <TabsTrigger value="sms" data-testid="tab-sms">
                  <Phone className="w-4 h-4 mr-2" />
                  SMS ({unsubscribes.filter(u => u.channel === 'sms').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={channelFilter} className="mt-0">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading unsubscribe records...
                  </div>
                ) : filteredUnsubscribes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No unsubscribe records found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Unsubscribed</TableHead>
                          <TableHead>Resubscribed</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUnsubscribes.map((unsub) => (
                          <TableRow key={unsub.id} data-testid={`row-unsubscribe-${unsub.id}`}>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-channel-${unsub.id}`}>
                                {unsub.channel === 'email' && <Mail className="w-3 h-3 mr-1" />}
                                {unsub.channel === 'sms' && <Phone className="w-3 h-3 mr-1" />}
                                {unsub.channel === 'all' && <BellOff className="w-3 h-3 mr-1" />}
                                {unsub.channel}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm" data-testid={`text-email-${unsub.id}`}>
                              {unsub.email || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-sm" data-testid={`text-phone-${unsub.id}`}>
                              {unsub.phone || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={unsub.isActive ? "destructive" : "secondary"}
                                data-testid={`badge-status-${unsub.id}`}
                              >
                                {unsub.isActive ? "Active" : "Resubscribed"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate" data-testid={`text-reason-${unsub.id}`}>
                              {unsub.reason || "-"}
                            </TableCell>
                            <TableCell data-testid={`text-source-${unsub.id}`}>
                              {unsub.source || "web"}
                            </TableCell>
                            <TableCell data-testid={`text-unsubscribed-at-${unsub.id}`}>
                              {formatDate(unsub.unsubscribedAt)}
                            </TableCell>
                            <TableCell data-testid={`text-resubscribed-at-${unsub.id}`}>
                              {formatDate(unsub.resubscribedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm({
                                  unsubscribeId: unsub.id,
                                  identifier: unsub.email || unsub.phone || unsub.id
                                })}
                                data-testid={`button-delete-${unsub.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent data-testid="dialog-create-unsubscribe">
            <DialogHeader>
              <DialogTitle>Add Manual Unsubscribe</DialogTitle>
              <DialogDescription>
                Create an unsubscribe record manually for email, SMS, or both channels
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-channel">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="all">All Channels</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the communication channel to unsubscribe from
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email {(form.watch('channel') === 'email' || form.watch('channel') === 'all') && '*'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          data-testid="input-email"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            field.onChange(value || undefined);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Required for email and all channels
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone {(form.watch('channel') === 'sms' || form.watch('channel') === 'all') && '*'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          data-testid="input-phone"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            field.onChange(value || undefined);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Required for SMS and all channels (E.164 format recommended)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional reason for unsubscribe..."
                          data-testid="input-reason"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="manual_admin"
                          data-testid="input-source"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Source of the unsubscribe request
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUnsubscribeMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createUnsubscribeMutation.isPending ? "Creating..." : "Create Unsubscribe"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent data-testid="dialog-delete-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Unsubscribe Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete the unsubscribe record for{" "}
                <span className="font-semibold">{deleteConfirm?.identifier}</span>?
                This will allow communications to resume for this contact.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm && deleteUnsubscribeMutation.mutate(deleteConfirm.unsubscribeId)}
                className="bg-destructive text-destructive-foreground"
                data-testid="button-confirm-delete"
              >
                {deleteUnsubscribeMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
