import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2,
  Heart,
  Users,
  Calendar,
  ArrowLeft,
  Bell,
  BellOff,
  MessageSquarePlus,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

interface Donation {
  id: string;
  amount: number;
  donorName: string | null;
  donorEmail: string | null;
  isAnonymous: boolean;
  createdAt: string;
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  story: string | null;
  goalAmount: number;
  raisedAmount: number;
  passionTags: string[];
  startDate: string;
  endDate: string;
  status: string;
  imageUrl: string | null;
  totalDonations: number;
  uniqueDonors: number;
}

interface CampaignMember {
  id: string;
  role: string;
  notifyOnDonation: boolean;
  notificationChannels: string[];
}

export default function MemberCampaignDashboard() {
  const { campaignId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [testimonialTitle, setTestimonialTitle] = useState("");
  const [testimonialMessage, setTestimonialMessage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");

  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: ['/api/my-campaigns', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/my-campaigns/${campaignId}`);
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
  });

  const { data: donations, isLoading: donationsLoading } = useQuery<Donation[]>({
    queryKey: ['/api/my-campaigns', campaignId, 'donations'],
    queryFn: async () => {
      const response = await fetch(`/api/my-campaigns/${campaignId}/donations`);
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ['/api/my-campaigns'],
  });

  const memberInfo = campaigns?.find((c: any) => c.campaign.id === campaignId) as CampaignMember | undefined;

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { notifyOnDonation: boolean }) => {
      if (!memberInfo?.id) throw new Error("Member info not found");
      return await apiRequest(
        `/api/campaign-members/${memberInfo.id}/preferences`,
        "PATCH",
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my-campaigns'] });
      toast({
        title: "Preferences Updated",
        description: "Your notification settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const submitTestimonialMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(
        `/api/my-campaigns/${campaignId}/testimonials`,
        "POST",
        data
      );
    },
    onSuccess: () => {
      toast({
        title: "Testimonial Submitted",
        description: "Your testimonial has been submitted for review. Thank you for sharing!",
      });
      setShowTestimonialDialog(false);
      setTestimonialTitle("");
      setTestimonialMessage("");
      setAuthorName("");
      setAuthorRole("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit testimonial",
        variant: "destructive",
      });
    },
  });

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-campaign" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Not Found</CardTitle>
            <CardDescription>This campaign does not exist or you don't have access to it.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/my-campaigns')} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const progressPercentage = campaign.goalAmount > 0 
    ? Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100)
    : 0;

  const succeededDonations = donations?.filter(d => d.status === 'succeeded' && d.amount > 0) || [];
  const recentDonations = succeededDonations.slice(0, 10);

  const handleSubmitTestimonial = () => {
    if (!testimonialMessage.trim() || !authorName.trim()) {
      toast({
        title: "Incomplete Form",
        description: "Please provide your name and a message.",
        variant: "destructive",
      });
      return;
    }

    submitTestimonialMutation.mutate({
      title: testimonialTitle.trim() || null,
      message: testimonialMessage.trim(),
      authorName: authorName.trim(),
      authorRole: authorRole.trim() || null,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl" data-testid="container-dashboard">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/my-campaigns')}
          className="mb-4"
          data-testid="button-back-campaigns"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Campaigns
        </Button>
        
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
            <p className="text-muted-foreground">{campaign.description}</p>
          </div>
          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} data-testid="badge-status">
            {campaign.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card data-testid="card-goal">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-raised">
              ${(campaign.raisedAmount / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-goal">
              of ${(campaign.goalAmount / 100).toFixed(2)} goal
            </p>
            <Progress value={progressPercentage} className="mt-2" data-testid="progress-goal" />
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-percentage">
              {progressPercentage}% funded
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-donors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold" data-testid="text-donors">
                {campaign.uniqueDonors}
              </span>
              <span className="text-sm text-muted-foreground">donors</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold" data-testid="text-donations">
                {campaign.totalDonations}
              </span>
              <span className="text-sm text-muted-foreground">donations</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-timeline">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campaign Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span data-testid="text-dates">
                {format(new Date(campaign.startDate), 'MMM d')} - {format(new Date(campaign.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            {campaign.status === 'active' && new Date(campaign.endDate) > new Date() && (
              <p className="text-xs text-muted-foreground" data-testid="text-days-remaining">
                {Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-notifications">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {memberInfo?.notifyOnDonation ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              Notification Settings
            </CardTitle>
            <CardDescription>
              Stay updated when someone donates to your campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-toggle" className="cursor-pointer">
                Get notified about new donations
              </Label>
              <Switch
                id="notify-toggle"
                checked={memberInfo?.notifyOnDonation || false}
                onCheckedChange={(checked) => {
                  updatePreferencesMutation.mutate({ notifyOnDonation: checked });
                }}
                disabled={updatePreferencesMutation.isPending}
                data-testid="switch-notify"
              />
            </div>
            {memberInfo?.notifyOnDonation && (
              <div className="text-sm text-muted-foreground">
                <p>You'll receive notifications via:</p>
                <ul className="list-disc list-inside mt-1">
                  {memberInfo.notificationChannels?.map((channel: string) => (
                    <li key={channel} className="capitalize">{channel}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-testimonial">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5" />
              Share Your Story
            </CardTitle>
            <CardDescription>
              Thank your donors with a personal testimonial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your testimonial will be sent to all donors who contributed to this campaign after admin approval.
            </p>
            <Button
              onClick={() => setShowTestimonialDialog(true)}
              className="w-full"
              data-testid="button-submit-testimonial"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Submit a Testimonial
            </Button>
          </CardContent>
        </Card>
      </div>

      {!donationsLoading && recentDonations.length > 0 && (
        <Card className="mt-6" data-testid="card-donations">
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>
              Latest contributions to your campaign (showing {recentDonations.length} of {succeededDonations.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                  data-testid={`donation-${donation.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium" data-testid={`donor-name-${donation.id}`}>
                        {donation.isAnonymous ? 'Anonymous Donor' : (donation.donorName || 'Generous Supporter')}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`donation-date-${donation.id}`}>
                        {format(new Date(donation.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg" data-testid={`donation-amount-${donation.id}`}>
                      ${(donation.amount / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showTestimonialDialog} onOpenChange={setShowTestimonialDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-testimonial">
          <DialogHeader>
            <DialogTitle>Submit a Testimonial</DialogTitle>
            <DialogDescription>
              Share your gratitude with the donors who supported your campaign. Your testimonial will be reviewed by an administrator before being sent.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="author-name">Your Name *</Label>
              <Input
                id="author-name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g., Sarah Johnson"
                data-testid="input-author-name"
              />
            </div>

            <div>
              <Label htmlFor="author-role">Your Role (Optional)</Label>
              <Input
                id="author-role"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="e.g., Student, Parent, Participant"
                data-testid="input-author-role"
              />
            </div>

            <div>
              <Label htmlFor="testimonial-title">Title (Optional)</Label>
              <Input
                id="testimonial-title"
                value={testimonialTitle}
                onChange={(e) => setTestimonialTitle(e.target.value)}
                placeholder="e.g., Thank You for Changing My Life"
                data-testid="input-title"
              />
            </div>

            <div>
              <Label htmlFor="testimonial-message">Your Message *</Label>
              <Textarea
                id="testimonial-message"
                value={testimonialMessage}
                onChange={(e) => setTestimonialMessage(e.target.value)}
                placeholder="Share your story and express your gratitude..."
                rows={6}
                data-testid="textarea-message"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific and heartfelt. Share how the campaign has helped you.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTestimonialDialog(false)}
              disabled={submitTestimonialMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTestimonial}
              disabled={submitTestimonialMutation.isPending}
              data-testid="button-submit"
            >
              {submitTestimonialMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Testimonial'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
