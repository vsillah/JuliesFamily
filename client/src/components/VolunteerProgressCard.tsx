import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Calendar, Users } from "lucide-react";
import { Link } from "wouter";

interface VolunteerDashboardCardContent {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  goalText?: string;
  motivationalText?: string;
}

interface VolunteerProgressCardProps {
  mode: "demo" | "summary";
  data?: {
    totalHours: number;
    activeEnrollments: number;
  };
  content?: VolunteerDashboardCardContent;
  showGetStartedButton?: boolean;
}

export function VolunteerProgressCard({ 
  mode, 
  data,
  content,
  showGetStartedButton = false
}: VolunteerProgressCardProps) {
  const totalHours = data?.totalHours || 0;
  const activeEnrollments = data?.activeEnrollments || 0;
  
  // Default content values for fallback
  const defaultContent: VolunteerDashboardCardContent = {
    title: "My Volunteer Journey",
    description: "Track your impact and commitment",
    buttonText: "View My Dashboard",
    buttonLink: "/volunteer",
    goalText: "Goal: 20+ hours this quarter"
  };
  
  // Merge provided content with defaults
  const cardContent: VolunteerDashboardCardContent = {
    ...defaultContent,
    ...content
  };
  
  // Motivational message based on hours
  const getMotivationalMessage = () => {
    if (totalHours === 0) return "Ready to make a difference? Join us!";
    if (totalHours < 5) return "Great start! Every hour matters!";
    if (totalHours < 10) return "You're making a real difference!";
    if (totalHours < 20) return "Amazing dedication! Keep it up!";
    if (totalHours < 50) return "You're a volunteer champion!";
    return "Thank you for your incredible commitment!";
  };

  // Demo stats for public view
  const demoStats = {
    totalHours: 15,
    activeEnrollments: 2
  };

  if (mode === "demo") {
    return (
      <Card className="overflow-hidden" data-testid="card-volunteer-demo">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2" data-testid="text-volunteer-title">
            <Heart className="h-6 w-6 text-primary" />
            {cardContent.title}
          </CardTitle>
          <CardDescription data-testid="text-volunteer-description">
            {cardContent.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-4 rounded-md bg-secondary/30">
                <Clock className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold" data-testid="text-demo-hours">
                  {demoStats.totalHours}
                </span>
                <span className="text-xs text-muted-foreground text-center">Total Hours</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-md bg-secondary/30">
                <Calendar className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold" data-testid="text-demo-enrollments">
                  {demoStats.activeEnrollments}
                </span>
                <span className="text-xs text-muted-foreground text-center">Active Programs</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
              <Users className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Join our community of dedicated volunteers making a real difference in family education
              </p>
            </div>
          </div>
        </CardContent>
        {showGetStartedButton && (
          <CardFooter className="bg-secondary/20 border-t">
            <Link href={cardContent.buttonLink} className="w-full">
              <Button 
                className="w-full" 
                data-testid="button-get-started"
              >
                {cardContent.buttonText}
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    );
  }

  if (mode === "summary") {
    return (
      <Card className="overflow-hidden hover-elevate" data-testid="card-volunteer-summary">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2" data-testid="text-volunteer-title">
              <Heart className="h-6 w-6 text-primary" />
              {cardContent.title}
            </CardTitle>
            {cardContent.goalText && (
              <Badge variant="secondary" data-testid="badge-hours-goal">
                {cardContent.goalText}
              </Badge>
            )}
          </div>
          <CardDescription data-testid="text-motivation">
            {cardContent.motivationalText || getMotivationalMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-4 rounded-md bg-secondary/30">
                <Clock className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold" data-testid="text-total-hours">
                  {totalHours}
                </span>
                <span className="text-xs text-muted-foreground text-center">Total Hours</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-md bg-secondary/30">
                <Calendar className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold" data-testid="text-active-enrollments">
                  {activeEnrollments}
                </span>
                <span className="text-xs text-muted-foreground text-center">Active Programs</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-secondary/20 border-t" data-testid="footer-volunteer-summary">
          <Link href={cardContent.buttonLink} className="w-full" data-testid="link-view-dashboard">
            <Button className="w-full" data-testid="button-view-dashboard">
              {cardContent.buttonText}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return null;
}
