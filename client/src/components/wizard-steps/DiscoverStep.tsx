import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingDown, TrendingUp, Target, Sparkles } from "lucide-react";
import type { TestType } from "../ABTestWizard";

interface PerformanceMetrics {
  personaMetrics: {
    persona: string;
    leadCount: number;
    avgEngagementScore: number;
    conversionRate: number;
  }[];
  funnelStageMetrics: {
    funnelStage: string;
    leadCount: number;
    avgEngagementScore: number;
  }[];
  contentPerformance: {
    type: string;
    totalItems: number;
    activeItems: number;
    avgViews: number;
  }[];
  recommendations: {
    type: string;
    reason: string;
    suggestedTest: string;
    priority: "high" | "medium" | "low";
  }[];
}

interface DiscoverStepProps {
  onSelectRecommendation: (testType: TestType, reason: string) => void;
}

const personaLabels: Record<string, string> = {
  student: "Adult Education Student",
  provider: "Service Provider",
  parent: "Parent",
  donor: "Donor",
  volunteer: "Volunteer",
};

const funnelStageLabels: Record<string, string> = {
  awareness: "Awareness",
  consideration: "Consideration",
  decision: "Decision",
  retention: "Retention",
};

const testTypeLabels: Record<string, string> = {
  hero: "Hero Section",
  cta: "Call-to-Action",
  card_order: "Card Order",
  messaging: "Messaging",
  layout: "Layout",
};

export function DiscoverStep({ onSelectRecommendation }: DiscoverStepProps) {
  const { data: metrics, isLoading } = useQuery<PerformanceMetrics>({
    queryKey: ["/api/performance-metrics"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing your performance data...</p>
        </div>
      </div>
    );
  }

  const getEngagementBadge = (score: number) => {
    if (score >= 70) return { variant: "default" as const, label: "High", icon: TrendingUp };
    if (score >= 40) return { variant: "secondary" as const, label: "Medium", icon: Target };
    return { variant: "destructive" as const, label: "Low", icon: TrendingDown };
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "high") return { variant: "destructive" as const, color: "text-destructive" };
    if (priority === "medium") return { variant: "default" as const, color: "text-primary" };
    return { variant: "secondary" as const, color: "text-muted-foreground" };
  };

  return (
    <div className="space-y-6">
      {/* Recommendations Section */}
      {metrics?.recommendations && metrics.recommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Smart Recommendations</CardTitle>
            </div>
            <CardDescription>
              Based on your current performance, we suggest these high-impact tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recommendations.map((rec, index) => {
                const priorityBadge = getPriorityBadge(rec.priority);
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-background rounded-lg border"
                    data-testid={`recommendation-${index}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={priorityBadge.variant} className="capitalize">
                          {rec.priority} Priority
                        </Badge>
                        <span className="text-sm font-medium">
                          {testTypeLabels[rec.type] || rec.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                      <p className="text-sm font-medium">{rec.suggestedTest}</p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onSelectRecommendation(rec.type as TestType, rec.suggestedTest)}
                      data-testid={`button-select-recommendation-${index}`}
                    >
                      Start This Test
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Test Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Or Browse All Test Types</CardTitle>
          <CardDescription>
            Not interested in recommendations? Choose any test type to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(testTypeLabels).map(([type, label]) => (
              <Button
                key={type}
                variant="outline"
                className="justify-start"
                onClick={() => onSelectRecommendation(type as TestType, `Test ${label}`)}
                data-testid={`button-test-type-${type}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Persona Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Persona Performance</CardTitle>
            <CardDescription>Engagement and conversion by visitor type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.personaMetrics && metrics.personaMetrics.length > 0 ? (
                metrics.personaMetrics.map((metric) => {
                  const badge = getEngagementBadge(metric.avgEngagementScore);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={metric.persona}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                      data-testid={`persona-metric-${metric.persona}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {personaLabels[metric.persona] || metric.persona}
                          </span>
                          <Badge variant={badge.variant} className="flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{metric.leadCount} leads</span>
                          <span>{metric.avgEngagementScore.toFixed(0)}% engagement</span>
                          <span>{metric.conversionRate.toFixed(1)}% converted</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No persona data available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Funnel Stage Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funnel Stage Performance</CardTitle>
            <CardDescription>Engagement across the visitor journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.funnelStageMetrics && metrics.funnelStageMetrics.length > 0 ? (
                metrics.funnelStageMetrics.map((metric) => {
                  const badge = getEngagementBadge(metric.avgEngagementScore);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={metric.funnelStage}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                      data-testid={`funnel-metric-${metric.funnelStage}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {funnelStageLabels[metric.funnelStage] || metric.funnelStage}
                          </span>
                          <Badge variant={badge.variant} className="flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{metric.leadCount} leads</span>
                          <span>{metric.avgEngagementScore.toFixed(0)}% engagement</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No funnel stage data available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Overview</CardTitle>
          <CardDescription>Your published content across different types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics?.contentPerformance.map((content) => (
              <div
                key={content.type}
                className="text-center p-4 bg-muted/30 rounded-md"
                data-testid={`content-${content.type}`}
              >
                <div className="text-2xl font-bold text-primary">{content.activeItems}</div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">
                  Active {content.type}s
                </div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  of {content.totalItems} total
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
