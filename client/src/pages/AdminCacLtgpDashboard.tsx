import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, DollarSign, Users, Target, BarChart3, ArrowUpRight, ArrowDownRight, Calendar
} from "lucide-react";
import { useLocation, Link } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

interface CACLTGPOverview {
  totalChannels: number;
  totalCampaigns: number;
  totalSpend: number;
  totalLeads: number;
  totalDonors: number;
  avgLTGP: number;
  avgCAC: number;
  avgRatio: number;
  topChannels: Array<{
    channelId: string;
    channelName: string;
    spend: number;
    leads: number;
    donors: number;
    cac: number;
    ltgp: number;
    ratio: number;
  }>;
}

interface ChannelPerformance {
  channelId: string;
  channelName: string;
  totalSpend: number;
  totalLeads: number;
  totalDonors: number;
  avgCostPerLead: number;
  avgCostPerDonor: number;
  avgDonorLTGP: number;
  ltgpToCacRatio: number;
  campaigns: number;
}

export default function AdminCacLtgpDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch overview data
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery<CACLTGPOverview>({
    queryKey: ["/api/admin/cac-ltgp/overview"],
    retry: false,
  });

  // Fetch channel performance
  const { data: channels = [], isLoading: channelsLoading, error: channelsError } = useQuery<ChannelPerformance[]>({
    queryKey: ["/api/admin/cac-ltgp/channels"],
    retry: false,
  });

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  // Show loading state
  if (overviewLoading || channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-state">
        <div className="text-lg">Loading CAC:LTGP analytics...</div>
      </div>
    );
  }

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper to format ratio (handle NaN/Infinity)
  const formatRatio = (value: number) => {
    if (!isFinite(value) || isNaN(value)) {
      return "N/A";
    }
    return `${value.toFixed(2)}:1`;
  };

  // Determine ratio health color
  const getRatioColor = (ratio: number) => {
    if (!isFinite(ratio) || isNaN(ratio)) return "text-muted-foreground";
    if (ratio >= 5) return "text-green-600 dark:text-green-400";
    if (ratio >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Determine ratio badge variant
  const getRatioBadgeVariant = (ratio: number): "default" | "secondary" | "destructive" => {
    if (!isFinite(ratio) || isNaN(ratio)) return "secondary";
    if (ratio >= 5) return "default";
    if (ratio >= 3) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <div className="relative bg-muted/30 border-b">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumbs items={[
            { label: "Admin Dashboard", href: "/admin" },
            { label: "CAC:LTGP Analytics" }
          ]} />
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold" data-testid="page-title">
                  CAC:LTGP Analytics Dashboard
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg mt-2">
                  Track donor acquisition economics and lifetime value metrics
                </p>
              </div>
              <Link href="/admin/cohort-analysis">
                <Button variant="outline" size="sm" data-testid="button-cohort-analysis">
                  <Calendar className="w-4 h-4 mr-2" />
                  Cohort Analysis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error States */}
        {(overviewError || channelsError) && (
          <Card className="mb-8 border-destructive" data-testid="card-error">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {overviewError ? "Failed to load overview data. " : ""}
                {channelsError ? "Failed to load channel data. " : ""}
                Please try refreshing the page or contact support if the issue persists.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-spend">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-spend">
                {formatCurrency(overview?.totalSpend || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {overview?.totalChannels || 0} channels
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-donors">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-donors">
                {overview?.totalDonors || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {overview?.totalLeads || 0} leads
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-cac">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg CAC</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-cac">
                {formatCurrency(overview?.avgCAC || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cost per donor acquired
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-ltgp-ratio">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg LTGP:CAC</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRatioColor(overview?.avgRatio || 0)}`} data-testid="text-avg-ratio">
                {formatRatio(overview?.avgRatio || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Target: 5:1 or higher
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Channels */}
        <Card className="mb-8" data-testid="card-top-channels">
          <CardHeader>
            <CardTitle>Top Performing Channels</CardTitle>
            <CardDescription>
              Channels ranked by LTGP:CAC ratio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overview?.topChannels && overview.topChannels.length > 0 ? (
                overview.topChannels.map((channel, index) => (
                  <div
                    key={channel.channelId}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`channel-${channel.channelId}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                        <div>
                          <h3 className="font-semibold" data-testid={`text-channel-name-${channel.channelId}`}>
                            {channel.channelName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {channel.donors} donors from {channel.leads} leads
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Spend</p>
                        <p className="font-semibold" data-testid={`text-channel-spend-${channel.channelId}`}>
                          {formatCurrency(channel.spend)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">CAC</p>
                        <p className="font-semibold" data-testid={`text-channel-cac-${channel.channelId}`}>
                          {formatCurrency(channel.cac)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">LTGP</p>
                        <p className="font-semibold" data-testid={`text-channel-ltgp-${channel.channelId}`}>
                          {formatCurrency(channel.ltgp)}
                        </p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-sm text-muted-foreground">Ratio</p>
                        <Badge
                          variant={getRatioBadgeVariant(channel.ratio)}
                          className="font-mono"
                          data-testid={`badge-channel-ratio-${channel.channelId}`}
                        >
                          {formatRatio(channel.ratio)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8" data-testid="text-no-channels">
                  No channel data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Channel Performance Chart */}
        {channels.length > 0 && (
          <Card className="mb-8" data-testid="card-channel-chart">
            <CardHeader>
              <CardTitle>Channel Performance Comparison</CardTitle>
              <CardDescription>
                CAC vs LTGP across all channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={channels}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channelName" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="avgCostPerDonor" fill="hsl(var(--destructive))" name="CAC" />
                  <Bar dataKey="avgDonorLTGP" fill="hsl(var(--primary))" name="LTGP" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* All Channels Table */}
        <Card data-testid="card-all-channels">
          <CardHeader>
            <CardTitle>All Channels</CardTitle>
            <CardDescription>
              Complete breakdown of channel performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Channel</th>
                    <th className="text-right p-3 font-semibold">Campaigns</th>
                    <th className="text-right p-3 font-semibold">Spend</th>
                    <th className="text-right p-3 font-semibold">Leads</th>
                    <th className="text-right p-3 font-semibold">Donors</th>
                    <th className="text-right p-3 font-semibold">CAC</th>
                    <th className="text-right p-3 font-semibold">LTGP</th>
                    <th className="text-right p-3 font-semibold">Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.length > 0 ? (
                    channels.map((channel) => (
                      <tr
                        key={channel.channelId}
                        className="border-b hover-elevate"
                        data-testid={`row-channel-${channel.channelId}`}
                      >
                        <td className="p-3 font-medium" data-testid={`text-table-channel-name-${channel.channelId}`}>
                          {channel.channelName}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-table-campaigns-${channel.channelId}`}>
                          {channel.campaigns}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-table-spend-${channel.channelId}`}>
                          {formatCurrency(channel.totalSpend)}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-table-leads-${channel.channelId}`}>
                          {channel.totalLeads}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-table-donors-${channel.channelId}`}>
                          {channel.totalDonors}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-table-cac-${channel.channelId}`}>
                          {formatCurrency(channel.avgCostPerDonor)}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-table-ltgp-${channel.channelId}`}>
                          {formatCurrency(channel.avgDonorLTGP)}
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            variant={getRatioBadgeVariant(channel.ltgpToCacRatio)}
                            className="font-mono"
                            data-testid={`badge-table-ratio-${channel.channelId}`}
                          >
                            {formatRatio(channel.ltgpToCacRatio)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground" data-testid="text-no-channels-table">
                        No channel data available yet. Create channels to start tracking CAC:LTGP metrics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
