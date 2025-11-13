import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  User, Mail, Phone, Calendar, TrendingUp, MessageSquare,
  History, Send, MessageCircle, CalendarCheck, RefreshCcw,
  Edit2, Check, X, Download, FileText, CheckCircle2, Target, Users,
  ListTodo, Plus, Clock, BarChart3, Activity, ExternalLink
} from "lucide-react";
import type { Lead, Interaction, LeadEmailOpen, LeadEmailClick } from "@shared/schema";
import CommunicationTimeline from "@/components/CommunicationTimeline";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Helper to format interaction type labels
const formatInteractionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    quiz_completion: "Quiz Completed",
    download: "Downloaded Resource",
    form_submit: "Form Submitted",
    call_scheduled: "Call Scheduled",
    email_opened: "Email Opened",
    link_clicked: "Link Clicked",
    page_view: "Page Viewed",
  };
  return typeMap[type] || type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

// Helper to get icon for interaction type
const getInteractionIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    quiz_completion: CheckCircle2,
    download: Download,
    form_submit: FileText,
    call_scheduled: CalendarCheck,
    email_opened: Mail,
    link_clicked: Target,
    page_view: History,
  };
  return iconMap[type] || MessageSquare;
};

interface LeadDetailsDialogProps {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadDetailsDialog({ leadId, open, onOpenChange }: LeadDetailsDialogProps) {
  const { toast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDescription, setTaskDescription] = useState("");
  const [showManualProgression, setShowManualProgression] = useState(false);
  const [manualProgressionStage, setManualProgressionStage] = useState("");
  const [manualProgressionReason, setManualProgressionReason] = useState("");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editedLeadStatus, setEditedLeadStatus] = useState<'active' | 'nurture' | 'disqualified' | 'unresponsive'>('active');

  // Fetch lead details
  const { data: lead, isLoading: leadLoading, error: leadError } = useQuery<Lead>({
    queryKey: ["/api/admin/leads", leadId],
    enabled: !!leadId && open,
    retry: false,
  });

  // Fetch interactions
  const { data: interactions = [], isLoading: interactionsLoading, error: interactionsError } = useQuery<Interaction[]>({
    queryKey: ["/api/admin/leads", leadId, "interactions"],
    enabled: !!leadId && open,
    retry: false,
  });

