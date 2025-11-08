import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Heart, Plus, Target, Mail, MessageSquare, Calendar, Users } from "lucide-react";
import type { DonationCampaign, EmailTemplate, SmsTemplate } from "@shared/schema";
import { insertDonationCampaignSchema } from "@shared/schema";
import { z } from "zod";
import Breadcrumbs from "@/components/Breadcrumbs";

const PASSION_OPTIONS = [
  { id: 'literacy', label: 'Literacy & Reading' },
  { id: 'stem', label: 'STEM & Technology' },
  { id: 'arts', label: 'Arts & Creativity' },
  { id: 'nutrition', label: 'Nutrition & Health' },
  { id: 'community', label: 'Community Building' },
];

// Form schema that accepts dollars and converts to cents
const campaignFormSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().min(1, "Description is required"),
  story: z.string().optional(),
  goalAmountDollars: z.string()
    .min(1, "Goal amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Goal amount must be a positive number",
    }),
  passionTags: z.array(z.string()).min(1, "Select at least one passion"),
  emailTemplateId: z.string().optional(),
  smsTemplateId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function AdminDonationCampaigns() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: '',
      description: '',
      story: '',
      goalAmountDollars: '',
      passionTags: [],
      emailTemplateId: '',
      smsTemplateId: '',
      startDate: '',
      endDate: '',
    },
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<DonationCampaign[]>({
    queryKey: ['/api/donation-campaigns'],
  });

  // Fetch email templates
  const { data: emailTemplates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/hormozi-templates'],
  });

  // Fetch SMS templates
  const { data: smsTemplates = [] } = useQuery<SmsTemplate[]>({
    queryKey: ['/api/sms-templates'],
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormValues) => {
      // Convert form data to API format
      const goalAmountCents = Math.round(parseFloat(data.goalAmountDollars) * 100);
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      const campaignData = {
        name: data.name,
        slug,
        description: data.description,
        story: data.story || '',
        goalAmount: goalAmountCents,
        passionTags: data.passionTags,
        emailTemplateId: data.emailTemplateId || null,
        smsTemplateId: data.smsTemplateId || null,
        sendEmail: !!data.emailTemplateId,
        sendSms: !!data.smsTemplateId,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };
      
      const res = await apiRequest('POST', '/api/donation-campaigns', campaignData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/donation-campaigns'] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Campaign created successfully",
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

  const handleCreateCampaign = form.handleSubmit((data) => {
    createCampaignMutation.mutate(data);
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen p-6 bg-background">
      <Breadcrumbs 
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Donation Campaigns", href: "/admin/donation-campaigns" }
        ]} 
      />

      <div className="max-w-7xl mx-auto space-y-6 mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" data-testid="icon-campaigns" />
                  Donation Campaigns
                </CardTitle>
                <CardDescription>
                  Create and manage passion-based fundraising campaigns with multi-channel targeting
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-campaign">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns yet. Create your first passion-based fundraising campaign!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeCampaigns.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Active Campaigns ({activeCampaigns.length})
                    </h3>
                    <div className="grid gap-4">
                      {activeCampaigns.map((campaign) => (
                        <CampaignCard key={campaign.id} campaign={campaign} />
                      ))}
                    </div>
                  </div>
                )}

                {completedCampaigns.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      Completed Campaigns ({completedCampaigns.length})
                    </h3>
                    <div className="grid gap-4">
                      {completedCampaigns.map((campaign) => (
                        <CampaignCard key={campaign.id} campaign={campaign} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Donation Campaign</DialogTitle>
            <DialogDescription>
              Set up a passion-based fundraising campaign with multi-channel targeting
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleCreateCampaign} className="space-y-6 py-4">
              {/* Campaign Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Campaign Details</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Summer Reading Challenge 2024" {...field} data-testid="input-campaign-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief summary for emails and SMS" {...field} data-testid="input-campaign-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="story"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Story (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Share the compelling story behind this campaign..." rows={4} {...field} data-testid="textarea-campaign-story" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goalAmountDollars"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="5000" {...field} data-testid="input-goal-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Target Passions */}
              <FormField
                control={form.control}
                name="passionTags"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base font-semibold">Target Passions</FormLabel>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select which donor passions this campaign should target
                      </p>
                    </div>
                    {PASSION_OPTIONS.map((passion) => (
                      <FormField
                        key={passion.id}
                        control={form.control}
                        name="passionTags"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={passion.id}
                              className="flex items-start space-x-3 p-3 rounded-md border hover-elevate"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(passion.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, passion.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== passion.id
                                          )
                                        )
                                  }}
                                  data-testid={`checkbox-create-passion-${passion.id}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal flex-1 cursor-pointer">
                                {passion.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Communication Channels */}
              <div className="space-y-4">
                <h3 className="font-semibold">Communication Channels</h3>
                
                <FormField
                  control={form.control}
                  name="emailTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Template (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-email-template">
                            <SelectValue placeholder="Select Hormozi email template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {emailTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smsTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMS Template (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-sms-template">
                            <SelectValue placeholder="Select Hormozi SMS template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {smsTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date Range */}
              <div className="space-y-4">
                <h3 className="font-semibold">Campaign Duration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createCampaignMutation.isPending}
                  data-testid="button-submit-campaign"
                >
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: DonationCampaign }) {
  // Convert from cents to dollars
  const goalDollars = campaign.goalAmount / 100;
  const raisedDollars = (campaign.raisedAmount || 0) / 100;
  const progress = campaign.goalAmount > 0 
    ? Math.min((raisedDollars / goalDollars) * 100, 100)
    : 0;

  return (
    <Card data-testid={`card-campaign-${campaign.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
            {campaign.description && (
              <CardDescription>{campaign.description}</CardDescription>
            )}
          </div>
          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} data-testid={`badge-status-${campaign.id}`}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Goal Progress</span>
            <span className="text-sm font-semibold">
              ${raisedDollars.toFixed(2)} / ${goalDollars.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${progress}%` }}
              data-testid={`progress-${campaign.id}`}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">{progress.toFixed(1)}% complete</span>
            <span className="text-xs text-muted-foreground">{campaign.totalDonations || 0} donations</span>
          </div>
        </div>

        {/* Target Passions */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Target Passions</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(campaign.passionTags as string[]).map((passion) => {
              const passionLabel = PASSION_OPTIONS.find(p => p.id === passion)?.label || passion;
              return (
                <Badge key={passion} variant="outline" data-testid={`badge-passion-${passion}`}>
                  {passionLabel}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Channels */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {campaign.emailTemplateId && (
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </div>
          )}
          {campaign.smsTemplateId && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>SMS</span>
            </div>
          )}
          {campaign.startDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Dashboard Link */}
        <div className="pt-2">
          <Button asChild variant="outline" className="w-full" data-testid={`button-view-dashboard-${campaign.id}`}>
            <Link href={`/admin/campaigns/${campaign.id}`}>
              <Target className="w-4 h-4 mr-2" />
              View Dashboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
