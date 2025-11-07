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
import { Plus, Edit, Trash2, MessageSquare, Send, Clock } from "lucide-react";
import type { SmsTemplate, SmsSend } from "@shared/schema";
import type { Persona } from "@shared/defaults/personas";
import CopyVariantGenerator from "@/components/CopyVariantGenerator";

export default function AdminSmsNotifications() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "send" | "history">("templates");

  // State for AI-generated content
  const [messageText, setMessageText] = useState("");

  // Fetch all SMS templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<SmsTemplate[]>({
    queryKey: ['/api/sms-templates'],
  });

  // Fetch recent SMS sends
  const { data: recentSends = [], isLoading: sendsLoading } = useQuery<SmsSend[]>({
    queryKey: ['/api/sms/recent'],
    enabled: activeTab === "history",
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/sms-templates', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-templates'] });
      setShowTemplateDialog(false);
      setSelectedTemplate(null);
      toast({
        title: "Success",
        description: "SMS template created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create template",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PATCH', `/api/sms-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-templates'] });
      setShowTemplateDialog(false);
      setSelectedTemplate(null);
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update template",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/sms-templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete template",
      });
    },
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/sms/send', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms/recent'] });
      setShowSendDialog(false);
      if (data.success) {
        toast({
          title: "Success",
          description: "SMS sent successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "SMS Send Failed",
          description: data.error || "Failed to send SMS",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send SMS",
      });
    },
  });

  const handleCreateTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      messageContent: formData.get('messageContent') as string,
      category: formData.get('category') as string || null,
      persona: formData.get('persona') as string || null,
      isActive: formData.get('isActive') === 'on',
    };

    createTemplateMutation.mutate(data);
  };

  const handleUpdateTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      messageContent: formData.get('messageContent') as string,
      category: formData.get('category') as string || null,
      persona: formData.get('persona') as string || null,
      isActive: formData.get('isActive') === 'on',
    };

    updateTemplateMutation.mutate({ id: selectedTemplate.id, data });
  };

  const handleSendSms = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const variables: Record<string, string> = {};
    
    const templateId = formData.get('templateId') as string || undefined;
    
    // Parse variables from form if using template
    if (templateId) {
      const firstName = formData.get('var_firstName') as string;
      const lastName = formData.get('var_lastName') as string;
      if (firstName) variables['firstName'] = firstName;
      if (lastName) variables['lastName'] = lastName;
    }
    
    const data = {
      templateId,
      customMessage: formData.get('customMessage') as string || undefined,
      recipientPhone: formData.get('recipientPhone') as string,
      recipientName: formData.get('recipientName') as string || undefined,
      leadId: formData.get('leadId') as string || undefined,
      variables,
    };

    sendSmsMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Notifications</h1>
          <p className="text-muted-foreground">
            Manage SMS templates and send notifications to leads
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <MessageSquare className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="send" data-testid="tab-send">
            <Send className="w-4 h-4 mr-2" />
            Send SMS
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <Clock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedTemplate(null);
                setMessageText("");
                setShowTemplateDialog(true);
              }}
              data-testid="button-create-template"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          {templatesLoading ? (
            <p className="text-muted-foreground">Loading templates...</p>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first SMS template to get started
                </p>
                <Button onClick={() => setShowTemplateDialog(true)} data-testid="button-create-first-template">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{template.name}</CardTitle>
                          {template.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          {template.category && (
                            <Badge variant="outline">{template.category}</Badge>
                          )}
                        </div>
                        {template.description && (
                          <CardDescription>{template.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setMessageText(template.messageContent);
                            setShowTemplateDialog(true);
                          }}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-mono bg-muted p-3 rounded">
                      {template.messageContent}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send SMS Notification</CardTitle>
              <CardDescription>
                Send a one-time SMS using a template or custom message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendSms} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">Recipient Phone Number *</Label>
                  <Input
                    id="recipientPhone"
                    name="recipientPhone"
                    placeholder="+1234567890 or 234-567-8900"
                    required
                    data-testid="input-recipient-phone"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter phone with area code. Supports US and international formats.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
                  <Input
                    id="recipientName"
                    name="recipientName"
                    placeholder="John Doe"
                    data-testid="input-recipient-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateId">Use Template (Optional)</Label>
                  <Select name="templateId">
                    <SelectTrigger data-testid="select-template">
                      <SelectValue placeholder="Select a template or use custom message below" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.filter(t => t.isActive).map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use custom message below instead
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customMessage">Custom Message</Label>
                    <CopyVariantGenerator
                      originalContent={messageText}
                      contentType="email_body"
                      onSelectVariant={(variant) => {
                        setMessageText(variant);
                        const textarea = document.getElementById('customMessage') as HTMLTextAreaElement;
                        if (textarea) textarea.value = variant;
                      }}
                      buttonText="✨ AI SMS"
                      buttonVariant="outline"
                    />
                  </div>
                  <Textarea
                    id="customMessage"
                    name="customMessage"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Enter custom SMS message (160 characters recommended)"
                    rows={4}
                    data-testid="input-custom-message"
                  />
                  <p className="text-xs text-muted-foreground">
                    SMS messages over 160 characters may be split into multiple messages. Current: {messageText.length} characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Template Variables (if using template)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="var_firstName" className="text-xs">First Name</Label>
                      <Input
                        id="var_firstName"
                        name="var_firstName"
                        placeholder="{{firstName}}"
                        className="mt-1"
                        data-testid="input-var-firstname"
                      />
                    </div>
                    <div>
                      <Label htmlFor="var_lastName" className="text-xs">Last Name</Label>
                      <Input
                        id="var_lastName"
                        name="var_lastName"
                        placeholder="{{lastName}}"
                        className="mt-1"
                        data-testid="input-var-lastname"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={sendSmsMutation.isPending}
                  data-testid="button-send-sms"
                  className="w-full"
                >
                  {sendSmsMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send SMS
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {sendsLoading ? (
            <p className="text-muted-foreground">Loading history...</p>
          ) : recentSends.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No SMS history yet</h3>
                <p className="text-muted-foreground">
                  Sent messages will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentSends.map((send) => (
                <Card key={send.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{send.recipientName || send.recipientPhone}</CardTitle>
                        <CardDescription>
                          {send.recipientPhone} • {send.createdAt ? new Date(send.createdAt).toLocaleString() : 'Unknown date'}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        send.status === 'sent' || send.status === 'delivered' ? 'default' :
                        send.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {send.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-mono bg-muted p-3 rounded">
                      {send.messageContent}
                    </p>
                    {send.errorMessage && (
                      <p className="text-sm text-destructive mt-2">
                        Error: {send.errorMessage}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {selectedTemplate 
                ? "Update template details and message content" 
                : "Create a reusable SMS template"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={selectedTemplate?.name || ''}
                placeholder="e.g., Appointment Reminder"
                required
                data-testid="input-template-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                name="description"
                defaultValue={selectedTemplate?.description || ''}
                placeholder="Brief description of this template"
                data-testid="input-template-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Select name="category" defaultValue={selectedTemplate?.category || undefined}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="confirmation">Confirmation</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="persona">Target Persona (Optional)</Label>
              <Select name="persona" defaultValue={selectedTemplate?.persona || undefined}>
                <SelectTrigger data-testid="select-persona">
                  <SelectValue placeholder="All personas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent_guardian">Parent/Guardian</SelectItem>
                  <SelectItem value="student">Adult Learner</SelectItem>
                  <SelectItem value="job_seeker">Job Seeker</SelectItem>
                  <SelectItem value="donor">Donor</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="messageContent">Message Content</Label>
                <CopyVariantGenerator
                  originalContent={messageText || selectedTemplate?.messageContent || ""}
                  contentType="email_body"
                  persona={selectedTemplate?.persona as Persona}
                  onSelectVariant={(variant) => {
                    setMessageText(variant);
                    const textarea = document.getElementById('messageContent') as HTMLTextAreaElement;
                    if (textarea) textarea.value = variant;
                  }}
                  buttonText="✨ AI SMS"
                  buttonVariant="outline"
                />
              </div>
              <Textarea
                id="messageContent"
                name="messageContent"
                value={messageText || selectedTemplate?.messageContent || ''}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Your SMS message. Use {{firstName}}, {{lastName}} for personalization."
                rows={4}
                required
                data-testid="input-message-content"
              />
              <p className="text-xs text-muted-foreground">
                Use double curly braces for variables: {'{'}{'{'} firstName {'}'} {'}'}, {'{'}{'{'} lastName {'}'}{'}'}, etc.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={selectedTemplate?.isActive ?? true}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">Template is active</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTemplateDialog(false);
                  setSelectedTemplate(null);
                  setMessageText("");
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                data-testid="button-save-template"
              >
                {createTemplateMutation.isPending || updateTemplateMutation.isPending
                  ? "Saving..."
                  : selectedTemplate
                  ? "Update Template"
                  : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
