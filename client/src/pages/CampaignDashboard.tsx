import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Target, DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { DonationCampaign, Donation } from "@shared/schema";

export default function CampaignDashboard() {
  const [, params] = useRoute("/admin/campaigns/:id");
  const campaignId = params?.id;

  const { data: campaign, isLoading: campaignLoading } = useQuery<DonationCampaign>({
    queryKey: ['/api/donation-campaigns', campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/donation-campaigns/${campaignId}`);
      if (!res.ok) throw new Error('Failed to fetch campaign');
      return res.json();
    },
    enabled: !!campaignId,
  });

  const { data: donations = [], isLoading: donationsLoading } = useQuery<Donation[]>({
    queryKey: ['/api/donation-campaigns', campaignId, 'donations'],
    queryFn: async () => {
      const res = await fetch(`/api/donation-campaigns/${campaignId}/donations`);
      if (!res.ok) throw new Error('Failed to fetch donations');
      return res.json();
    },
    enabled: !!campaignId,
  });

  if (campaignLoading || donationsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild data-testid="button-back">
            <Link href="/admin/donation-campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Loading Campaign...</h1>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild data-testid="button-back">
            <Link href="/admin/donation-campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Campaign Not Found</h1>
        </div>
      </div>
    );
  }

  // Calculate metrics from actual donations data (succeeded only with valid amounts)
  const succeededDonations = donations.filter(d => d.status === 'succeeded' && (d.amount || 0) > 0);
  const goalAmount = campaign.goalAmount > 0 ? campaign.goalAmount / 100 : 0;
  const actualRaisedCents = succeededDonations
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const raisedAmount = actualRaisedCents / 100;
  const progressPercentage = goalAmount > 0 && raisedAmount >= 0 
    ? Math.min((raisedAmount / goalAmount) * 100, 100) 
    : 0;
  
  // Calculate unique donors using email, leadId, or donorName as identifiers
  const uniqueDonorIds = new Set(
    succeededDonations
      .map(d => d.donorEmail || d.leadId || d.donorName)
      .filter(Boolean)
  );
  const uniqueDonors = uniqueDonorIds.size;
  const avgDonation = succeededDonations.length > 0 ? raisedAmount / succeededDonations.length : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild data-testid="button-back">
            <Link href="/admin/donation-campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-campaign-name">{campaign.name}</h1>
            <p className="text-muted-foreground">{campaign.description}</p>
          </div>
        </div>
        <Badge 
          variant={campaign.status === 'active' ? 'default' : 'secondary'}
          data-testid={`badge-status-${campaign.status}`}
        >
          {campaign.status}
        </Badge>
      </div>

      {/* Campaign Dates */}
      {(campaign.startDate || campaign.endDate) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex gap-6">
                {campaign.startDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-semibold" data-testid="text-start-date">
                      {format(new Date(campaign.startDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                {campaign.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-semibold" data-testid="text-end-date">
                      {format(new Date(campaign.endDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Fundraising Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold" data-testid="text-progress-percentage">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(progressPercentage, 100)} data-testid="progress-bar" />
          </div>
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-3xl font-bold" data-testid="text-raised-amount">
                ${raisedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">raised</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-muted-foreground" data-testid="text-goal-amount">
                ${goalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">goal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-donations">
              {succeededDonations.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unique-donors">
              {uniqueDonors}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-donation">
              ${avgDonation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Story */}
      {campaign.story && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Story</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-campaign-story">
              {campaign.story}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Target Passions */}
      <Card>
        <CardHeader>
          <CardTitle>Target Passions</CardTitle>
          <CardDescription>This campaign targets donors interested in these areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {campaign.passionTags && campaign.passionTags.length > 0 ? (
              campaign.passionTags.map((passion) => (
                <Badge key={passion} variant="secondary" data-testid={`badge-passion-${passion}`}>
                  {passion.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No passions targeted</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Donation List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>
            {succeededDonations.length} successful donation{succeededDonations.length !== 1 ? 's' : ''} received
          </CardDescription>
        </CardHeader>
        <CardContent>
          {succeededDonations.length > 0 ? (
            <div className="space-y-4">
              {succeededDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                  data-testid={`donation-${donation.id}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold" data-testid={`text-donor-name-${donation.id}`}>
                      {donation.isAnonymous ? 'Anonymous Donor' : donation.donorName || donation.donorEmail || 'Unknown'}
                    </p>
                    {donation.createdAt && (
                      <p className="text-sm text-muted-foreground" data-testid={`text-donation-date-${donation.id}`}>
                        {format(new Date(donation.createdAt), 'MMM dd, yyyy \'at\' h:mm a')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" data-testid={`text-donation-amount-${donation.id}`}>
                      ${((donation.amount || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <Badge 
                      variant="default"
                      data-testid={`badge-donation-status-${donation.id}`}
                    >
                      {donation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No successful donations yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Only donations with succeeded status and positive amounts appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
