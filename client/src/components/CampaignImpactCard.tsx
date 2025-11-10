import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "wouter";
import { DonationCampaign, User } from "@shared/schema";
import { Heart, TrendingUp } from "lucide-react";

interface CampaignImpactCardProps {
  // No props needed - we'll fetch user data internally
}

export function CampaignImpactCard() {
  const [, navigate] = useLocation();
  const [monthlyAmount, setMonthlyAmount] = useState(50);

  // Fetch current user to get their passions
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Fetch active donation campaigns
  const { data: campaigns, isLoading } = useQuery<DonationCampaign[]>({
    queryKey: ['/api/donation-campaigns/active'],
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filter campaigns by user's passions (from their profile)
  const filteredCampaigns = campaigns?.filter(campaign => {
    // If user has no passions set, or campaign has no tags, show all campaigns
    if (!user?.persona || !campaign.passionTags) return true;
    
    // For now, we'll match campaigns based on persona -> passion mapping
    // This is a simple heuristic since users don't directly select passion tags yet
    const campaignTags = campaign.passionTags as string[];
    
    // Map personas to likely passion interests (this could be enhanced with user preferences later)
    const personaPassionMap: Record<string, string[]> = {
      'student': ['literacy', 'stem', 'arts'],
      'parent': ['literacy', 'arts', 'nutrition'],
      'donor': [], // Donors see all campaigns
      'volunteer': [], // Volunteers see all campaigns
      'provider': ['literacy', 'stem', 'community'],
    };
    
    const userInterests = personaPassionMap[user.persona] || [];
    
    // If the persona has no specific passions (like donors), show all
    if (userInterests.length === 0) return true;
    
    // Check if any of the campaign tags match the user's interests
    return campaignTags.some(tag => userInterests.includes(tag));
  }) || [];

  // If no matches, show top 3 most-funded campaigns
  const displayCampaigns = filteredCampaigns.length > 0 
    ? filteredCampaigns.slice(0, 3)
    : (campaigns || [])
        .sort((a, b) => (b.raisedAmount || 0) - (a.raisedAmount || 0))
        .slice(0, 3);

  if (displayCampaigns.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {displayCampaigns.map((campaign) => {
        // Calculate impact
        const annualDonation = monthlyAmount * 12 * 100; // Convert to cents
        const peopleHelped = campaign.costPerPerson 
          ? Math.floor(annualDonation / campaign.costPerPerson)
          : 0;
        
        // Calculate progress percentage
        const progressPercent = campaign.goalAmount > 0
          ? Math.min(100, Math.round(((campaign.raisedAmount || 0) / campaign.goalAmount) * 100))
          : 0;

        // Format currency
        const formatCurrency = (cents: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(cents / 100);
        };

        return (
          <Card key={campaign.id} className="hover-elevate transition-all" data-testid={`campaign-card-${campaign.slug}`}>
            <CardHeader className="space-y-2">
              {campaign.thumbnailUrl && (
                <div className="w-full h-48 rounded-md overflow-hidden mb-2">
                  <img
                    src={campaign.thumbnailUrl}
                    alt={campaign.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardTitle className="text-xl" data-testid={`campaign-title-${campaign.slug}`}>
                {campaign.name}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {campaign.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-primary">
                    {formatCurrency(campaign.raisedAmount || 0)}
                  </span>
                  <span className="text-muted-foreground">
                    of {formatCurrency(campaign.goalAmount)}
                  </span>
                </div>
              </div>

              {/* Impact Calculator (only show if costPerPerson is set) */}
              {campaign.costPerPerson && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      Your Monthly Gift
                    </label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[monthlyAmount]}
                        onValueChange={([value]) => setMonthlyAmount(value)}
                        min={10}
                        max={500}
                        step={5}
                        className="flex-1"
                        data-testid={`slider-monthly-amount-${campaign.slug}`}
                      />
                      <span className="font-bold text-lg min-w-[80px] text-right">
                        ${monthlyAmount}
                      </span>
                    </div>
                  </div>

                  {/* Impact Display */}
                  <div className="p-4 bg-background rounded-md border-2 border-primary/20">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Your Annual Impact
                        </p>
                        <p className="text-2xl font-bold text-primary" data-testid={`impact-people-${campaign.slug}`}>
                          {peopleHelped} {peopleHelped === 1 ? 'person' : 'people'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          served this year with your ${monthlyAmount}/month donation
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      const params = new URLSearchParams({
                        amount: (monthlyAmount * 100).toString(), // Convert to cents
                        frequency: 'monthly',
                        campaign: campaign.slug,
                      });
                      navigate(`/donate?${params.toString()}`);
                    }}
                    data-testid={`button-start-giving-${campaign.slug}`}
                  >
                    Start Monthly Giving
                  </Button>
                </div>
              )}

              {/* Fallback button if no costPerPerson */}
              {!campaign.costPerPerson && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    const params = new URLSearchParams({
                      campaign: campaign.slug,
                    });
                    navigate(`/donate?${params.toString()}`);
                  }}
                  data-testid={`button-donate-${campaign.slug}`}
                >
                  Donate to This Campaign
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
