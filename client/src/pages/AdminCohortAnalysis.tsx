import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Calendar, Users, Target, BarChart3
} from "lucide-react";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface CohortAnalysis {
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  spend: number;
  leadsAcquired: number;
  donorsAcquired: number;
  cac: number;
  currentLTGP: number;
  currentRatio: number;
  monthsActive: number;
}

export default function AdminCohortAnalysis() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [periodType, setPeriodType] = useState<'week' | 'month'>('month');

  // Fetch cohort data
  const { data: cohorts = [], isLoading, error } = useQuery<CohortAnalysis[]>({
    queryKey: ["/api/admin/cac-ltgp/cohorts", { periodType }],
    retry: false,
  });

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-state">
        <div className="text-lg">Loading cohort analysis...</div>
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

  // Helper to format ratio
  const formatRatio = (value: number) => {
    if (!isFinite(value) || isNaN(value)) {
      return "N/A";
    }
    return `${value.toFixed(2)}:1`;
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
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

  // Calculate aggregate metrics
  const totalSpend = cohorts.reduce((sum, c) => sum + c.spend, 0);
  const totalDonors = cohorts.reduce((sum, c) => sum + c.donorsAcquired, 0);
  const avgCAC = totalDonors > 0 ? totalSpend / totalDonors : 0;
  const avgLTGP = cohorts.length > 0 
    ? cohorts.reduce((sum, c) => sum + c.currentLTGP, 0) / cohorts.length 
    : 0;
  const avgRatio = cohorts.length > 0 
    ? cohorts.reduce((sum, c) => sum + c.currentRatio, 0) / cohorts.length 
    : 0;

  // Prepare chart data (reverse for chronological order)
  const chartData = [...cohorts].reverse().map(cohort => ({
    period: format(new Date(cohort.periodStart), periodType === 'week' ? 'MMM d' : 'MMM yyyy'),
    spend: cohort.spend,
    donors: cohort.donorsAcquired,
    cac: cohort.cac,
    ltgp: cohort.currentLTGP,
    ratio: cohort.currentRatio,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <div className="relative bg-muted/30 border-b">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumbs items={[
            { label: "Admin Dashboard", href: "/admin" },
            { label: "CAC:LTGP Analytics", href: "/admin/cac-ltgp" },
            { label: "Cohort Analysis" }
          ]} />
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold" data-testid="page-title">
                  Donor Cohort Analysis
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg mt-2">
                  Track donor performance by acquisition period
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={periodType === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriodType('week')}
                  data-testid="button-period-week"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Weekly
                </Button>
                <Button
                  variant={periodType === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriodType('month')}
                  data-testid="button-period-month"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Monthly
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <Card className="mb-8 border-destructive" data-testid="card-error">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Cohort Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Failed to load cohort analysis. Please try refreshing the page or contact support if the issue persists.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-spend">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-spend">
                {formatCurrency(totalSpend)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last {cohorts.length} {periodType === 'week' ? 'weeks' : 'months'}
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
                {totalDonors}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Acquired in period
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-cac">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg CAC</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-cac">
                {formatCurrency(avgCAC)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cost per donor
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-ratio">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg LTGP:CAC</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRatioColor(avgRatio)}`} data-testid="text-avg-ratio">
                {formatRatio(avgRatio)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* LTGP:CAC Ratio Trend Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8" data-testid="card-ratio-chart">
            <CardHeader>
              <CardTitle>LTGP:CAC Ratio Trend</CardTitle>
              <CardDescription>
                Track how cohort performance improves over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatRatio(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ratio" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="LTGP:CAC Ratio"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Donor Acquisition Trend */}
        {chartData.length > 0 && (
          <Card className="mb-8" data-testid="card-donors-chart">
            <CardHeader>
              <CardTitle>Donor Acquisition by Period</CardTitle>
              <CardDescription>
                Number of donors acquired and spend per period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="donors" fill="hsl(var(--primary))" name="Donors Acquired" />
                  <Bar yAxisId="right" dataKey="spend" fill="hsl(var(--destructive))" name="Spend ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Cohorts Table */}
        <Card data-testid="card-cohorts-table">
          <CardHeader>
            <CardTitle>All Cohorts</CardTitle>
            <CardDescription>
              Complete breakdown of cohort performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Period</th>
                    <th className="text-right p-3 font-semibold">Age</th>
                    <th className="text-right p-3 font-semibold">Spend</th>
                    <th className="text-right p-3 font-semibold">Leads</th>
                    <th className="text-right p-3 font-semibold">Donors</th>
                    <th className="text-right p-3 font-semibold">CAC</th>
                    <th className="text-right p-3 font-semibold">Current LTGP</th>
                    <th className="text-right p-3 font-semibold">Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.length > 0 ? (
                    cohorts.map((cohort) => (
                      <tr
                        key={cohort.periodKey}
                        className="border-b hover-elevate"
                        data-testid={`row-cohort-${cohort.periodKey}`}
                      >
                        <td className="p-3" data-testid={`text-period-${cohort.periodKey}`}>
                          <div className="font-medium">{cohort.periodKey}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(cohort.periodStart)} - {formatDate(cohort.periodEnd)}
                          </div>
                        </td>
                        <td className="p-3 text-right" data-testid={`text-age-${cohort.periodKey}`}>
                          {cohort.monthsActive} mo
                        </td>
                        <td className="p-3 text-right" data-testid={`text-spend-${cohort.periodKey}`}>
                          {formatCurrency(cohort.spend)}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-leads-${cohort.periodKey}`}>
                          {cohort.leadsAcquired}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-donors-${cohort.periodKey}`}>
                          {cohort.donorsAcquired}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-cac-${cohort.periodKey}`}>
                          {formatCurrency(cohort.cac)}
                        </td>
                        <td className="p-3 text-right" data-testid={`text-ltgp-${cohort.periodKey}`}>
                          {formatCurrency(cohort.currentLTGP)}
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            variant={getRatioBadgeVariant(cohort.currentRatio)}
                            className="font-mono"
                            data-testid={`badge-ratio-${cohort.periodKey}`}
                          >
                            {formatRatio(cohort.currentRatio)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground" data-testid="text-no-cohorts">
                        No cohort data available yet. Cohorts are created automatically as you track donor acquisitions.
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
