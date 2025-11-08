import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, Target, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

interface CampaignWithMembership {
  id: string;
  campaignId: string;
  userId: string;
  role: string;
  notifyOnDonation: boolean;
  notificationChannels: string[];
  isActive: boolean;
  joinedAt: string;
  campaign: {
    id: string;
    name: string;
    slug: string;
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
  };
}

export default function MemberCampaigns() {
  const [, setLocation] = useLocation();
  
  const { data: campaigns, isLoading } = useQuery<CampaignWithMembership[]>({
    queryKey: ['/api/my-campaigns'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-campaigns" />
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl" data-testid="container-empty">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Your Campaign Dashboard</CardTitle>
            <CardDescription className="text-base mt-2">
              This is where you'll track donations and share updates for campaigns you're part of
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                What are campaigns?
              </h3>
              <p className="text-sm text-muted-foreground">
                Donation campaigns are fundraising efforts organized by Julie's Family Learning Program. 
                When you're added as a beneficiary or participant, you'll be able to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                <li>Track real-time donation progress toward campaign goals</li>
                <li>See who's supporting you and your family</li>
                <li>Submit thank-you testimonials to share with donors</li>
                <li>Opt in to receive notifications when new donations arrive</li>
              </ul>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                No campaigns yet? That's okay! Your campaigns will appear here once you're added to one by the program administrators.
              </p>
              <p className="text-xs text-muted-foreground">
                Questions? Contact us at <a href="mailto:support@juliesfamilylearning.org" className="text-primary hover:underline">support@juliesfamilylearning.org</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl" data-testid="container-campaigns">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Campaigns</h1>
        <p className="text-muted-foreground">
          Track donation progress and share testimonials for campaigns you're part of
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {campaigns.map((membership) => {
          const campaign = membership.campaign;
          const progressPercentage = campaign.goalAmount > 0 
            ? Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100)
            : 0;
          
          const isActive = campaign.status === 'active';
          const daysUntilEnd = Math.ceil(
            (new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <Card 
              key={membership.id} 
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation(`/my-campaigns/${campaign.id}`)}
              data-testid={`card-campaign-${campaign.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{campaign.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {campaign.description}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    data-testid={`badge-status-${campaign.id}`}
                  >
                    {campaign.status}
                  </Badge>
                </div>
                
                {membership.role && (
                  <Badge variant="outline" className="w-fit" data-testid={`badge-role-${campaign.id}`}>
                    {membership.role}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground" data-testid={`text-progress-${campaign.id}`}>
                      ${(campaign.raisedAmount / 100).toFixed(2)} of ${(campaign.goalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                  <Progress value={progressPercentage} data-testid={`progress-${campaign.id}`} />
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`text-percentage-${campaign.id}`}>
                    {progressPercentage}% funded
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span data-testid={`text-donors-${campaign.id}`}>
                      {campaign.uniqueDonors} donor{campaign.uniqueDonors !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span data-testid={`text-donations-${campaign.id}`}>
                      {campaign.totalDonations} donation{campaign.totalDonations !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {isActive && daysUntilEnd > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span data-testid={`text-days-${campaign.id}`}>
                      {daysUntilEnd} day{daysUntilEnd !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/my-campaigns/${campaign.id}`);
                  }}
                  data-testid={`button-view-${campaign.id}`}
                >
                  <Target className="h-4 w-4 mr-2" />
                  View Campaign Details
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
