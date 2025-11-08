import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Sparkles, Filter, User } from "lucide-react";
import type { EmailTemplate, Lead } from "@shared/schema";
import { PERSONA_LABELS, FUNNEL_STAGE_LABELS, type Persona, type FunnelStage } from "@shared/defaults/personas";
import { OUTREACH_TYPE_LABELS, TEMPLATE_CATEGORY_LABELS } from "@shared/hormoziEmailTemplates";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AdminHormoziEmails() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showPersonalizeDialog, setShowPersonalizeDialog] = useState(false);
  const [personalizedEmail, setPersonalizedEmail] = useState<any>(null);
  
  // Filters
  const [personaFilter, setPersonaFilter] = useState<string>("");
  const [funnelStageFilter, setFunnelStageFilter] = useState<string>("");
  const [outreachTypeFilter, setOutreachTypeFilter] = useState<string>("");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("");

  // Fetch Hormozi email templates with filters
  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/hormozi-templates', { 
      persona: personaFilter || undefined,
      funnelStage: funnelStageFilter || undefined,
      outreachType: outreachTypeFilter || undefined,
      templateCategory: templateCategoryFilter || undefined,
    }],
  });

  // Fetch all leads for selection
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  // Personalize email mutation
  const personalizeEmailMutation = useMutation({
    mutationFn: async ({ templateId, leadId }: { templateId: string; leadId: string }) => {
      const res = await apiRequest('POST', '/api/hormozi-templates/personalize', { templateId, leadId });
      return res.json();
    },
    onSuccess: (data) => {
      setPersonalizedEmail(data);
      toast({
        title: "Email Personalized",
        description: "AI has customized the email based on CRM data",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to personalize email",
      });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/hormozi-templates/send', data);
      return res.json();
    },
    onSuccess: () => {
      setShowPersonalizeDialog(false);
      setSelectedTemplate(null);
      setSelectedLead(null);
      setPersonalizedEmail(null);
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send email",
      });
    },
  });

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPersonalizeDialog(true);
    setPersonalizedEmail(null);
  };

  const handlePersonalize = () => {
    if (!selectedTemplate || !selectedLead) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select both a template and a lead",
      });
      return;
    }

    personalizeEmailMutation.mutate({
      templateId: selectedTemplate.id,
      leadId: selectedLead.id,
    });
  };

  const handleSend = () => {
    if (!personalizedEmail || !selectedLead) return;

    sendEmailMutation.mutate({
      leadId: selectedLead.id,
      subject: personalizedEmail.subject,
      htmlBody: personalizedEmail.htmlBody,
      textBody: personalizedEmail.textBody,
    });
  };

  const clearFilters = () => {
    setPersonaFilter("");
    setFunnelStageFilter("");
    setOutreachTypeFilter("");
    setTemplateCategoryFilter("");
  };

  const activeFiltersCount = [personaFilter, funnelStageFilter, outreachTypeFilter, templateCategoryFilter].filter(Boolean).length;

  return (
    <div className="min-h-screen p-6 bg-background">
      <Breadcrumbs 
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Hormozi Email Templates", href: "/admin/hormozi-emails" }
        ]} 
      />

      <div className="max-w-7xl mx-auto space-y-6 mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" data-testid="icon-hormozi-emails" />
                  Hormozi Email Templates
                </CardTitle>
                <CardDescription>
                  AI-powered email templates based on Alex Hormozi's $100M Leads framework
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" data-testid="icon-filter" />
                    <CardTitle className="text-base">Filters</CardTitle>
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" data-testid="badge-active-filters">
                        {activeFiltersCount} active
                      </Badge>
                    )}
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      data-testid="button-clear-filters"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Persona</Label>
                    <Select value={personaFilter} onValueChange={setPersonaFilter}>
                      <SelectTrigger data-testid="select-persona-filter">
                        <SelectValue placeholder="All Personas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Personas</SelectItem>
                        <SelectItem value="student">Adult Student</SelectItem>
                        <SelectItem value="provider">Service Provider</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="donor">Donor</SelectItem>
                        <SelectItem value="volunteer">Volunteer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Journey Stage</Label>
                    <Select value={funnelStageFilter} onValueChange={setFunnelStageFilter}>
                      <SelectTrigger data-testid="select-funnel-stage-filter">
                        <SelectValue placeholder="All Stages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Stages</SelectItem>
                        <SelectItem value="awareness">Awareness</SelectItem>
                        <SelectItem value="consideration">Consideration</SelectItem>
                        <SelectItem value="decision">Decision</SelectItem>
                        <SelectItem value="retention">Retention</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Outreach Type</Label>
                    <Select value={outreachTypeFilter} onValueChange={setOutreachTypeFilter}>
                      <SelectTrigger data-testid="select-outreach-type-filter">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="warm_outreach">Warm Outreach</SelectItem>
                        <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                        <SelectItem value="warm_broadcast">Warm Broadcast</SelectItem>
                        <SelectItem value="cold_broadcast">Cold Broadcast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Framework</Label>
                    <Select value={templateCategoryFilter} onValueChange={setTemplateCategoryFilter}>
                      <SelectTrigger data-testid="select-template-category-filter">
                        <SelectValue placeholder="All Frameworks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Frameworks</SelectItem>
                        <SelectItem value="a_c_a">A-C-A Framework</SelectItem>
                        <SelectItem value="value_first">Value First</SelectItem>
                        <SelectItem value="social_proof">Social Proof</SelectItem>
                        <SelectItem value="problem_solution">Problem-Solution</SelectItem>
                        <SelectItem value="lead_magnet_offer">Lead Magnet Offer</SelectItem>
                        <SelectItem value="reengagement">Re-engagement</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="referral_request">Referral Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Templates Grid */}
            {templatesLoading ? (
              <div className="text-center py-12" data-testid="loading-templates">
                <p className="text-muted-foreground">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12" data-testid="no-templates">
                <p className="text-muted-foreground">No templates found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="hover-elevate cursor-pointer" onClick={() => handleSelectTemplate(template)} data-testid={`card-template-${template.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.subject}</CardTitle>
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {template.persona && (
                          <Badge variant="outline" data-testid={`badge-persona-${template.persona}`}>
                            <User className="w-3 h-3 mr-1" />
                            {PERSONA_LABELS[template.persona as Persona]}
                          </Badge>
                        )}
                        {template.funnelStage && (
                          <Badge variant="outline" data-testid={`badge-funnel-stage-${template.funnelStage}`}>
                            {FUNNEL_STAGE_LABELS[template.funnelStage as FunnelStage]}
                          </Badge>
                        )}
                        {template.outreachType && (
                          <Badge variant="secondary" data-testid={`badge-outreach-type-${template.outreachType}`}>
                            {OUTREACH_TYPE_LABELS[template.outreachType as keyof typeof OUTREACH_TYPE_LABELS]}
                          </Badge>
                        )}
                        {template.templateCategory && (
                          <Badge data-testid={`badge-template-category-${template.templateCategory}`}>
                            {TEMPLATE_CATEGORY_LABELS[template.templateCategory as keyof typeof TEMPLATE_CATEGORY_LABELS]}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Example: {template.exampleContext}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personalize & Send Dialog */}
      <Dialog open={showPersonalizeDialog} onOpenChange={setShowPersonalizeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personalize & Send Email</DialogTitle>
            <DialogDescription>
              Select a lead and use AI to customize this email based on their CRM data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Info */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template: {selectedTemplate.subject}</CardTitle>
                  <CardDescription>{selectedTemplate.description}</CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Lead Selection */}
            <div>
              <Label>Select Lead</Label>
              <Select 
                value={selectedLead?.id || ""} 
                onValueChange={(value) => {
                  const lead = leads.find(l => l.id === value);
                  setSelectedLead(lead || null);
                  setPersonalizedEmail(null); // Reset personalization when lead changes
                }}
              >
                <SelectTrigger className="mt-2" data-testid="select-lead">
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.firstName} {lead.lastName} ({lead.email}) - {PERSONA_LABELS[lead.persona as Persona]} - {FUNNEL_STAGE_LABELS[lead.funnelStage as FunnelStage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Personalize Button */}
            {selectedLead && !personalizedEmail && (
              <Button 
                onClick={handlePersonalize} 
                disabled={personalizeEmailMutation.isPending}
                className="w-full"
                data-testid="button-personalize"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {personalizeEmailMutation.isPending ? "Personalizing..." : "Personalize with AI"}
              </Button>
            )}

            {/* Personalized Email Preview */}
            {personalizedEmail && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">AI-Personalized Email</CardTitle>
                    <Badge variant="secondary" data-testid="badge-ai-personalized">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Customized
                    </Badge>
                  </div>
                  <CardDescription>{personalizedEmail.personalizationNotes}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Subject</Label>
                    <Input 
                      value={personalizedEmail.subject} 
                      readOnly 
                      className="mt-2"
                      data-testid="input-personalized-subject"
                    />
                  </div>
                  <Separator />
                  <div>
                    <Label>Email Body (HTML)</Label>
                    <div 
                      className="mt-2 p-4 border rounded-md bg-muted/50 max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: personalizedEmail.htmlBody }}
                      data-testid="preview-personalized-html"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPersonalizeDialog(false);
                setPersonalizedEmail(null);
                setSelectedLead(null);
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            {personalizedEmail && (
              <Button 
                onClick={handleSend} 
                disabled={sendEmailMutation.isPending}
                data-testid="button-send-email"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
