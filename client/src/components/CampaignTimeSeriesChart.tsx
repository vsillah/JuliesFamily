import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CampaignTimeSeriesChartProps {
  campaignId: string;
  defaultMetric?: 'opens' | 'clicks' | 'sends';
  defaultInterval?: 'hour' | 'day' | 'week';
}

interface TimeSeriesDataPoint {
  timestamp: string;
  count: number;
}

export default function CampaignTimeSeriesChart({
  campaignId,
  defaultMetric = 'opens',
  defaultInterval = 'day'
}: CampaignTimeSeriesChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'opens' | 'clicks' | 'sends'>(defaultMetric);
  const [selectedInterval, setSelectedInterval] = useState<'hour' | 'day' | 'week'>(defaultInterval);
  const { toast } = useToast();

  // Fetch time-series data
  const { data: timeSeriesData, isLoading } = useQuery<TimeSeriesDataPoint[]>({
    queryKey: ['/api/email-campaigns', campaignId, 'time-series', selectedMetric, selectedInterval],
    queryFn: async () => {
      const params = new URLSearchParams({
        metric: selectedMetric,
        interval: selectedInterval
      });
      return await apiRequest('GET', `/api/email-campaigns/${campaignId}/time-series?${params}`);
    },
    enabled: !!campaignId,
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to load chart data",
        description: "Unable to fetch time-series analytics. Please try again.",
      });
      console.error("Time-series fetch error:", error);
    }
  });

  // Format timestamp based on interval
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      switch (selectedInterval) {
        case 'hour':
          return format(date, 'MMM d, h:mm a');
        case 'day':
          return format(date, 'MMM d');
        case 'week':
          return format(date, 'MMM d, yyyy');
        default:
          return format(date, 'MMM d');
      }
    } catch (error) {
      return timestamp;
    }
  };

  // Prepare chart data
  const chartData = timeSeriesData?.map(point => ({
    timestamp: point.timestamp,
    formattedTime: formatTimestamp(point.timestamp),
    count: point.count
  })) || [];

  // Get metric display name
  const getMetricLabel = (metric: string) => {
    const labels = {
      opens: 'Opens',
      clicks: 'Clicks',
      sends: 'Sends'
    };
    return labels[metric as keyof typeof labels] || metric;
  };

  return (
    <Card data-testid="container-time-series-chart">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Engagement Over Time
            </CardTitle>
            <CardDescription>
              View {getMetricLabel(selectedMetric).toLowerCase()} trends across your campaign timeline
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Metric Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Metric:</span>
              <ToggleGroup 
                type="single" 
                value={selectedMetric} 
                onValueChange={(value) => value && setSelectedMetric(value as 'opens' | 'clicks' | 'sends')}
                data-testid="toggle-group-metric"
              >
                <ToggleGroupItem value="opens" data-testid="toggle-metric-opens">
                  Opens
                </ToggleGroupItem>
                <ToggleGroupItem value="clicks" data-testid="toggle-metric-clicks">
                  Clicks
                </ToggleGroupItem>
                <ToggleGroupItem value="sends" data-testid="toggle-metric-sends">
                  Sends
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Interval Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Interval:</span>
              <ToggleGroup 
                type="single" 
                value={selectedInterval} 
                onValueChange={(value) => value && setSelectedInterval(value as 'hour' | 'day' | 'week')}
                data-testid="toggle-group-interval"
              >
                <ToggleGroupItem value="hour" data-testid="toggle-interval-hour">
                  Hour
                </ToggleGroupItem>
                <ToggleGroupItem value="day" data-testid="toggle-interval-day">
                  Day
                </ToggleGroupItem>
                <ToggleGroupItem value="week" data-testid="toggle-interval-week">
                  Week
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        ) : !chartData || chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Activity className="w-16 h-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Activity Data</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No {getMetricLabel(selectedMetric).toLowerCase()} recorded for the selected time interval. 
                  Data will appear as campaign activity increases.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-80" data-testid="chart-area-time-series">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedTime" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-1">{data.formattedTime}</p>
                          <p className="text-sm text-muted-foreground">
                            {getMetricLabel(selectedMetric)}: <span className="font-semibold text-foreground">{data.count}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorCount)"
                  name={getMetricLabel(selectedMetric)}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
