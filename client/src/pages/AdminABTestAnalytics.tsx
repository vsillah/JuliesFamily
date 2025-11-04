import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, TrendingUp, Users, Target, CheckCircle2, Eye,
  Activity, Percent, BarChart3
} from "lucide-react";
import { useLocation, Link } from "wouter";
import type { AbTest, AbTestVariant } from "@shared/schema";
import Breadcrumbs from "@/components/Breadcrumbs";

interface AnalyticsData {
  variantId: string;
  variantName: string;
  totalViews: number;
  uniqueViews: number;
  totalEvents: number;
  conversionRate: number;
}

export default function AdminABTestAnalytics() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  
  // Extract test ID from URL path
  const testId = location.split("/").pop();

  // Fetch test details
  const { data: test, isLoading: testLoading } = useQuery<AbTest>({
    queryKey: [`/api/ab-tests/${testId}`],
    enabled: !!testId,
    retry: false,
  });

  // Fetch test variants
  const { data: variants = [], isLoading: variantsLoading } = useQuery<AbTestVariant[]>({
    queryKey: [`/api/ab-tests/${testId}/variants`],
    enabled: !!testId,
    retry: false,
  });

  // Fetch analytics data
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery<AnalyticsData[]>({
    queryKey: [`/api/ab-tests/${testId}/analytics`],
    enabled: !!testId,
    retry: false,
  });

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  if (testLoading || variantsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
          <Link href="/admin/ab-testing">
            <Button>Back to A/B Testing</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate statistical insights
  const totalViews = analytics.reduce((sum, v) => sum + v.uniqueViews, 0);
  const totalEvents = analytics.reduce((sum, v) => sum + v.totalEvents, 0);
  const controlVariant = analytics.find(v => {
    const variant = variants.find(vr => vr.id === v.variantId);
    return variant?.isControl;
  });
  const bestPerformer = analytics.reduce((best, current) => 
    current.conversionRate > best.conversionRate ? current : best
  , analytics[0] || { variantName: "N/A", conversionRate: 0 });

  // Calculate improvement over control
  const getImprovement = (rate: number) => {
    if (!controlVariant || controlVariant.conversionRate === 0) return null;
    const improvement = ((rate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100;
    return improvement;
  };

  // Statistical significance calculation using two-tailed z-test
  const getConfidence = (variant: AnalyticsData) => {
    if (!controlVariant || variant.uniqueViews < 30 || controlVariant.uniqueViews < 30) {
      return { isSignificant: false, confidence: 0 };
    }

    const p1 = variant.conversionRate / 100;
    const p2 = controlVariant.conversionRate / 100;
    const n1 = variant.uniqueViews;
    const n2 = controlVariant.uniqueViews;

    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
    
    if (se === 0) return { isSignificant: false, confidence: 0 };
    
    const z = Math.abs(p1 - p2) / se;
    
    // Calculate two-tailed p-value from z-score using approximation
    // Abramowitz and Stegun approximation for cumulative distribution function
    const zToPValue = (zScore: number): number => {
      const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
      const d = 0.3989423 * Math.exp(-zScore * zScore / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      
      // Two-tailed p-value
      return 2 * p;
    };
    
    const pValue = zToPValue(z);
    const confidence = (1 - pValue) * 100;
    
    return {
      isSignificant: z >= 1.96, // 95% confidence threshold (two-tailed)
      confidence: Math.max(0, Math.min(99.9, Math.round(confidence * 10) / 10)), // Cap at 99.9% and round to 1 decimal
    };
  };

  const statusColors: Record<string, string> = {
    draft: "bg-secondary",
    active: "bg-primary",
    paused: "bg-muted",
    completed: "bg-secondary",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[
            { label: "Admin Dashboard", href: "/admin" },
            { label: "A/B Testing", href: "/admin/ab-testing" },
            { label: test.name || "Analytics" }
          ]} />
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/ab-testing">
                <Button variant="ghost" className="mb-4" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tests
                </Button>
              </Link>
              <h1 className="text-3xl font-serif font-bold text-primary">{test.name}</h1>
              <p className="text-muted-foreground mt-2">
                {test.description || "No description provided"}
              </p>
              <div className="flex gap-2 mt-4">
                <Badge className={statusColors[test.status]}>{test.status}</Badge>
                <Badge variant="outline">{test.type}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">Unique sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents}</div>
              <p className="text-xs text-muted-foreground">All variants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bestPerformer.variantName}</div>
              <p className="text-xs text-muted-foreground">
                {bestPerformer.conversionRate.toFixed(2)}% conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variants</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{variants.length}</div>
              <p className="text-xs text-muted-foreground">Being tested</p>
            </CardContent>
          </Card>
        </div>

        {/* Variant Performance Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Variant Performance</CardTitle>
            <CardDescription>
              Detailed conversion metrics for each test variant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No data collected yet. Start the test and wait for visitors.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {analytics.map((variant) => {
                  const variantDetails = variants.find(v => v.id === variant.variantId);
                  const improvement = getImprovement(variant.conversionRate);
                  const confidence = getConfidence(variant);
                  const isControl = variantDetails?.isControl || false;

                  return (
                    <div key={variant.variantId} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{variant.variantName}</h3>
                            {isControl && <Badge variant="secondary">Control</Badge>}
                            {confidence.isSignificant && (
                              <Badge variant="default">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {confidence.confidence}% Confident
                              </Badge>
                            )}
                          </div>
                          {variantDetails?.description && (
                            <p className="text-sm text-muted-foreground">
                              {variantDetails.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{variant.conversionRate.toFixed(2)}%</div>
                          <div className="text-xs text-muted-foreground">Conversion Rate</div>
                          {improvement !== null && !isControl && (
                            <div className={`text-sm font-medium mt-1 ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}% vs Control
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Eye className="w-3 h-3" />
                            Unique Views
                          </div>
                          <div className="text-xl font-semibold">{variant.uniqueViews}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Activity className="w-3 h-3" />
                            Total Views
                          </div>
                          <div className="text-xl font-semibold">{variant.totalViews}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Target className="w-3 h-3" />
                            Conversions
                          </div>
                          <div className="text-xl font-semibold">{variant.totalEvents}</div>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                          <span>Conversion Progress</span>
                          <span>{variant.totalEvents} / {variant.uniqueViews}</span>
                        </div>
                        <Progress value={variant.conversionRate} className="h-2" />
                      </div>

                      {/* Traffic Weight */}
                      {variantDetails && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Percent className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Traffic Weight:</span>
                            <span className="font-medium">{variantDetails.trafficWeight}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistical Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Statistical Notes</CardTitle>
            <CardDescription>Understanding your test results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Sample Size</h4>
              <p className="text-sm text-muted-foreground">
                For reliable results, aim for at least 100 visitors per variant. 
                Current sample size: {totalViews} total visitors across {variants.length} variants.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Statistical Significance</h4>
              <p className="text-sm text-muted-foreground">
                Results are marked as statistically significant when we're 95% confident 
                the difference isn't due to random chance. Variants need at least 30 visitors 
                each for significance testing.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Let tests run until you reach statistical significance</li>
                <li>Don't stop tests early based on initial positive results</li>
                <li>Consider external factors (seasonality, marketing campaigns)</li>
                <li>Test one element at a time for clearer insights</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