  // Fetch all users (team members) for assignment dropdown
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: open,
  });

  // Fetch current assignment
  const { data: currentAssignment } = useQuery<any>({
    queryKey: ["/api/leads", leadId, "assignment"],
    enabled: !!leadId && open,
    retry: false,
  });

  // Fetch assignment history
  const { data: assignmentHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/leads", leadId, "assignments"],
    enabled: !!leadId && open,
    retry: false,
  });

  // Fetch tasks for this lead (only when dialog is open and leadId is valid)
  const taskQueryUrl = leadId ? `/api/tasks?leadId=${leadId}` : "/api/tasks";
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: [taskQueryUrl],
    enabled: !!leadId && open,
    retry: false,
  });

  // Fetch funnel progression history
  const { data: progressionHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/funnel/progression-history", leadId],
    enabled: !!leadId && open,
    retry: false,
  });

  // Fetch email engagement
  const { data: emailEngagement, isLoading: engagementLoading } = useQuery<{
    summary: {
      totalOpens: number;
      totalClicks: number;
      engagedCampaigns: number;
      lastActivity: string | null;
    };
    opens: LeadEmailOpen[];
    clicks: LeadEmailClick[];
  }>({
    queryKey: ["/api/leads", leadId, "email-engagement"],
    enabled: !!leadId && open,
    retry: false,
  });

  // Assignment mutation
  const assignLeadMutation = useMutation({
    mutationFn: async (data: { assignedTo: string; notes: string }) => {
      return await apiRequest("POST", `/api/leads/${leadId}/assignment`, {
        assignedTo: data.assignedTo,
        assignmentType: "manual",
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "assignment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assignments"] });
      toast({
        title: "Lead Assigned",
        description: "The lead has been successfully assigned.",
      });
      setAssignmentNotes("");
      setSelectedAssignee("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Task creation mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return await apiRequest("POST", "/api/tasks", taskData);
    },
    onSuccess: () => {
      // Invalidate all task queries (predicate matches any query key starting with /api/tasks)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/tasks');
        }
      });
      toast({
        title: "Task Created",
        description: "The task has been created successfully.",
      });
      setShowAddTask(false);
      setTaskTitle("");
      setTaskType("");
      setTaskAssignee("");
      setTaskDueDate("");
      setTaskPriority("medium");
      setTaskDescription("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Manual funnel progression mutation
  const manualProgressionMutation = useMutation({
    mutationFn: async (data: { toStage: string; reason: string }) => {
      return await apiRequest("POST", `/api/funnel/manual-progress/${leadId}`, {
        toStage: data.toStage,
        reason: data.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/funnel/progression-history", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/funnel/stats"] });
      toast({
        title: "Stage Updated",
        description: "Lead funnel stage has been manually updated.",
      });
      setShowManualProgression(false);
      setManualProgressionStage("");
      setManualProgressionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update funnel stage. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Task update mutation (for marking complete)
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      // Invalidate all task queries (predicate matches any query key starting with /api/tasks)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/tasks');
        }
      });
      toast({
        title: "Task Updated",
        description: "The task has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      return await apiRequest("PATCH", `/api/admin/leads/${leadId}`, { notes: newNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      setIsEditingNotes(false);
      toast({
        title: "Notes Updated",
        description: "Lead notes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update lead status mutation
  const updateLeadStatusMutation = useMutation({
    mutationFn: async (newStatus: 'active' | 'nurture' | 'disqualified' | 'unresponsive') => {
      if (!lead || !newStatus || newStatus === (lead.leadStatus || 'active')) {
        throw new Error("No changes to save");
      }
      return await apiRequest("PATCH", `/api/admin/leads/${leadId}`, { leadStatus: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      setIsEditingStatus(false);
      toast({
        title: "Status Updated",
        description: "Lead status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      // Only show error toast if it's not the "no changes" error
      if (error.message !== "No changes to save") {
        toast({
          title: "Error",
          description: "Failed to update lead status. Please try again.",
          variant: "destructive",
        });
      }
      setIsEditingStatus(false);
    },
  });

  // Sync notes and lead status when lead data loads or changes
  useEffect(() => {
    if (lead?.notes) {
      setNotes(lead.notes);
    }
    // Always set lead status - default to 'active' if not set
    setEditedLeadStatus(lead?.leadStatus || 'active');
  }, [lead]);

  const personaLabels: Record<string, string> = {
    student: "Adult Education Student",
    provider: "Service Provider",
    parent: "Parent",
    donor: "Donor",
    volunteer: "Volunteer",
  };

  const funnelStageLabels: Record<string, { label: string; color: string }> = {
    awareness: { label: "Awareness (TOFU)", color: "bg-blue-500" },
    consideration: { label: "Consideration (MOFU)", color: "bg-yellow-500" },
    decision: { label: "Decision (BOFU)", color: "bg-orange-500" },
    retention: { label: "Retention", color: "bg-green-500" },
  };

  const leadStatusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "Active", color: "bg-green-600" },
    nurture: { label: "Nurture", color: "bg-blue-600" },
    disqualified: { label: "Disqualified", color: "bg-gray-500" },
    unresponsive: { label: "Unresponsive", color: "bg-orange-600" },
  };

  // Outreach suggestions based on funnel stage
  const outreachSuggestions: Record<string, { icon: any; label: string; description: string }[]> = {
    awareness: [
      { icon: Mail, label: "Send Welcome Email", description: "Introduce your organization and share relevant resources" },
      { icon: MessageCircle, label: "Send Educational Content", description: "Share blog posts, guides, or videos" },
      { icon: CalendarCheck, label: "Invite to Event", description: "Invite to upcoming webinar or community event" },
    ],
    consideration: [
      { icon: Mail, label: "Send Case Studies", description: "Share success stories and testimonials" },
      { icon: Phone, label: "Schedule Call", description: "Book a consultation or information session" },
      { icon: MessageCircle, label: "Send SMS Follow-up", description: "Quick check-in via text message" },
    ],
    decision: [
      { icon: CalendarCheck, label: "Schedule Meeting", description: "Book an in-person or virtual meeting" },
      { icon: Mail, label: "Send Program Details", description: "Share enrollment information and next steps" },
      { icon: Phone, label: "Make Phone Call", description: "Personal outreach to answer questions" },
    ],
    retention: [
      { icon: Mail, label: "Send Check-in Email", description: "See how they're doing and offer support" },
      { icon: RefreshCcw, label: "Re-engagement Campaign", description: "Remind them of available resources" },
      { icon: MessageCircle, label: "Request Feedback", description: "Ask for testimonial or program feedback" },
    ],
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate(notes);
  };

  const handleCancelNotes = () => {
    setNotes(lead?.notes || "");
    setIsEditingNotes(false);
  };

  const handleAssignLead = () => {
    if (!selectedAssignee) {
      toast({
        title: "Error",
        description: "Please select a team member to assign.",
        variant: "destructive",
      });
      return;
    }
    assignLeadMutation.mutate({
      assignedTo: selectedAssignee,
      notes: assignmentNotes,
    });
  };

  const handleCreateTask = () => {
    if (!taskTitle || !taskType || !taskAssignee) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Title, Type, Assignee).",
        variant: "destructive",
      });
      return;
    }
    
    createTaskMutation.mutate({
      leadId,
      title: taskTitle,
      taskType,
      assignedTo: taskAssignee,
      dueDate: taskDueDate || null,
      priority: taskPriority,
      description: taskDescription || null,
      status: "pending",
    });
  };

  const handleToggleTaskComplete = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus },
    });
  };

  const handleOutreachAction = (action: string) => {
    toast({
      title: "Outreach Action",
      description: `${action} - This feature will be connected to email/SMS services.`,
    });
  };

  const handleManualProgression = () => {
    if (!manualProgressionStage || !manualProgressionReason) {
      toast({
        title: "Error",
        description: "Please select a stage and provide a reason.",
        variant: "destructive",
      });
      return;
    }
    manualProgressionMutation.mutate({
      toStage: manualProgressionStage,
      reason: manualProgressionReason,
    });
  };

  if (!leadId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-lead-details">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif flex items-center gap-2">
            <User className="w-6 h-6" />
            Lead Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive information and outreach options
          </DialogDescription>
        </DialogHeader>

        {leadLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-lg text-muted-foreground">Loading lead details...</div>
          </div>
        ) : leadError ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="text-lg text-destructive">Error loading lead details</div>
            <div className="text-sm text-muted-foreground">
              {leadError instanceof Error ? leadError.message : "Failed to fetch lead information. Please try again."}
            </div>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId] })}>
              Retry
            </Button>
          </div>
        ) : lead ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <User className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="engagement" data-testid="tab-engagement">
                <BarChart3 className="w-4 h-4 mr-2" />
                Engagement
              </TabsTrigger>
              <TabsTrigger value="timeline" data-testid="tab-timeline">
                <History className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ScrollArea className="h-[calc(90vh-240px)]" type="auto">
                <div className="space-y-6 pr-4">
                  {/* Contact Information */}
                  <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Name
                    </div>
                    <div className="font-medium" data-testid="text-lead-name">
                      {lead.firstName} {lead.lastName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                    <div className="font-medium" data-testid="text-lead-email">
                      {lead.email}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </div>
                    <div className="font-medium" data-testid="text-lead-phone">
                      {lead.phone || "Not provided"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Lead Since
                    </div>
                    <div className="font-medium">
                      {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : "Unknown"}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Persona</div>
                    <Badge variant="outline" data-testid="badge-lead-persona">
                      {personaLabels[lead.persona] || lead.persona}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Funnel Stage</div>
                    <Badge className={funnelStageLabels[lead.funnelStage]?.color} data-testid="badge-lead-funnel">
                      {funnelStageLabels[lead.funnelStage]?.label || lead.funnelStage}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Lead Status
                    </div>
                    {isEditingStatus ? (
                      <div className="flex gap-2">
                        <Select value={editedLeadStatus} onValueChange={setEditedLeadStatus}>
                          <SelectTrigger data-testid="select-lead-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="nurture">Nurture</SelectItem>
                            <SelectItem value="disqualified">Disqualified</SelectItem>
                            <SelectItem value="unresponsive">Unresponsive</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="icon" 
                          onClick={() => updateLeadStatusMutation.mutate(editedLeadStatus)} 
                          disabled={updateLeadStatusMutation.isPending || editedLeadStatus === (lead.leadStatus || 'active')}
                          data-testid="button-save-status"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => {
                            setEditedLeadStatus(lead.leadStatus || 'active');
                            setIsEditingStatus(false);
                          }} 
                          disabled={updateLeadStatusMutation.isPending}
                          data-testid="button-cancel-status"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={leadStatusLabels[lead.leadStatus || 'active']?.color} data-testid="badge-lead-status">
                          {leadStatusLabels[lead.leadStatus || 'active']?.label || lead.leadStatus}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!lead) return;
                            setIsEditingStatus(true);
                          }}
                          data-testid="button-edit-status"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Engagement Score
                    </div>
                    <div className="font-medium text-lg" data-testid="text-engagement-score">
                      {lead.engagementScore}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Lead Source</div>
                    <div className="font-medium">{lead.leadSource || "Unknown"}</div>
                  </div>
                </div>

                {lead.lastInteractionDate && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Last Interaction</div>
                      <div className="font-medium">
                        {lead.lastInteractionDate ? format(new Date(lead.lastInteractionDate), "MMM d, yyyy 'at' h:mm a") : "Never"}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Funnel Progression */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Funnel Progression
                  </CardTitle>
                  <CardDescription>
                    Track and manage progression through sales funnel stages
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualProgression(!showManualProgression)}
                  data-testid="button-manual-progression"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Manual Override
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Manual Progression Form */}
                {showManualProgression && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium">Manually Update Funnel Stage</h4>
                    <div className="space-y-2">
                      <Label htmlFor="manual-stage">New Stage</Label>
                      <Select value={manualProgressionStage} onValueChange={setManualProgressionStage}>
                        <SelectTrigger id="manual-stage" data-testid="select-manual-stage">
                          <SelectValue placeholder="Select stage..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="awareness" data-testid="option-stage-awareness">Awareness</SelectItem>
                          <SelectItem value="consideration" data-testid="option-stage-consideration">Consideration</SelectItem>
                          <SelectItem value="decision" data-testid="option-stage-decision">Decision</SelectItem>
                          <SelectItem value="retention" data-testid="option-stage-retention">Retention</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-reason">Reason for Manual Update</Label>
                      <Textarea
                        id="manual-reason"
                        value={manualProgressionReason}
                        onChange={(e) => setManualProgressionReason(e.target.value)}
                        placeholder="e.g., Direct conversation indicated higher intent..."
                        className="min-h-20"
                        data-testid="textarea-manual-reason"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleManualProgression}
                        disabled={manualProgressionMutation.isPending || !manualProgressionStage || !manualProgressionReason}
                        size="sm"
                        data-testid="button-submit-manual-progression"
                      >
                        {manualProgressionMutation.isPending ? "Updating..." : "Update Stage"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowManualProgression(false);
                          setManualProgressionStage("");
                          setManualProgressionReason("");
                        }}
                        size="sm"
                        data-testid="button-cancel-manual-progression"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Progression History */}
                <div className="space-y-2">
                  <h4 className="font-medium">Progression History</h4>
                  {progressionHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-6">
                      No progression history yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {progressionHistory.slice(0, 5).map((progression: any) => (
                        <div
                          key={progression.id}
                          className="p-3 border rounded-lg"
                          data-testid={`progression-history-${progression.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {progression.fromStage ? (
                                <>
                                  <Badge variant="outline">
                                    {funnelStageLabels[progression.fromStage]?.label || progression.fromStage}
                                  </Badge>
                                  <span className="text-muted-foreground">→</span>
                                  <Badge className={funnelStageLabels[progression.toStage]?.color}>
                                    {funnelStageLabels[progression.toStage]?.label || progression.toStage}
                                  </Badge>
                                </>
                              ) : (
                                <Badge className={funnelStageLabels[progression.toStage]?.color}>
                                  {funnelStageLabels[progression.toStage]?.label || progression.toStage} (Initial)
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(progression.createdAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {progression.reason}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Score: {progression.engagementScore}
                          </div>
                        </div>
                      ))}
                      {progressionHistory.length > 5 && (
                        <div className="text-center text-sm text-muted-foreground">
                          +{progressionHistory.length - 5} more progression{progressionHistory.length - 5 !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lead Assignment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lead Assignment
                </CardTitle>
                <CardDescription>
                  {currentAssignment 
                    ? "Reassign this lead to a different team member" 
                    : "Assign this lead to a team member"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentAssignment && (
                  <div className="p-4 bg-muted/50 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Currently Assigned To:</span>
                      <Badge variant="secondary" data-testid="badge-current-assignee">
                        {users.find((u: any) => u.id === currentAssignment.assignedTo)?.firstName || "Unknown"} {users.find((u: any) => u.id === currentAssignment.assignedTo)?.lastName || ""}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Assigned {currentAssignment.createdAt ? format(new Date(currentAssignment.createdAt), "MMM d, yyyy 'at' h:mm a") : "recently"}
                    </div>
                    {currentAssignment.notes && (
                      <div className="text-sm">
                        <span className="font-medium">Notes:</span> {currentAssignment.notes}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignee-select">Assign To</Label>
                    <Select
                      value={selectedAssignee}
                      onValueChange={setSelectedAssignee}
                    >
                      <SelectTrigger id="assignee-select" data-testid="select-assignee">
                        <SelectValue placeholder="Select team member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="assignment-notes">Assignment Notes (Optional)</Label>
                    <Textarea
                      id="assignment-notes"
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Add notes about this assignment..."
                      className="min-h-24"
                      data-testid="textarea-assignment-notes"
                    />
                  </div>
                  
                  <Button
                    onClick={handleAssignLead}
                    disabled={!selectedAssignee || assignLeadMutation.isPending}
                    className="w-full"
                    data-testid="button-assign-lead"
                  >
                    {assignLeadMutation.isPending ? "Assigning..." : currentAssignment ? "Reassign Lead" : "Assign Lead"}
                  </Button>
                </div>

                {/* Assignment History */}
                {assignmentHistory.length > 1 && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Assignment History</h4>
                      <div className="space-y-2">
                        {assignmentHistory.slice(1).map((assignment: any) => (
                          <div key={assignment.id} className="p-3 bg-muted/30 rounded-md text-sm space-y-1" data-testid={`assignment-history-${assignment.id}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {users.find((u: any) => u.id === assignment.assignedTo)?.firstName || "Unknown"} {users.find((u: any) => u.id === assignment.assignedTo)?.lastName || ""}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {assignment.createdAt ? format(new Date(assignment.createdAt), "MMM d, yyyy") : "N/A"}
                              </span>
                            </div>
                            {assignment.notes && (
                              <div className="text-muted-foreground text-xs">
                                {assignment.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Management Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListTodo className="w-5 h-5" />
                    Tasks
                  </CardTitle>
                  <CardDescription>Manage follow-up tasks for this lead</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTask(!showAddTask)}
                  data-testid="button-toggle-add-task"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Task Form */}
                {showAddTask && (
                  <div className="p-4 bg-muted/50 rounded-md space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-title">Task Title *</Label>
                        <Input
                          id="task-title"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          placeholder="e.g., Follow up call"
                          data-testid="input-task-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-type">Task Type *</Label>
                        <Select
                          value={taskType}
                          onValueChange={setTaskType}
                        >
                          <SelectTrigger id="task-type" data-testid="select-task-type">
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="follow_up">Follow Up</SelectItem>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-assignee">Assign To *</Label>
                        <Select
                          value={taskAssignee}
                          onValueChange={setTaskAssignee}
                        >
                          <SelectTrigger id="task-assignee" data-testid="select-task-assignee">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-due-date">Due Date</Label>
                        <Input
                          id="task-due-date"
                          type="date"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                          data-testid="input-task-due-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-priority">Priority</Label>
                        <Select
                          value={taskPriority}
                          onValueChange={setTaskPriority}
                        >
                          <SelectTrigger id="task-priority" data-testid="select-task-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="task-description">Description (Optional)</Label>
                      <Textarea
                        id="task-description"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Add task details..."
                        className="min-h-20"
                        data-testid="textarea-task-description"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateTask}
                        disabled={createTaskMutation.isPending}
                        size="sm"
                        data-testid="button-create-task"
                      >
                        {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddTask(false)}
                        size="sm"
                        data-testid="button-cancel-task"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Task List */}
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No tasks yet. Create one to get started.
                    </div>
                  ) : (
                    tasks.map((task: any) => {
                      const taskUser = users.find((u: any) => u.id === task.assignedTo);
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
                      
                      return (
                        <div
                          key={task.id}
                          className={`p-4 border rounded-md space-y-2 ${task.status === "completed" ? "bg-muted/30 opacity-75" : ""}`}
                          data-testid={`task-${task.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 mt-0.5"
                                onClick={() => handleToggleTaskComplete(task.id, task.status)}
                                data-testid={`button-toggle-task-${task.id}`}
                              >
                                {task.status === "completed" ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <div className="h-5 w-5 border-2 rounded-full" />
                                )}
                              </Button>
                              <div className="flex-1 space-y-1">
                                <div className={`font-medium ${task.status === "completed" ? "line-through" : ""}`}>
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-sm text-muted-foreground">{task.description}</div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {taskUser ? `${taskUser.firstName} ${taskUser.lastName}` : "Unassigned"}
                                  </span>
                                  {task.dueDate && (
                                    <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                                      <Clock className="w-3 h-3" />
                                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                task.priority === "high" ? "destructive" :
                                task.priority === "medium" ? "default" :
                                "secondary"
                              } className="text-xs">
                                {task.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {task.taskType.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Notes
                </CardTitle>
                {!isEditingNotes && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNotes(lead.notes || "");
                      setIsEditingNotes(true);
                    }}
                    data-testid="button-edit-notes"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this lead..."
                      className="min-h-32"
                      data-testid="textarea-notes"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveNotes}
                        disabled={updateNotesMutation.isPending}
                        size="sm"
                        data-testid="button-save-notes"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelNotes}
                        size="sm"
                        data-testid="button-cancel-notes"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap" data-testid="text-notes-content">
                    {lead.notes || <span className="text-muted-foreground">No notes added yet.</span>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outreach Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Suggested Outreach Actions
                </CardTitle>
                <CardDescription>
                  Based on funnel stage: {funnelStageLabels[lead.funnelStage]?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {outreachSuggestions[lead.funnelStage]?.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{action.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {action.description}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOutreachAction(action.label)}
                          data-testid={`button-outreach-${index}`}
                        >
                          Execute
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                  <strong>Note:</strong> Outreach actions can be connected to SendGrid, Resend, or Twilio
                  for automated email and SMS delivery. Contact your administrator to set up integrations.
                </div>
              </CardContent>
            </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="mt-6">
              <ScrollArea className="h-[calc(90vh-240px)]" type="auto">
                <div className="space-y-6 pr-4">
                  {engagementLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Loading engagement data...
                    </div>
                  ) : emailEngagement ? (
                    <>
                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Total Opens</p>
                                <p className="text-2xl font-bold" data-testid="metric-total-opens">{emailEngagement.summary.totalOpens}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Total Clicks</p>
                                <p className="text-2xl font-bold" data-testid="metric-total-clicks">{emailEngagement.summary.totalClicks}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Campaigns</p>
                                <p className="text-2xl font-bold" data-testid="metric-engaged-campaigns">{emailEngagement.summary.engagedCampaigns}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Last Active</p>
                                <p className="text-sm font-medium" data-testid="metric-last-activity">
                                  {emailEngagement.summary.lastActivity 
                                    ? format(new Date(emailEngagement.summary.lastActivity), "MMM d, yyyy")
                                    : "Never"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Campaign Activity */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Campaign Activity</CardTitle>
                          <CardDescription>Email engagement by campaign</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {emailEngagement.opens.length === 0 && emailEngagement.clicks.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No email activity yet</p>
                              <p className="text-sm mt-2">Opens and clicks will appear here when the lead engages with campaigns.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Email Opens */}
                              {emailEngagement.opens.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email Opens ({emailEngagement.opens.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {emailEngagement.opens.slice(0, 10).map((open, idx) => (
                                      <div key={open.id || idx} className="flex items-center justify-between p-3 border rounded-md text-sm" data-testid={`open-${idx}`}>
                                        <div className="flex-1">
                                          <div className="font-medium">{open.campaignName || "Untitled Campaign"}</div>
                                          <div className="text-muted-foreground text-xs">
                                            {open.openedAt ? format(new Date(open.openedAt), "MMM d, yyyy 'at' h:mm a") : "Unknown"}
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">Opened</Badge>
                                      </div>
                                    ))}
                                    {emailEngagement.opens.length > 10 && (
                                      <p className="text-sm text-muted-foreground text-center pt-2">
                                        ...and {emailEngagement.opens.length - 10} more
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Email Clicks */}
                              {emailEngagement.clicks.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Link Clicks ({emailEngagement.clicks.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {emailEngagement.clicks.slice(0, 10).map((click, idx) => (
                                      <div key={click.id || idx} className="flex items-center justify-between p-3 border rounded-md text-sm" data-testid={`click-${idx}`}>
                                        <div className="flex-1">
                                          <div className="font-medium">{click.campaignName || "Untitled Campaign"}</div>
                                          {click.linkUrl && (
                                            <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                                              <ExternalLink className="w-3 h-3" />
                                              <span className="truncate max-w-xs">{click.linkUrl}</span>
                                            </div>
                                          )}
                                          <div className="text-muted-foreground text-xs">
                                            {click.clickedAt ? format(new Date(click.clickedAt), "MMM d, yyyy 'at' h:mm a") : "Unknown"}
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">Clicked</Badge>
                                      </div>
                                    ))}
                                    {emailEngagement.clicks.length > 10 && (
                                      <p className="text-sm text-muted-foreground text-center pt-2">
                                        ...and {emailEngagement.clicks.length - 10} more
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No engagement data available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-6">
              <ScrollArea className="h-[calc(90vh-240px)]" type="auto">
                <div className="pr-4">
                  {/* Communication Timeline - unified view of all interactions */}
                  <CommunicationTimeline leadId={leadId} />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Lead not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
