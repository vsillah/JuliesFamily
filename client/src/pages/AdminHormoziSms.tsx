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
import { MessageSquare, Send, Sparkles, Filter, User } from "lucide-react";
import type { SmsTemplate, Lead } from "@shared/schema";
import { PERSONA_LABELS, FUNNEL_STAGE_LABELS, type Persona, type FunnelStage } from "@shared/defaults/personas";
import { OUTREACH_TYPE_LABELS, TEMPLATE_CATEGORY_LABELS } from "@shared/hormoziEmailTemplates";
import Breadcrumbs from "@/components/Breadcrumbs";
import { TierGate } from "@/components/TierGate";
import { TIERS } from "@shared/tiers";

export default function AdminHormoziSms() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showPersonalizeDialog, setShowPersonalizeDialog] = useState(false);
  const [personalizedSms, setPersonalizedSms] = useState<any>(null);
  
  // Filters
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [funnelStageFilter, setFunnelStageFilter] = useState<string>("all");
  const [outreachTypeFilter, setOutreachTypeFilter] = useState<string>("all");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("all");

  // Build query string for template filters
  const buildTemplateQueryKey = () => {
    const params = new URLSearchParams();
    if (personaFilter !== "all") params.append("persona", personaFilter);
    if (funnelStageFilter !== "all") params.append("funnelStage", funnelStageFilter);
    if (outreachTypeFilter !== "all") params.append("outreachType", outreachTypeFilter);
    if (templateCategoryFilter !== "all") params.append("templateCategory", templateCategoryFilter);
    const queryString = params.toString();
    return queryString ? `/api/hormozi-sms-templates?${queryString}` : '/api/hormozi-sms-templates';
  };

  // Fetch Hormozi SMS templates with filters
  const { data: templates = [], isLoading: templatesLoading } = useQuery<SmsTemplate[]>({
    queryKey: [buildTemplateQueryKey()],
  });

  // Fetch all leads for selection
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/admin/leads'],
  });

  // Personalize SMS mutation
  const personalizeSmsMutation = useMutation({
    mutationFn: async ({ templateId, leadId }: { templateId: string; leadId: string }) => {
      const res = await apiRequest('POST', '/api/hormozi-sms-templates/personalize', { templateId, leadId });
      return res.json();
    },
    onSuccess: (data) => {
      setPersonalizedSms(data);
      toast({
        title: "SMS Personalized",
        description: "AI has customized the SMS based on CRM data",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to personalize SMS",
      });
    },
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/hormozi-sms-templates/send', data);
      return res.json();
    },
    onSuccess: () => {
      setShowPersonalizeDialog(false);
      setSelectedTemplate(null);
      setSelectedLead(null);
      setPersonalizedSms(null);
      toast({
        title: "Success",
        description: "SMS sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send SMS",
      });
    },
  });

  const handleSelectTemplate = (template: SmsTemplate) => {
    setSelectedTemplate(template);
    setShowPersonalizeDialog(true);
    setPersonalizedSms(null);
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

    personalizeSmsMutation.mutate({
      templateId: selectedTemplate.id,
      leadId: selectedLead.id,
    });
  };

  const handleSend = () => {
    if (!personalizedSms || !selectedLead) return;

    sendSmsMutation.mutate({
      leadId: selectedLead.id,
      messageContent: personalizedSms.messageContent,
    });
  };

  const clearFilters = () => {
    setPersonaFilter("all");
    setFunnelStageFilter("all");
    setOutreachTypeFilter("all");
    setTemplateCategoryFilter("all");
  };

  const activeFiltersCount = [personaFilter, funnelStageFilter, outreachTypeFilter, templateCategoryFilter].filter(f => f !== "all").length;

  return (
    <TierGate requiredTier={TIERS.PREMIUM} featureName="SMS Templates">
      <div className="min-h-screen p-6 bg-background">
      <Breadcrumbs 
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Hormozi SMS Templates", href: "/admin/hormozi-sms" }
        ]} 
      />

      <div className="max-w-7xl mx-auto space-y-6 mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" data-testid="icon-hormozi-sms" />
                  Hormozi SMS Templates
                </CardTitle>
                <CardDescription>
                  AI-powered SMS templates based on Alex Hormozi's $100M Leads framework (≤160 characters)
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
                        <SelectItem value="all">All Personas</SelectItem>
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
                        <SelectItem value="all">All Stages</SelectItem>
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
                        <SelectItem value="all">All Types</SelectItem>
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
                        <SelectItem value="all">All Frameworks</SelectItem>
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
                          <CardTitle className="text-base">{template.name}</CardTitle>
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
                        {template.messageTemplate}
                      </p>
                      <Badge variant="outline" className="mt-2" data-testid={`badge-char-count-${template.id}`}>
                        {template.messageTemplate.length} chars
                      </Badge>
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
            <DialogTitle>Personalize & Send SMS</DialogTitle>
            <DialogDescription>
              Select a lead and use AI to customize this SMS based on their CRM data (max 160 characters)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Info */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template: {selectedTemplate.name}</CardTitle>
                  <CardDescription>{selectedTemplate.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">{selectedTemplate.messageTemplate}</p>
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {selectedTemplate.messageTemplate.length} characters
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Lead Selection */}
            <div>
              <Label>Select Lead</Label>
              <Select 
                value={selectedLead?.id?.toString() || ""} 
                onValueChange={(value) => {
                  const lead = leads.find(l => l.id?.toString() === value);
                  setSelectedLead(lead || null);
                  setPersonalizedSms(null); // Reset personalization when lead changes
                }}
              >
                <SelectTrigger className="mt-2" data-testid="select-lead">
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leadsLoading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">Loading leads...</div>
                  ) : leads.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">No leads available</div>
                  ) : (
                    leads.filter(lead => lead.phone).map((lead) => (
                      <SelectItem key={lead.id} value={lead.id?.toString() || ""}>
                        {lead.firstName} {lead.lastName} ({lead.phone}) - {PERSONA_LABELS[lead.persona as Persona]} - {FUNNEL_STAGE_LABELS[lead.funnelStage as FunnelStage]}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedLead && !selectedLead.phone && (
                <p className="text-sm text-destructive mt-2">This lead does not have a phone number</p>
              )}
            </div>

            {/* Personalize Button */}
            {selectedLead && selectedLead.phone && !personalizedSms && (
              <Button 
                onClick={handlePersonalize} 
                disabled={personalizeSmsMutation.isPending}
                className="w-full"
                data-testid="button-personalize"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {personalizeSmsMutation.isPending ? "Personalizing..." : "Personalize with AI"}
              </Button>
            )}

            {/* Personalized SMS Preview */}
            {personalizedSms && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">AI-Personalized SMS</CardTitle>
                    <Badge variant="secondary" data-testid="badge-ai-personalized">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Customized
                    </Badge>
                  </div>
                  <CardDescription>{personalizedSms.personalizationNotes}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Message</Label>
                    <div 
                      className="mt-2 p-4 border rounded-md bg-muted/50"
                      data-testid="preview-personalized-sms"
                    >
                      <p className="text-sm">{personalizedSms.messageContent}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge 
                        variant={personalizedSms.messageContent.length <= 160 ? "outline" : "destructive"}
                        data-testid="badge-character-count"
                      >
                        {personalizedSms.messageContent.length} / 160 characters
                      </Badge>
                      {personalizedSms.messageContent.length > 160 && (
                        <p className="text-xs text-destructive">Message exceeds SMS limit</p>
                      )}
                    </div>
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
                setPersonalizedSms(null);
                setSelectedLead(null);
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            {personalizedSms && personalizedSms.messageContent.length <= 160 && (
              <Button 
                onClick={handleSend} 
                disabled={sendSmsMutation.isPending}
                data-testid="button-send-sms"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendSmsMutation.isPending ? "Sending..." : "Send SMS"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TierGate>
  );
}
