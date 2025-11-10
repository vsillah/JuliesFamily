import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Laptop, Award, Wifi, CheckCircle2, Circle } from "lucide-react";
import { Link } from "wouter";

interface TechGoesHomeProgressCardProps {
  mode: "demo" | "summary" | "full";
  data?: {
    enrolled: boolean;
    classesCompleted: number;
    classesRemaining: number;
    hoursCompleted: number;
    percentComplete: number;
    isEligibleForRewards: boolean;
    totalClassesRequired?: number;
    enrollment?: {
      certificateIssued?: boolean;
      chromebookReceived?: boolean;
      internetActivated?: boolean;
    };
  };
  onEnroll?: () => void;
  showEnrollButton?: boolean;
}

export function TechGoesHomeProgressCard({ 
  mode, 
  data,
  onEnroll,
  showEnrollButton = false
}: TechGoesHomeProgressCardProps) {
  const totalRequired = data?.totalClassesRequired || 15;
  const completed = data?.classesCompleted || 0;
  const remaining = data?.classesRemaining || totalRequired;
  const percent = data?.percentComplete || 0;
  const eligible = data?.isEligibleForRewards || false;
  
  // Reward items
  const rewards = [
    {
      icon: Laptop,
      name: "Free Chromebook",
      received: data?.enrollment?.chromebookReceived || false,
      eligible: eligible
    },
    {
      icon: Award,
      name: "Certificate",
      received: data?.enrollment?.certificateIssued || false,
      eligible: eligible
    },
    {
      icon: Wifi,
      name: "1 Year Free Internet",
      received: data?.enrollment?.internetActivated || false,
      eligible: eligible
    }
  ];

  // Motivational message based on progress
  const getMotivationalMessage = () => {
    if (percent === 0) return "Let's get started on your journey!";
    if (percent < 25) return "Great start! Keep it up!";
    if (percent < 50) return "You're making excellent progress!";
    if (percent < 75) return "More than halfway there! Keep going!";
    if (percent < 100) return "Almost there! Just a few more classes!";
    return "Congratulations! You've completed the program!";
  };

  if (mode === "demo") {
    return (
      <Card className="overflow-hidden" data-testid="card-tgh-demo">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2" data-testid="text-tgh-title">
            <Laptop className="h-6 w-6 text-primary" />
            Tech Goes Home
          </CardTitle>
          <CardDescription data-testid="text-tgh-description">
            Complete 15 classes to earn your rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" data-testid="text-progress-label">
                  {completed} of {totalRequired} classes completed
                </span>
                <span className="text-sm text-muted-foreground" data-testid="text-progress-percent">
                  {percent}%
                </span>
              </div>
              <Progress value={percent} className="h-3" data-testid="progress-bar" />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {rewards.map((reward) => {
                const Icon = reward.icon;
                return (
                  <div 
                    key={reward.name}
                    className="flex flex-col items-center gap-1 p-2 rounded-md bg-secondary/30"
                    data-testid={`reward-${reward.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className={`h-5 w-5 ${reward.eligible ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs text-center text-muted-foreground">{reward.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        {showEnrollButton && (
          <CardFooter className="bg-secondary/20 border-t">
            <Button 
              className="w-full" 
              onClick={onEnroll}
              data-testid="button-enroll"
            >
              Enroll in Tech Goes Home
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  if (mode === "summary") {
    return (
      <Card className="overflow-hidden hover-elevate" data-testid="card-tgh-summary">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2" data-testid="text-tgh-title">
              <Laptop className="h-6 w-6 text-primary" />
              My Progress
            </CardTitle>
            <Badge variant="secondary" data-testid="badge-classes-remaining">
              {remaining} classes left
            </Badge>
          </div>
          <CardDescription data-testid="text-motivation">{getMotivationalMessage()}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" data-testid="text-progress-label">
                  Progress
                </span>
                <span className="text-sm text-muted-foreground" data-testid="text-progress-percent">
                  {percent}%
                </span>
              </div>
              <Progress value={percent} className="h-3" data-testid="progress-bar" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-secondary/20 border-t">
          <Button variant="outline" className="w-full" asChild data-testid="button-view-details">
            <Link href="/student/tech-goes-home">
              View Full Details
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // mode === "full"
  return (
    <Card className="overflow-hidden" data-testid="card-tgh-full">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2" data-testid="text-tgh-title">
          <Laptop className="h-6 w-6 text-primary" />
          Tech Goes Home - Full Progress
        </CardTitle>
        <CardDescription data-testid="text-motivation">{getMotivationalMessage()}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold" data-testid="text-progress-label">
              Class Completion
            </span>
            <Badge 
              variant={eligible ? "default" : "secondary"}
              data-testid="badge-status"
            >
              {eligible ? "Eligible for Rewards!" : `${remaining} classes remaining`}
            </Badge>
          </div>
          <Progress value={percent} className="h-4" data-testid="progress-bar" />
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
            <span data-testid="text-classes-completed">{completed} of {totalRequired} classes completed</span>
            <span data-testid="text-progress-percent">{percent}%</span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-base" data-testid="text-rewards-title">Your Rewards</h3>
          <div className="space-y-3">
            {rewards.map((reward) => {
              const Icon = reward.icon;
              const isReceived = reward.received;
              const isEligible = reward.eligible;
              
              return (
                <div 
                  key={reward.name}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  data-testid={`reward-item-${reward.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className={`p-2 rounded-full ${isEligible ? 'bg-primary/10' : 'bg-secondary'}`}>
                    <Icon className={`h-5 w-5 ${isEligible ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium" data-testid={`text-reward-name-${reward.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      {reward.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-reward-status-${reward.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      {isReceived ? "Received" : isEligible ? "Ready to claim" : `Complete ${totalRequired} classes to earn`}
                    </p>
                  </div>
                  {isReceived ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" data-testid={`icon-received-${reward.name.toLowerCase().replace(/\s+/g, '-')}`} />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" data-testid={`icon-pending-${reward.name.toLowerCase().replace(/\s+/g, '-')}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {eligible && !rewards.every(r => r.received) && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium text-primary" data-testid="text-claim-instructions">
              Congratulations! Contact your instructor to claim your rewards.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
