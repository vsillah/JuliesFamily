import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  User, Mail, Phone, Calendar, TrendingUp, MessageSquare,
  History, Send, MessageCircle, CalendarCheck, RefreshCcw,
  Edit2, Check, X, Download, FileText, CheckCircle2, Target, Users,
  ListTodo, Plus, Clock
} from "lucide-react";
import type { Lead, Interaction } from "@shared/schema";
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

  // Sync notes when lead data loads or changes
  useEffect(() => {
    if (lead?.notes) {
      setNotes(lead.notes);
    }
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
          <div className="space-y-6">
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

            {/* Communication Timeline - unified view of all interactions */}
            <CommunicationTimeline leadId={leadId} />
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Lead not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
