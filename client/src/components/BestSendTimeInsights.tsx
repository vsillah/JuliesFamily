import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, BarChart3, AlertCircle } from "lucide-react";

interface SendTimeWindow {
  dayOfWeek: number;
  hourOfDay: number;
  openRate: number;
  sendCount: number;
  confidenceScore: number;
  liftPercent: number;
}

interface EmailSendTimeInsight {
  id: string;
  scope: string;
  scopeId: string | null;
  dayOfWeek: number;
  hourOfDay: number;
  sendCount: number;
  openCount: number;
  uniqueOpens: number;
  clickCount: number;
  openRate: number;
  clickRate: number;
  confidenceScore: number;
  medianTimeToOpen: number | null;
  analyzedAt: Date;
  metadata: Record<string, any>;
}

interface SendTimeInsights {
  insights: EmailSendTimeInsight[];
  topWindows: SendTimeWindow[];
  cacheAge: number | null;
}

interface BestSendTimeInsightsProps {
  scope: 'global' | 'campaign' | 'persona';
  scopeId?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHourRange(hour: number): string {
  const start = hour % 12 || 12;
  const end = (hour + 1) % 12 || 12;
  const startPeriod = hour < 12 ? 'AM' : 'PM';
  const endPeriod = (hour + 1) < 12 ? 'AM' : 'PM';
  
  if (startPeriod === endPeriod) {
    return `${start}-${end}${endPeriod}`;
  }
  return `${start}${startPeriod}-${end}${endPeriod}`;
}

function getConfidenceColor(score: number): string {
  if (score >= 70) return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
  if (score >= 40) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
  return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
}

function getConfidenceLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export default function BestSendTimeInsights({ scope, scopeId }: BestSendTimeInsightsProps) {
  const { data: insights, isLoading } = useQuery<SendTimeInsights>({
    queryKey: ['/api/email-insights/best-send-times', { scope, scopeId }],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card data-testid="card-send-time-insights-loading">
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">Analyzing send time patterns...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate baseline from first insight's metadata
  const baselineOpenRate = insights?.insights?.[0]?.metadata?.baselineOpenRate || 0;
  const baselineSendCount = insights?.insights?.[0]?.metadata?.baselineSendCount || 0;
  const daysStale = insights?.cacheAge ? Math.floor(insights.cacheAge / 24) : 0;
  const isLowVolume = baselineSendCount < 100;

  // Insufficient data fallback
  if (!insights || insights.topWindows.length === 0 || isLowVolume) {
    return (
      <Card data-testid="card-send-time-insights-insufficient">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground" data-testid="icon-insufficient-data" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold" data-testid="text-insufficient-title">
                Insufficient Data
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-insufficient-description">
                {isLowVolume 
                  ? `Not enough email activity to generate reliable send time recommendations. At least 100 sends are required for meaningful insights. Current: ${baselineSendCount} sends.`
                  : 'Send time insights will appear once enough email activity is recorded. Start sending emails to see when your audience is most engaged.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="container-send-time-insights">
      {/* Top Recommendation Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4" data-testid="text-recommendations-title">
          Best Send Times
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.topWindows.slice(0, 3).map((window, index) => (
            <Card key={`${window.dayOfWeek}-${window.hourOfDay}`} data-testid={`card-recommendation-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" data-testid={`text-rank-${index}`}>
                  #{index + 1} Best Time
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={getConfidenceColor(window.confidenceScore)}
                  data-testid={`badge-confidence-${index}`}
                >
                  {getConfidenceLabel(window.confidenceScore)} Confidence
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold" data-testid={`text-day-${index}`}>
                      {DAY_NAMES[window.dayOfWeek]}
                    </span>
                  </div>
                  <div className="text-2xl font-bold" data-testid={`text-time-${index}`}>
                    {formatHourRange(window.hourOfDay)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Open Rate</span>
                    <span className="font-semibold" data-testid={`text-open-rate-${index}`}>
                      {(window.openRate / 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  {window.liftPercent !== 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-sm font-medium text-green-600" data-testid={`text-lift-${index}`}>
                        {window.liftPercent > 0 ? '+' : ''}{window.liftPercent.toFixed(1)}% vs baseline
                      </span>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground" data-testid={`text-sample-size-${index}`}>
                    Based on {window.sendCount.toLocaleString()} sends
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Day × Hour Heatmap */}
      <Card data-testid="card-heatmap">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Send Time Heatmap
          </CardTitle>
          <CardDescription>
            Open rate by day of week and hour (America/New_York timezone)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SendTimeHeatmap insights={insights} />
        </CardContent>
      </Card>

      {/* Baseline Info */}
      <Card data-testid="card-baseline">
        <CardHeader>
          <CardTitle className="text-base">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Baseline Open Rate:</span>
            <span className="font-medium" data-testid="text-baseline-open-rate">
              {(baselineOpenRate / 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Emails Analyzed:</span>
            <span className="font-medium" data-testid="text-baseline-send-count">
              {baselineSendCount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Updated:</span>
            <span className="font-medium" data-testid="text-days-stale">
              {daysStale === 0 ? 'Today' : `${daysStale} ${daysStale === 1 ? 'day' : 'days'} ago`}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SendTimeHeatmap({ insights }: { insights: SendTimeInsights }) {
  // Build heatmap data structure
  const heatmapData: Record<string, number | null> = {};
  
  // Initialize all cells to null
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      heatmapData[`${day}-${hour}`] = null;
    }
  }
  
  // Populate with actual data
  insights.topWindows.forEach(window => {
    heatmapData[`${window.dayOfWeek}-${window.hourOfDay}`] = window.openRate;
  });
  
  // Find min/max for color scaling (only from non-null values)
  const validRates = Object.values(heatmapData).filter((rate): rate is number => rate !== null);
  const minRate = Math.min(...validRates);
  const maxRate = Math.max(...validRates);
  
  function getCellColor(rate: number | null): string {
    if (rate === null) {
      return 'bg-muted/50';
    }
    
    // Normalize to 0-1 range
    const normalized = (rate - minRate) / (maxRate - minRate || 1);
    
    // Color intensity: lighter (low) to darker (high)
    if (normalized >= 0.8) return 'bg-green-500 dark:bg-green-600';
    if (normalized >= 0.6) return 'bg-green-400 dark:bg-green-500';
    if (normalized >= 0.4) return 'bg-yellow-400 dark:bg-yellow-500';
    if (normalized >= 0.2) return 'bg-orange-400 dark:bg-orange-500';
    return 'bg-red-400 dark:bg-red-500';
  }
  
  function getCellTooltip(day: number, hour: number): string {
    const rate = heatmapData[`${day}-${hour}`];
    if (rate === null) {
      return `${DAY_NAMES[day]} ${formatHourRange(hour)}: No data`;
    }
    return `${DAY_NAMES[day]} ${formatHourRange(hour)}: ${(rate / 100).toFixed(1)}% open rate`;
  }
  
  return (
    <div className="overflow-x-auto" data-testid="container-heatmap-grid">
      <div className="min-w-[600px]">
        {/* Header Row - Hour Labels */}
        <div className="grid grid-cols-[80px_repeat(24,minmax(0,1fr))] gap-1 mb-2">
          <div className="text-xs font-medium text-muted-foreground"></div>
          {Array.from({ length: 24 }, (_, hour) => (
            <div 
              key={hour} 
              className="text-xs text-center text-muted-foreground"
              data-testid={`label-hour-${hour}`}
            >
              {hour % 6 === 0 ? hour : ''}
            </div>
          ))}
        </div>
        
        {/* Heatmap Grid */}
        <div className="space-y-1">
          {Array.from({ length: 7 }, (_, day) => (
            <div key={day} className="grid grid-cols-[80px_repeat(24,minmax(0,1fr))] gap-1">
              {/* Day Label */}
              <div 
                className="text-xs font-medium text-muted-foreground flex items-center"
                data-testid={`label-day-${day}`}
              >
                {DAY_ABBREV[day]}
              </div>
              
              {/* Hour Cells */}
              {Array.from({ length: 24 }, (_, hour) => {
                const rate = heatmapData[`${day}-${hour}`];
                return (
                  <div
                    key={hour}
                    className={`h-8 rounded-sm transition-colors ${getCellColor(rate)}`}
                    title={getCellTooltip(day, hour)}
                    data-testid={`cell-heatmap-${day}-${hour}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xs text-muted-foreground">Low</span>
          <div className="flex gap-1">
            <div className="w-6 h-4 bg-red-400 dark:bg-red-500 rounded-sm" data-testid="legend-color-low" />
            <div className="w-6 h-4 bg-orange-400 dark:bg-orange-500 rounded-sm" data-testid="legend-color-medium-low" />
            <div className="w-6 h-4 bg-yellow-400 dark:bg-yellow-500 rounded-sm" data-testid="legend-color-medium" />
            <div className="w-6 h-4 bg-green-400 dark:bg-green-500 rounded-sm" data-testid="legend-color-medium-high" />
            <div className="w-6 h-4 bg-green-500 dark:bg-green-600 rounded-sm" data-testid="legend-color-high" />
          </div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );
}
