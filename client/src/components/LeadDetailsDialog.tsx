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
  Edit2, Check, X, Download, FileText, CheckCircle2, Target
} from "lucide-react";
import type { Lead, Interaction } from "@shared/schema";

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

            {/* Interaction History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Interaction History
                </CardTitle>
                <CardDescription>
                  {interactions.length} interaction{interactions.length !== 1 ? "s" : ""} recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {interactionsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading interactions...</div>
                ) : interactionsError ? (
                  <div className="text-center py-4">
                    <div className="text-destructive text-sm">Error loading interactions</div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId, "interactions"] })}
                    >
                      Retry
                    </Button>
                  </div>
                ) : interactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No interactions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interactions.map((interaction, index) => {
                      const Icon = getInteractionIcon(interaction.interactionType);
                      const data = interaction.data as Record<string, any> | null;
                      
                      return (
                        <div
                          key={interaction.id}
                          className="p-4 border rounded-lg hover-elevate"
                          data-testid={`interaction-${index}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-primary/10 text-primary">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {formatInteractionType(interaction.interactionType)}
                                  </div>
                                  {interaction.contentEngaged && (
                                    <div className="text-sm text-muted-foreground mt-0.5">
                                      {interaction.contentEngaged}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                  {interaction.createdAt ? format(new Date(interaction.createdAt), "MMM d, yyyy h:mm a") : "Unknown"}
                                </div>
                              </div>
                              
                              {/* Format interaction-specific data */}
                              {data && (
                                <div className="mt-3 space-y-2">
                                  {interaction.interactionType === 'quiz_completion' && data.recommendation && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        Recommended: {data.programTitle || data.recommendation}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {data.quizType && (
                                    <div className="text-xs text-muted-foreground">
                                      Quiz Type: <span className="font-medium">{data.quizType.replace(/_/g, ' ')}</span>
                                    </div>
                                  )}
                                  
                                  {data.scores && typeof data.scores === 'object' && (
                                    <div className="text-xs">
                                      <div className="text-muted-foreground mb-1">Scores:</div>
                                      <div className="flex flex-wrap gap-2">
                                        {Object.entries(data.scores).map(([key, value]) => (
                                          <Badge key={key} variant="outline" className="text-xs">
                                            {key.replace(/_/g, ' ')}: {String(value)}/5
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {data.downloadUrl && (
                                    <div className="text-xs text-muted-foreground">
                                      File: <span className="font-medium">{data.fileName || 'Resource'}</span>
                                    </div>
                                  )}
                                  
                                  {data.scheduledDate && (
                                    <div className="text-xs">
                                      <Badge variant="outline" className="text-xs">
                                        {format(new Date(data.scheduledDate), "EEEE, MMMM d 'at' h:mm a")}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {data.formType && (
                                    <div className="text-xs text-muted-foreground">
                                      Form: <span className="font-medium">{data.formType}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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
