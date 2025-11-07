import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Mail, Clock, Users, ChevronRight } from "lucide-react";
import type { EmailCampaign, EmailSequenceStep } from "@shared/schema";
import type { Persona } from "@shared/defaults/personas";
import CopyVariantGenerator from "@/components/CopyVariantGenerator";

interface CampaignWithSteps extends EmailCampaign {
  steps?: EmailSequenceStep[];
}

export default function AdminEmailCampaigns() {
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithSteps | null>(null);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<EmailSequenceStep | null>(null);
  
  // State for AI-generated content
  const [subjectText, setSubjectText] = useState("");
  const [bodyText, setBodyText] = useState("");

  // Fetch all campaigns
  const { data: campaigns = [], isLoading } = useQuery<EmailCampaign[]>({
    queryKey: ['/api/email-campaigns'],
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/email-campaigns', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-campaigns'] });
      setShowCampaignDialog(false);
      toast({
        title: "Success",
        description: "Email campaign created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create campaign",
      });
    },
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PATCH', `/api/email-campaigns/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-campaigns'] });
      setShowCampaignDialog(false);
      setSelectedCampaign(null);
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update campaign",
      });
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/email-campaigns/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-campaigns'] });
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete campaign",
      });
    },
  });

  // Create sequence step mutation
  const createStepMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/email-sequence-steps', data);
      return res.json();
    },
    onSuccess: async () => {
      // Refetch the campaign with its steps
      if (selectedCampaign) {
        const response = await fetch(`/api/email-campaigns/${selectedCampaign.id}`);
        const updatedCampaign = await response.json();
        setSelectedCampaign(updatedCampaign);
      }
      setShowStepDialog(false);
      setEditingStep(null);
      toast({
        title: "Success",
        description: "Sequence step created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create step",
      });
    },
  });

  // Update sequence step mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PATCH', `/api/email-sequence-steps/${id}`, data);
      return res.json();
    },
    onSuccess: async () => {
      // Refetch the campaign with its steps
      if (selectedCampaign) {
        const response = await fetch(`/api/email-campaigns/${selectedCampaign.id}`);
        const updatedCampaign = await response.json();
        setSelectedCampaign(updatedCampaign);
      }
      setShowStepDialog(false);
      setEditingStep(null);
      toast({
        title: "Success",
        description: "Sequence step updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update step",
      });
    },
  });

  // Delete sequence step mutation
  const deleteStepMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/email-sequence-steps/${id}`);
      return res.json();
    },
    onSuccess: async () => {
      // Refetch the campaign with its steps
      if (selectedCampaign) {
        const response = await fetch(`/api/email-campaigns/${selectedCampaign.id}`);
        const updatedCampaign = await response.json();
        setSelectedCampaign(updatedCampaign);
      }
      toast({
        title: "Success",
        description: "Sequence step deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete step",
      });
    },
  });

  const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      triggerType: formData.get('triggerType') as string,
      persona: formData.get('persona') as string || null,
      isActive: formData.get('isActive') === 'on',
    };
    createCampaignMutation.mutate(data);
  };

  const handleUpdateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      triggerType: formData.get('triggerType') as string,
      persona: formData.get('persona') as string || null,
      isActive: formData.get('isActive') === 'on',
    };
    updateCampaignMutation.mutate({ id: selectedCampaign.id, data });
  };

  const handleCreateStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      campaignId: selectedCampaign.id,
      stepNumber: parseInt(formData.get('stepNumber') as string),
      templateId: formData.get('templateId') as string || null,
      subject: formData.get('subject') as string,
      htmlContent: formData.get('htmlContent') as string,
      textContent: formData.get('textContent') as string || null,
      delayDays: parseInt(formData.get('delayDays') as string),
      delayHours: parseInt(formData.get('delayHours') as string) || 0,
    };
    createStepMutation.mutate(data);
  };

  const handleUpdateStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStep) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      stepNumber: parseInt(formData.get('stepNumber') as string),
      templateId: formData.get('templateId') as string || null,
      subject: formData.get('subject') as string,
      htmlContent: formData.get('htmlContent') as string,
      textContent: formData.get('textContent') as string || null,
      delayDays: parseInt(formData.get('delayDays') as string),
      delayHours: parseInt(formData.get('delayHours') as string) || 0,
    };
    updateStepMutation.mutate({ id: editingStep.id, data });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage automated email drip campaigns
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedCampaign(null);
            setShowCampaignDialog(true);
          }}
          data-testid="button-create-campaign"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover-elevate cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    {campaign.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {campaign.description}
                  </CardDescription>
                </div>
                <Badge variant={campaign.isActive ? "default" : "secondary"}>
                  {campaign.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="capitalize">{campaign.triggerType.replace('_', ' ')}</span>
                </div>
                {campaign.persona && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="capitalize">{campaign.persona}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const response = await fetch(`/api/email-campaigns/${campaign.id}`);
                      const data = await response.json();
                      setSelectedCampaign(data);
                      setShowCampaignDialog(true);
                    }}
                    data-testid={`button-edit-campaign-${campaign.id}`}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                    data-testid={`button-delete-campaign-${campaign.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first email campaign to start nurturing leads automatically
            </p>
            <Button onClick={() => setShowCampaignDialog(true)} data-testid="button-create-first-campaign">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCampaign ? "Edit Campaign" : "Create Campaign"}
            </DialogTitle>
            <DialogDescription>
              {selectedCampaign 
                ? "Update campaign details and manage sequence steps" 
                : "Create a new email drip campaign"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Campaign Details</TabsTrigger>
              <TabsTrigger value="sequence" disabled={!selectedCampaign}>
                Sequence Steps
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <form onSubmit={selectedCampaign ? handleUpdateCampaign : handleCreateCampaign} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedCampaign?.name}
                    placeholder="e.g., Welcome Series"
                    required
                    data-testid="input-campaign-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedCampaign?.description || ''}
                    placeholder="Brief description of this campaign"
                    rows={3}
                    data-testid="input-campaign-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="triggerType">Trigger Type</Label>
                  <Select name="triggerType" defaultValue={selectedCampaign?.triggerType || "immediate"}>
                    <SelectTrigger data-testid="select-trigger-type">
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (On enrollment)</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="event_based">Event Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persona">Target Persona (Optional)</Label>
                  <Select name="persona" defaultValue={selectedCampaign?.persona || undefined}>
                    <SelectTrigger data-testid="select-persona">
                      <SelectValue placeholder="Select persona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="provider">Provider</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="donor">Donor</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    name="isActive"
                    defaultChecked={selectedCampaign?.isActive ?? true}
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="isActive">Campaign is active</Label>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCampaignDialog(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
                    data-testid="button-save-campaign"
                  >
                    {createCampaignMutation.isPending || updateCampaignMutation.isPending
                      ? "Saving..."
                      : selectedCampaign
                      ? "Update Campaign"
                      : "Create Campaign"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="sequence">
              {selectedCampaign && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Define the email sequence steps for this campaign
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingStep(null);
                        setSubjectText("");
                        setBodyText("");
                        setShowStepDialog(true);
                      }}
                      data-testid="button-add-step"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </div>

                  {selectedCampaign.steps && selectedCampaign.steps.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCampaign.steps.map((step, index) => (
                        <Card key={step.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium">{step.stepNumber}</span>
                                </div>
                                <div>
                                  <p className="font-medium">Step {step.stepNumber}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {step.delayDays > 0 && `${step.delayDays} days`}
                                    {step.delayHours > 0 && ` ${step.delayHours} hours`}
                                    {step.delayDays === 0 && step.delayHours === 0 && 'Immediate'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingStep(step);
                                    setSubjectText(step.subject);
                                    setBodyText(step.htmlContent);
                                    setShowStepDialog(true);
                                  }}
                                  data-testid={`button-edit-step-${step.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteStepMutation.mutate(step.id)}
                                  data-testid={`button-delete-step-${step.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <ChevronRight className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          No sequence steps yet. Add your first step to get started.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Step Dialog */}
      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStep ? "Edit Step" : "Add Step"}</DialogTitle>
            <DialogDescription>
              Configure the sequence step details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editingStep ? handleUpdateStep : handleCreateStep} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stepNumber">Step Number</Label>
              <Input
                id="stepNumber"
                name="stepNumber"
                type="number"
                min="1"
                defaultValue={editingStep?.stepNumber || (selectedCampaign?.steps?.length || 0) + 1}
                required
                data-testid="input-step-number"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject">Email Subject</Label>
                <CopyVariantGenerator
                  originalContent={subjectText || editingStep?.subject || ""}
                  contentType="email_subject"
                  persona={selectedCampaign?.persona as Persona}
                  onSelectVariant={(variant) => {
                    setSubjectText(variant);
                    const input = document.getElementById('subject') as HTMLInputElement;
                    if (input) input.value = variant;
                  }}
                  buttonText="✨ AI Subject"
                  buttonVariant="outline"
                />
              </div>
              <Input
                id="subject"
                name="subject"
                value={subjectText || editingStep?.subject || ''}
                onChange={(e) => setSubjectText(e.target.value)}
                placeholder="Enter email subject"
                required
                data-testid="input-subject"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="htmlContent">HTML Content</Label>
                <CopyVariantGenerator
                  originalContent={bodyText || editingStep?.htmlContent || ""}
                  contentType="email_body"
                  persona={selectedCampaign?.persona as Persona}
                  onSelectVariant={(variant) => {
                    setBodyText(variant);
                    const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement;
                    if (textarea) textarea.value = variant;
                  }}
                  buttonText="✨ AI Content"
                  buttonVariant="outline"
                />
              </div>
              <Textarea
                id="htmlContent"
                name="htmlContent"
                value={bodyText || editingStep?.htmlContent || ''}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Enter HTML email content"
                rows={6}
                required
                data-testid="input-html-content"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="textContent">Text Content (Optional)</Label>
              <Textarea
                id="textContent"
                name="textContent"
                defaultValue={editingStep?.textContent || ''}
                placeholder="Enter plain text email content"
                rows={4}
                data-testid="input-text-content"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateId">Template ID (Optional)</Label>
              <Input
                id="templateId"
                name="templateId"
                defaultValue={editingStep?.templateId || ''}
                placeholder="Link to email template"
                data-testid="input-template-id"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delayDays">Delay (Days)</Label>
                <Input
                  id="delayDays"
                  name="delayDays"
                  type="number"
                  min="0"
                  defaultValue={editingStep?.delayDays || 0}
                  required
                  data-testid="input-delay-days"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delayHours">Delay (Hours)</Label>
                <Input
                  id="delayHours"
                  name="delayHours"
                  type="number"
                  min="0"
                  max="23"
                  defaultValue={editingStep?.delayHours || 0}
                  data-testid="input-delay-hours"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowStepDialog(false);
                  setEditingStep(null);
                }}
                data-testid="button-cancel-step"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStepMutation.isPending || updateStepMutation.isPending}
                data-testid="button-save-step"
              >
                {createStepMutation.isPending || updateStepMutation.isPending
                  ? "Saving..."
                  : editingStep
                  ? "Update Step"
                  : "Add Step"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
