import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useHistoricalTestResults, type HistoricalTestResults as HistoricalTestResultsType } from "@/hooks/useABTestBaseline";

interface HistoricalTestResultsProps {
  persona?: string;
  funnelStage?: string;
  testType?: string;
}

export function HistoricalTestResults({ persona, funnelStage, testType }: HistoricalTestResultsProps) {
  const enabled = !!(persona && funnelStage && testType);
  const { data: results, isLoading, error } = useHistoricalTestResults(
    persona,
    funnelStage,
    testType,
    enabled
  );

  if (!enabled) {
    return (
      <Card className="bg-muted/20" data-testid="card-historical-results-disabled">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <CardTitle className="text-sm font-medium">Historical Test Results</CardTitle>
              <CardDescription className="text-xs">
                Select a baseline reference above to view past A/B test performance for this combination.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-muted/20" data-testid="card-historical-results-loading">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Historical Test Results</CardTitle>
          <CardDescription className="text-xs">
            Loading past A/B test performance...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" data-testid="skeleton-result-1" />
          <Skeleton className="h-4 w-3/4" data-testid="skeleton-result-2" />
          <Skeleton className="h-4 w-1/2" data-testid="skeleton-result-3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/5 border-destructive/20" data-testid="card-historical-results-error">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
            <div>
              <CardTitle className="text-sm font-medium text-destructive">Unable to Load Historical Results</CardTitle>
              <CardDescription className="text-xs">
                Could not fetch past A/B test performance data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="bg-muted/20" data-testid="card-historical-results-empty">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Historical Test Results</CardTitle>
          <CardDescription className="text-xs">
            No previous A/B tests found for this combination.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isPositive = results.improvementPercent > 0;
  const isHighConfidence = results.confidence >= 95;
  const confidenceColor = isHighConfidence ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400";

  return (
    <Card className="bg-muted/20 border-primary/20" data-testid="card-historical-results-success">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">Historical Test Results</CardTitle>
            <CardDescription className="text-xs mt-1">
              Most recent A/B test: <span className="font-medium" data-testid="text-test-name">{results.testName}</span>
            </CardDescription>
          </div>
          <Badge variant={isPositive ? "default" : "secondary"} className="text-xs" data-testid="badge-test-date">
            {results.endDate ? new Date(results.endDate).toLocaleDateString() : 'Ongoing'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Control Conversion</p>
            <p className="text-sm font-semibold" data-testid="text-control-conversion">{(results.controlConversionRate * 100).toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Winner Conversion</p>
            <p className="text-sm font-semibold" data-testid="text-winner-conversion">{(results.winnerConversionRate * 100).toFixed(2)}%</p>
          </div>
        </div>

        {/* Improvement and Confidence */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" data-testid="icon-trending-up" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" data-testid="icon-trending-down" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Improvement</p>
              <p className={`text-sm font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-improvement">
                {isPositive ? '+' : ''}{results.improvementPercent.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className={`text-sm font-semibold ${confidenceColor}`} data-testid="text-confidence">
              {results.confidence.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Sample Size */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Sample size: <span className="font-medium text-foreground" data-testid="text-sample-size">{results.sampleSize.toLocaleString()}</span> visitors
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
