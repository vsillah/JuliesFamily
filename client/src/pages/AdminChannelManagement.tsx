import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Edit, DollarSign, Calendar, TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface Campaign {
  id: string;
  name: string;
  channelId: string;
  channelName?: string;
  description: string | null;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

interface EconomicsSettings {
  id: string;
  defaultGrossMarginPercent: number;
  avgDonationFrequency: number;
  avgDonorLifespanMonths: number;
}

export default function AdminChannelManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [spendDialogOpen, setSpendDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form states
  const [channelForm, setChannelForm] = useState({ 
    name: "", 
    slug: "", 
    channelType: "paid_ads" as const, 
    description: "", 
    isActive: true 
  });
  const [campaignForm, setCampaignForm] = useState({ 
    name: "", channelId: "", description: "", budget: "", 
    startDate: "", endDate: "", isActive: true 
  });
  const [spendForm, setSpendForm] = useState({
    channelId: "", campaignId: "", periodType: "month" as "week" | "month",
    periodKey: "", amountSpent: "", leadsAcquired: "", donorsAcquired: ""
  });

  // Fetch channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/admin/acquisition-channels"],
    retry: false,
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/marketing-campaigns"],
    retry: false,
  });

  // Fetch settings
  const { data: settings } = useQuery<EconomicsSettings>({
    queryKey: ["/api/admin/economics-settings"],
    retry: false,
  });

  // Fetch spend entries
  interface SpendEntry {
    id: string;
    channelId: string;
    campaignId: string | null;
    periodType: string;
    periodKey: string;
    periodStart: string;
    periodEnd: string;
    amountSpent: number;
    leadsAcquired: number;
    donorsAcquired: number;
    createdAt: string;
    updatedAt: string;
  }
  
  const { data: spendEntries = [], isLoading: spendEntriesLoading } = useQuery<SpendEntry[]>({
    queryKey: ["/api/admin/channel-spend"],
    retry: false,
  });

  // Create/Update Channel mutation
  const channelMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingChannel ? "PATCH" : "POST";
      const url = editingChannel 
        ? `/api/admin/acquisition-channels/${editingChannel.id}`
        : "/api/admin/acquisition-channels";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/acquisition-channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cac-ltgp/channels"] });
      toast({
        title: editingChannel ? "Channel Updated" : "Channel Created",
        description: `Successfully ${editingChannel ? "updated" : "created"} acquisition channel.`,
      });
      setChannelDialogOpen(false);
      setEditingChannel(null);
      setChannelForm({ name: "", description: "", isActive: true });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save channel.",
        variant: "destructive",
      });
    },
  });

  // Create/Update Campaign mutation
  const campaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingCampaign ? "PATCH" : "POST";
      const url = editingCampaign
        ? `/api/admin/marketing-campaigns/${editingCampaign.id}`
        : "/api/admin/marketing-campaigns";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cac-ltgp/campaigns"] });
      toast({
        title: editingCampaign ? "Campaign Updated" : "Campaign Created",
        description: `Successfully ${editingCampaign ? "updated" : "created"} marketing campaign.`,
      });
      setCampaignDialogOpen(false);
      setEditingCampaign(null);
      setCampaignForm({ 
        name: "", channelId: "", description: "", budget: "", 
        startDate: "", endDate: "", isActive: true 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save campaign.",
        variant: "destructive",
      });
    },
  });

  // Add Spend mutation
  const spendMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/channel-spend", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/channel-spend"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cac-ltgp/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cac-ltgp/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cac-ltgp/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cac-ltgp/cohorts"] });
      toast({
        title: "Spend Tracked",
        description: "Successfully recorded channel spend entry.",
      });
      setSpendDialogOpen(false);
      setSpendForm({
        channelId: "", campaignId: "", periodType: "month",
        periodKey: "", amountSpent: "", leadsAcquired: "", donorsAcquired: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record spend.",
        variant: "destructive",
      });
    },
  });

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  // Handle channel submit
  const handleChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    channelMutation.mutate(channelForm);
  };

  // Handle campaign submit
  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...campaignForm,
      budget: campaignForm.budget ? parseFloat(campaignForm.budget) : null,
      startDate: campaignForm.startDate ? new Date(campaignForm.startDate) : null,
      endDate: campaignForm.endDate ? new Date(campaignForm.endDate) : null,
    };
    campaignMutation.mutate(data);
  };

  // Calculate period dates from period key
  const calculatePeriodDates = (periodType: "week" | "month", periodKey: string) => {
    if (periodType === "month") {
      // Format: YYYY-MM
      const [year, month] = periodKey.split('-').map(Number);
      const periodStart = new Date(year, month - 1, 1); // Month is 0-indexed
      const periodEnd = new Date(year, month, 0); // Last day of month
      return { periodStart, periodEnd };
    } else {
      // Format: YYYY-Www (ISO week)
      const match = periodKey.match(/^(\d{4})-W(\d{2})$/);
      if (!match) {
        throw new Error(`Invalid week format: ${periodKey}. Expected YYYY-Www`);
      }
      const [_, yearStr, weekStr] = match;
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);
      
      // Calculate ISO week dates
      const jan4 = new Date(year, 0, 4);
      const startOfWeek1 = new Date(jan4);
      startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);
      
      const periodStart = new Date(startOfWeek1);
      periodStart.setDate(startOfWeek1.getDate() + (week - 1) * 7);
      
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      
      return { periodStart, periodEnd };
    }
  };

  // Handle spend submit
  const handleSpendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { periodStart, periodEnd } = calculatePeriodDates(spendForm.periodType, spendForm.periodKey);
    const data = {
      channelId: spendForm.channelId,
      campaignId: spendForm.campaignId && spendForm.campaignId !== "none" ? spendForm.campaignId : null,
      periodType: spendForm.periodType,
      periodKey: spendForm.periodKey,
      periodStart,
      periodEnd,
      amountSpent: parseFloat(spendForm.amountSpent),
      leadsAcquired: parseInt(spendForm.leadsAcquired),
      donorsAcquired: parseInt(spendForm.donorsAcquired),
    };
    spendMutation.mutate(data);
  };

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  // Edit channel
  const handleEditChannel = (channel: Channel & { slug?: string; channelType?: string }) => {
    setEditingChannel(channel);
    setChannelForm({
      name: channel.name,
      slug: channel.slug || generateSlug(channel.name),
      channelType: (channel.channelType as any) || "paid_ads",
      description: channel.description || "",
      isActive: channel.isActive,
    });
    setChannelDialogOpen(true);
  };

  // Edit campaign
  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      channelId: campaign.channelId,
      description: campaign.description || "",
      budget: campaign.budget?.toString() || "",
      startDate: campaign.startDate || "",
      endDate: campaign.endDate || "",
      isActive: campaign.isActive,
    });
    setCampaignDialogOpen(true);
  };

  // Get channel name by ID
  const getChannelName = (channelId: string) => {
    return channels.find(c => c.id === channelId)?.name || "Unknown";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <div className="relative bg-muted/30 border-b">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumbs items={[
            { label: "Admin Dashboard", href: "/admin" },
            { label: "CAC:LTGP Analytics", href: "/admin/cac-ltgp" },
            { label: "Channel Management" }
          ]} />
          <div className="flex flex-col gap-6 mt-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold" data-testid="page-title">
                Channel & Campaign Management
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg mt-2">
                Manage acquisition channels, campaigns, and track marketing spend
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="channels" className="space-y-6">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="channels" data-testid="tab-channels">Channels</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="spend" data-testid="tab-spend">Track Spend</TabsTrigger>
          </TabsList>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <Card data-testid="card-channels">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Acquisition Channels</CardTitle>
                    <CardDescription>
                      Manage your marketing channels (Google Ads, Facebook, Email, etc.)
                    </CardDescription>
                  </div>
                  <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setEditingChannel(null);
                          setChannelForm({ name: "", slug: "", channelType: "paid_ads", description: "", isActive: true });
                        }}
                        data-testid="button-add-channel"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Channel
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="dialog-channel">
                      <form onSubmit={handleChannelSubmit}>
                        <DialogHeader>
                          <DialogTitle>
                            {editingChannel ? "Edit Channel" : "Create Channel"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingChannel 
                              ? "Update the channel details below." 
                              : "Add a new acquisition channel to track marketing performance."}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="channel-name">Channel Name *</Label>
                            <Input
                              id="channel-name"
                              value={channelForm.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setChannelForm({ 
                                  ...channelForm, 
                                  name: newName,
                                  slug: generateSlug(newName)
                                });
                              }}
                              placeholder="e.g., Google Ads, Facebook, Email"
                              required
                              data-testid="input-channel-name"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="channel-type">Channel Type *</Label>
                            <Select
                              value={channelForm.channelType}
                              onValueChange={(value) => setChannelForm({ ...channelForm, channelType: value as any })}
                              required
                            >
                              <SelectTrigger data-testid="select-channel-type">
                                <SelectValue placeholder="Select a channel type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="paid_ads">Paid Ads (Google, Facebook, etc.)</SelectItem>
                                <SelectItem value="organic">Organic (SEO, Content)</SelectItem>
                                <SelectItem value="referral">Referral</SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                                <SelectItem value="email">Email Marketing</SelectItem>
                                <SelectItem value="social">Social Media</SelectItem>
                                <SelectItem value="direct">Direct</SelectItem>
                                <SelectItem value="partnership">Partnership</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="channel-description">Description</Label>
                            <Textarea
                              id="channel-description"
                              value={channelForm.description}
                              onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                              placeholder="Optional description"
                              data-testid="input-channel-description"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="channel-active"
                              checked={channelForm.isActive}
                              onChange={(e) => setChannelForm({ ...channelForm, isActive: e.target.checked })}
                              data-testid="checkbox-channel-active"
                            />
                            <Label htmlFor="channel-active">Active</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setChannelDialogOpen(false)}
                            data-testid="button-cancel-channel"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={channelMutation.isPending}
                            data-testid="button-save-channel"
                          >
                            {channelMutation.isPending ? "Saving..." : "Save Channel"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {channelsLoading ? (
                  <p className="text-center py-8" data-testid="loading-channels">Loading channels...</p>
                ) : channels.length > 0 ? (
                  <div className="space-y-3">
                    {channels.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                        data-testid={`channel-item-${channel.id}`}
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold" data-testid={`text-channel-name-${channel.id}`}>
                              {channel.name}
                            </h3>
                            <Badge variant={channel.isActive ? "default" : "secondary"}>
                              {channel.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {channel.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {channel.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditChannel(channel)}
                          data-testid={`button-edit-channel-${channel.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-channels">
                    No channels yet. Create your first acquisition channel to start tracking.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card data-testid="card-campaigns">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Marketing Campaigns</CardTitle>
                    <CardDescription>
                      Manage campaigns within your acquisition channels
                    </CardDescription>
                  </div>
                  <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingCampaign(null);
                          setCampaignForm({ 
                            name: "", channelId: "", description: "", budget: "", 
                            startDate: "", endDate: "", isActive: true 
                          });
                        }}
                        data-testid="button-add-campaign"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Campaign
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="dialog-campaign" className="max-w-2xl">
                      <form onSubmit={handleCampaignSubmit}>
                        <DialogHeader>
                          <DialogTitle>
                            {editingCampaign ? "Edit Campaign" : "Create Campaign"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingCampaign 
                              ? "Update the campaign details below." 
                              : "Add a new marketing campaign to track performance."}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="campaign-channel">Channel *</Label>
                            <Select
                              value={campaignForm.channelId}
                              onValueChange={(value) => setCampaignForm({ ...campaignForm, channelId: value })}
                              required
                            >
                              <SelectTrigger data-testid="select-campaign-channel">
                                <SelectValue placeholder="Select a channel" />
                              </SelectTrigger>
                              <SelectContent>
                                {channels.map((channel) => (
                                  <SelectItem key={channel.id} value={channel.id}>
                                    {channel.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="campaign-name">Campaign Name *</Label>
                            <Input
                              id="campaign-name"
                              value={campaignForm.name}
                              onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                              placeholder="e.g., Spring 2024 Fundraiser"
                              required
                              data-testid="input-campaign-name"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="campaign-description">Description</Label>
                            <Textarea
                              id="campaign-description"
                              value={campaignForm.description}
                              onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                              placeholder="Optional description"
                              data-testid="input-campaign-description"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="campaign-budget">Budget ($)</Label>
                            <Input
                              id="campaign-budget"
                              type="number"
                              step="0.01"
                              value={campaignForm.budget}
                              onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                              placeholder="e.g., 5000"
                              data-testid="input-campaign-budget"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="campaign-start">Start Date</Label>
                              <Input
                                id="campaign-start"
                                type="date"
                                value={campaignForm.startDate}
                                onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                                data-testid="input-campaign-start"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="campaign-end">End Date</Label>
                              <Input
                                id="campaign-end"
                                type="date"
                                value={campaignForm.endDate}
                                onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                                data-testid="input-campaign-end"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="campaign-active"
                              checked={campaignForm.isActive}
                              onChange={(e) => setCampaignForm({ ...campaignForm, isActive: e.target.checked })}
                              data-testid="checkbox-campaign-active"
                            />
                            <Label htmlFor="campaign-active">Active</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCampaignDialogOpen(false)}
                            data-testid="button-cancel-campaign"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={campaignMutation.isPending}
                            data-testid="button-save-campaign"
                          >
                            {campaignMutation.isPending ? "Saving..." : "Save Campaign"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <p className="text-center py-8" data-testid="loading-campaigns">Loading campaigns...</p>
                ) : campaigns.length > 0 ? (
                  <div className="space-y-3">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                        data-testid={`campaign-item-${campaign.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold" data-testid={`text-campaign-name-${campaign.id}`}>
                              {campaign.name}
                            </h3>
                            <Badge variant="outline">{getChannelName(campaign.channelId)}</Badge>
                            <Badge variant={campaign.isActive ? "default" : "secondary"}>
                              {campaign.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {campaign.budget && (
                              <span>Budget: ${campaign.budget.toLocaleString()}</span>
                            )}
                            {campaign.startDate && (
                              <span>
                                {format(new Date(campaign.startDate), 'MMM d, yyyy')}
                                {campaign.endDate && ` - ${format(new Date(campaign.endDate), 'MMM d, yyyy')}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCampaign(campaign)}
                          data-testid={`button-edit-campaign-${campaign.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-campaigns">
                    No campaigns yet. Create your first marketing campaign to start tracking.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Track Spend Tab */}
          <TabsContent value="spend" className="space-y-6">
            <Card data-testid="card-track-spend">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Track Marketing Spend</CardTitle>
                    <CardDescription>
                      Record spend, leads, and donors for a specific period
                    </CardDescription>
                  </div>
                  <Dialog open={spendDialogOpen} onOpenChange={setSpendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setSpendForm({
                            channelId: "", campaignId: "", periodType: "month",
                            periodKey: "", amountSpent: "", leadsAcquired: "", donorsAcquired: ""
                          });
                        }}
                        data-testid="button-add-spend"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Add Spend Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="dialog-spend" className="max-w-2xl">
                      <form onSubmit={handleSpendSubmit}>
                        <DialogHeader>
                          <DialogTitle>Record Marketing Spend</DialogTitle>
                          <DialogDescription>
                            Track your marketing spend, leads acquired, and donors converted for a specific period.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="spend-channel">Channel *</Label>
                            <Select
                              value={spendForm.channelId}
                              onValueChange={(value) => setSpendForm({ ...spendForm, channelId: value })}
                              required
                            >
                              <SelectTrigger data-testid="select-spend-channel">
                                <SelectValue placeholder="Select a channel" />
                              </SelectTrigger>
                              <SelectContent>
                                {channels.filter(c => c.isActive).map((channel) => (
                                  <SelectItem key={channel.id} value={channel.id}>
                                    {channel.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="spend-campaign">Campaign (Optional)</Label>
                            <Select
                              value={spendForm.campaignId}
                              onValueChange={(value) => setSpendForm({ ...spendForm, campaignId: value })}
                            >
                              <SelectTrigger data-testid="select-spend-campaign">
                                <SelectValue placeholder="Select a campaign (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {campaigns
                                  .filter(c => c.channelId === spendForm.channelId && c.isActive)
                                  .map((campaign) => (
                                    <SelectItem key={campaign.id} value={campaign.id}>
                                      {campaign.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="spend-period-type">Period Type *</Label>
                              <Select
                                value={spendForm.periodType}
                                onValueChange={(value: "week" | "month") => setSpendForm({ ...spendForm, periodType: value })}
                                required
                              >
                                <SelectTrigger data-testid="select-period-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="week">Week</SelectItem>
                                  <SelectItem value="month">Month</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="spend-period-key">Period Key *</Label>
                              <Input
                                id="spend-period-key"
                                value={spendForm.periodKey}
                                onChange={(e) => setSpendForm({ ...spendForm, periodKey: e.target.value })}
                                placeholder={spendForm.periodType === 'week' ? "e.g., 2024-W15" : "e.g., 2024-03"}
                                required
                                data-testid="input-period-key"
                              />
                              <p className="text-xs text-muted-foreground">
                                Format: {spendForm.periodType === 'week' ? 'YYYY-Www (e.g., 2024-W15)' : 'YYYY-MM (e.g., 2024-03)'}
                              </p>
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="spend-amount">Amount Spent ($) *</Label>
                            <Input
                              id="spend-amount"
                              type="number"
                              step="0.01"
                              value={spendForm.amountSpent}
                              onChange={(e) => setSpendForm({ ...spendForm, amountSpent: e.target.value })}
                              placeholder="e.g., 1500.00"
                              required
                              data-testid="input-amount-spent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="spend-leads">Leads Acquired *</Label>
                              <Input
                                id="spend-leads"
                                type="number"
                                value={spendForm.leadsAcquired}
                                onChange={(e) => setSpendForm({ ...spendForm, leadsAcquired: e.target.value })}
                                placeholder="e.g., 150"
                                required
                                data-testid="input-leads-acquired"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="spend-donors">Donors Acquired *</Label>
                              <Input
                                id="spend-donors"
                                type="number"
                                value={spendForm.donorsAcquired}
                                onChange={(e) => setSpendForm({ ...spendForm, donorsAcquired: e.target.value })}
                                placeholder="e.g., 25"
                                required
                                data-testid="input-donors-acquired"
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSpendDialogOpen(false)}
                            data-testid="button-cancel-spend"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={spendMutation.isPending}
                            data-testid="button-save-spend"
                          >
                            {spendMutation.isPending ? "Recording..." : "Record Spend"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {spendEntriesLoading ? (
                  <div className="text-center py-12" data-testid="loading-spend-entries">
                    <p className="text-muted-foreground">Loading spend entries...</p>
                  </div>
                ) : spendEntries.length === 0 ? (
                  <div className="text-center py-12 space-y-4" data-testid="empty-spend-entries">
                    <DollarSign className="w-16 h-16 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Track Your Marketing Spend</h3>
                      <p className="text-muted-foreground mb-4">
                        Click "Add Spend Entry" to record your marketing costs, leads, and donor conversions.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This data powers your CAC:LTGP analytics and cohort analysis.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-spend-entries">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Created</th>
                          <th className="text-left py-3 px-4 font-medium">Period</th>
                          <th className="text-left py-3 px-4 font-medium">Channel</th>
                          <th className="text-left py-3 px-4 font-medium">Campaign</th>
                          <th className="text-right py-3 px-4 font-medium">Spend</th>
                          <th className="text-right py-3 px-4 font-medium">Leads</th>
                          <th className="text-right py-3 px-4 font-medium">Donors</th>
                          <th className="text-right py-3 px-4 font-medium">CAC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spendEntries.map((entry) => {
                          const channel = channels.find(c => c.id === entry.channelId);
                          const campaign = campaigns.find(c => c.id === entry.campaignId);
                          const cac = entry.leadsAcquired > 0 
                            ? (entry.amountSpent / entry.leadsAcquired).toFixed(2)
                            : 'N/A';
                          
                          // Format timestamp in user's local timezone
                          const createdDate = new Date(entry.createdAt);
                          const localDate = format(createdDate, 'MMM d, h:mm a');
                          
                          return (
                            <tr key={entry.id} className="border-b hover-elevate" data-testid={`row-spend-${entry.id}`}>
                              <td className="py-3 px-4 text-muted-foreground" data-testid={`text-created-${entry.id}`}>
                                {localDate}
                              </td>
                              <td className="py-3 px-4" data-testid={`text-period-${entry.id}`}>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{entry.periodKey}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {entry.periodType}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3 px-4" data-testid={`text-channel-${entry.id}`}>
                                {channel?.name || 'Unknown'}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground" data-testid={`text-campaign-${entry.id}`}>
                                {campaign?.name || '—'}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold" data-testid={`text-amount-${entry.id}`}>
                                ${entry.amountSpent.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right" data-testid={`text-leads-${entry.id}`}>
                                {entry.leadsAcquired}
                              </td>
                              <td className="py-3 px-4 text-right" data-testid={`text-donors-${entry.id}`}>
                                {entry.donorsAcquired}
                              </td>
                              <td className="py-3 px-4 text-right" data-testid={`text-cac-${entry.id}`}>
                                <div className="flex items-center justify-end gap-1">
                                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                  {cac === 'N/A' ? cac : `$${cac}`}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
