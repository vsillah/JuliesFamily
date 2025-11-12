import { useQuery, useMutation } from "@tanstack/react-query";
import { TechGoesHomeProgressCard } from "@/components/TechGoesHomeProgressCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop, Award, Wifi, Users, Clock, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePersona } from "@/contexts/PersonaContext";
import type { ContentItem } from "@shared/schema";

export default function TechGoesHomeLanding() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { persona, funnelStage } = usePersona();

  // Fetch current user to check auth status
  const { data: user } = useQuery<any>({ 
    queryKey: ['/api/auth/user'],
    retry: false
  });

  // Fetch student's actual progress if logged in
  const { data: studentProgress, isLoading: isLoadingProgress, error: progressError } = useQuery({
    queryKey: ['/api/tgh/progress'],
    enabled: !!user,
    retry: false
  });

  // Fetch demo progress for non-logged-in users
  const { data: demoProgress, isLoading: isLoadingDemo } = useQuery({
    queryKey: ['/api/tgh/demo-progress'],
    enabled: !user
  });

  // Fetch student dashboard card content for personalization
  const { data: dashboardCardContent = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/visible/student_dashboard_card", { persona, funnelStage }],
    queryFn: async () => {
      if (!persona || !funnelStage) return [];
      const params = new URLSearchParams();
      params.append('persona', persona);
      params.append('funnelStage', funnelStage);
      const res = await fetch(`/api/content/visible/student_dashboard_card?${params}`);
      if (!res.ok) throw new Error('Failed to fetch student dashboard card content');
      return res.json();
    },
    enabled: !!persona && !!funnelStage && !!studentProgress?.enrolled,
  });

  // Normalize first content item for the card (if available)
  const cardContent = dashboardCardContent[0] ? {
    title: dashboardCardContent[0].title,
    description: dashboardCardContent[0].description,
    buttonText: (dashboardCardContent[0].metadata as any)?.buttonText || "View Dashboard",
    buttonLink: (dashboardCardContent[0].metadata as any)?.buttonLink || "/student/tech-goes-home",
    goalText: (dashboardCardContent[0].metadata as any)?.goalText,
    motivationalText: (dashboardCardContent[0].metadata as any)?.motivationalText,
  } : undefined;

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/tgh/enroll', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tgh/progress'] });
      toast({
        title: "Enrollment Successful!",
        description: "Welcome to Tech Goes Home! Check your email for next steps.",
      });
      setLocation('/student/tech-goes-home');
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment Failed",
        description: error.message || "Unable to enroll at this time. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Please Log In",
        description: "You need to log in to enroll in Tech Goes Home.",
      });
      return;
    }
    enrollMutation.mutate();
  };

  // Determine card mode and data based on auth and loading states
  let cardMode: "demo" | "summary" | "full" = "demo";
  let progressData = demoProgress;
  let isLoadingCard = false;
  let hasProgressError = false;

  if (user) {
    // User is logged in - check their enrollment status
    if (isLoadingProgress) {
      isLoadingCard = true;
    } else if (progressError) {
      // Backend error for logged-in user - show error state
      hasProgressError = true;
    } else if (studentProgress?.enrolled) {
      cardMode = "summary";
      progressData = studentProgress;
    } else {
      // Logged in but not enrolled - show demo with enroll CTA
      cardMode = "demo";
      progressData = demoProgress || {
        enrolled: false,
        classesCompleted: 8,
        classesRemaining: 7,
        hoursCompleted: 16,
        percentComplete: 53,
        isEligibleForRewards: false
      };
    }
  } else {
    // Not logged in - show demo
    if (isLoadingDemo) {
      isLoadingCard = true;
    } else {
      cardMode = "demo";
      progressData = demoProgress;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground" data-testid="text-page-title">
            Tech Goes Home
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-page-subtitle">
            FREE program equipping Greater Boston residents with digital skills, technology, and internet access
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="space-y-6">
            <Card data-testid="card-program-info">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-program-title">
                  <BookOpen className="h-5 w-5 text-primary" />
                  What You'll Learn
                </CardTitle>
                <CardDescription data-testid="text-program-description">
                  At least 15 hours of in-person or Zoom courses focused on fundamental digital skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm" data-testid="list-program-features">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Using popular applications and the internet as resources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Effectively using technology for distance learning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Accessing essential goods and services online</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Staying up to date with health and safety information</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-rewards">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-rewards-title">
                  <Award className="h-5 w-5 text-primary" />
                  Your Rewards
                </CardTitle>
                <CardDescription data-testid="text-rewards-description">
                  Complete at least 15 hours of training to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5" data-testid="reward-chromebook">
                  <Laptop className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Brand New Chromebook</p>
                    <p className="text-sm text-muted-foreground">Yours to keep!</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5" data-testid="reward-certificate">
                  <Award className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Certificate of Completion</p>
                    <p className="text-sm text-muted-foreground">Official recognition</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5" data-testid="reward-internet">
                  <Wifi className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">1 Year Free Internet</p>
                    <p className="text-sm text-muted-foreground">Stay connected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {isLoadingCard ? (
              <Card data-testid="card-progress-loading">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading your progress...</p>
                  </div>
                </CardContent>
              </Card>
            ) : hasProgressError ? (
              <Card className="bg-destructive/5 border-destructive/20" data-testid="card-progress-error">
                <CardHeader>
                  <CardTitle className="text-destructive">Error Loading Progress</CardTitle>
                  <CardDescription>
                    We encountered an issue loading your progress data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {(progressError as any)?.message || 'Please check your connection and try again.'}
                  </p>
                  <Button 
                    variant="default"
                    onClick={() => window.location.reload()}
                    data-testid="button-retry-progress"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <TechGoesHomeProgressCard 
                mode={cardMode}
                data={progressData}
                content={cardContent}
                onEnroll={handleEnroll}
                showEnrollButton={cardMode === "demo" && !!user}
              />
            )}

            {cardMode === "demo" && !user && (
              <Card className="bg-primary/5 border-primary/20" data-testid="card-enroll-prompt">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2" data-testid="text-enroll-prompt-title">
                    Ready to Get Started?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4" data-testid="text-enroll-prompt-description">
                    Log in to enroll in the Tech Goes Home program and start earning your rewards!
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = '/api/login'}
                    data-testid="button-login-to-enroll"
                  >
                    Log In to Enroll
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card data-testid="card-requirements">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-requirements-title">
                  <Clock className="h-5 w-5 text-primary" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start gap-2" data-testid="requirement-attendance">
                  <span className="text-primary mt-0.5">1.</span>
                  <span>Complete at least 15 hours of training to receive the rewards</span>
                </div>
                <div className="flex items-start gap-2" data-testid="requirement-makeup">
                  <span className="text-primary mt-0.5">2.</span>
                  <span>Attend all sessions or make-up sessions to complete the required hours</span>
                </div>
                <div className="flex items-start gap-2" data-testid="requirement-eligibility">
                  <span className="text-primary mt-0.5">3.</span>
                  <span>Must NOT have participated in TGH program in the last 2 years</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-contact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-contact-title">
                  <Users className="h-5 w-5 text-primary" />
                  Questions?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p data-testid="text-contact-description">Talk to your teacher or contact us:</p>
                <p className="font-medium" data-testid="text-contact-phone">
                  Phone: (617) 269-6663
                </p>
                <p className="font-medium" data-testid="text-contact-email">
                  Email: speckham@juliesfamily.org
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
