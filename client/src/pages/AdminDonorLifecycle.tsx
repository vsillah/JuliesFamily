import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, TrendingUp, Heart, DollarSign, Clock, Calendar, Mail
} from "lucide-react";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DonorWithLifecycle {
  leadId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  leadStatus: string | null;
  currentStage: string;
  totalLifetimeDonations: number | null;
  averageDonationAmount: number | null;
  donationFrequency: string | null;
  monthsSinceLastDonation: number | null;
  consecutiveMonthsDonating: number | null;
  becameFirstTimeDonor: Date | null;
  becameRecurringDonor: Date | null;
  becameMajorDonor: Date | null;
  becameLapsed: Date | null;
  currentLTGP: number | null;
  currentLTGPtoCAC: number | null;
  lifecycleUpdatedAt: Date | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DonorLifecycleResponse {
  donors: DonorWithLifecycle[];
  pagination: PaginationInfo;
}

interface StageStats {
  prospect: number;
  first_time: number;
  recurring: number;
  major_donor: number;
  lapsed: number;
}

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  first_time: "First-Time Donor",
  recurring: "Recurring Donor",
  major_donor: "Major Donor",
  lapsed: "Lapsed",
};

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-muted text-muted-foreground",
  first_time: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  recurring: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  major_donor: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  lapsed: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
};

const STAGE_ICONS: Record<string, typeof Users> = {
  prospect: Users,
  first_time: Heart,
  recurring: TrendingUp,
  major_donor: DollarSign,
  lapsed: Clock,
};

export default function AdminDonorLifecycle() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 25;

  // Fetch stage distribution stats
  const { data: stageStats, isLoading: statsLoading } = useQuery<StageStats>({
    queryKey: ["/api/admin/donors/lifecycle/stats"],
    retry: false,
  });

  // Fetch donors with lifecycle data
  const { data: donorsData, isLoading: donorsLoading } = useQuery<DonorLifecycleResponse>({
    queryKey: ["/api/admin/donors/lifecycle", selectedStage, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageLimit.toString(),
      });
      if (selectedStage !== "all") {
        params.append("stage", selectedStage);
      }
      const response = await fetch(`/api/admin/donors/lifecycle?${params}`);
      if (!response.ok) throw new Error("Failed to fetch donors");
      return response.json();
    },
    retry: false,
  });

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  // Show loading state
  if (statsLoading || donorsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-state">
        <div className="text-lg">Loading donor lifecycle data...</div>
      </div>
    );
  }

  // Helper to format currency
  const formatCurrency = (value: number | null) => {
    if (!value) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100); // Convert cents to dollars
  };

  // Helper to format date
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to get donor name
  const getDonorName = (donor: DonorWithLifecycle) => {
    if (donor.firstName || donor.lastName) {
      return `${donor.firstName || ""} ${donor.lastName || ""}`.trim();
    }
    return donor.email;
  };

  // Calculate total donors
  const totalDonors = stageStats ? Object.values(stageStats).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <div className="relative bg-muted/30 border-b">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumbs items={[
            { label: "Admin Dashboard", href: "/admin" },
            { label: "Donor Lifecycle" }
          ]} />
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold" data-testid="page-title">
                  Donor Lifecycle Management
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  Track donor progression through lifecycle stages and engagement metrics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stage Distribution Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Object.entries(STAGE_LABELS).map(([stage, label]) => {
            const Icon = STAGE_ICONS[stage];
            const count = stageStats?.[stage as keyof StageStats] || 0;
            const percentage = totalDonors > 0 ? ((count / totalDonors) * 100).toFixed(1) : "0";

            return (
              <Card 
                key={stage}
                className={`hover-elevate cursor-pointer transition-all ${
                  selectedStage === stage ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setSelectedStage(stage);
                  setCurrentPage(1);
                }}
                data-testid={`stage-card-${stage}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid={`stage-count-${stage}`}>{count}</div>
                  <p className="text-xs text-muted-foreground">
                    {percentage}% of total
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Donors</CardTitle>
                <CardDescription>
                  {selectedStage === "all" 
                    ? `Showing all ${totalDonors} donors`
                    : `Showing ${donorsData?.pagination.total || 0} ${STAGE_LABELS[selectedStage]} donors`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedStage} onValueChange={(value) => {
                  setSelectedStage(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[200px]" data-testid="filter-stage">
                    <SelectValue placeholder="Filter by stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {Object.entries(STAGE_LABELS).map(([stage, label]) => (
                      <SelectItem key={stage} value={stage}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Donors Table */}
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Donor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Stage</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Lifetime Donations</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Avg Gift</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Consecutive Months</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Last Donation</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">LTGP:CAC</th>
                  </tr>
                </thead>
                <tbody>
                  {donorsData?.donors.map((donor) => (
                    <tr 
                      key={donor.leadId} 
                      className="border-b hover-elevate"
                      data-testid={`donor-row-${donor.leadId}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium" data-testid={`donor-name-${donor.leadId}`}>
                            {getDonorName(donor)}
                          </div>
                          <div className="text-sm text-muted-foreground">{donor.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STAGE_COLORS[donor.currentStage]} data-testid={`donor-stage-${donor.leadId}`}>
                          {STAGE_LABELS[donor.currentStage]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium" data-testid={`donor-total-${donor.leadId}`}>
                        {formatCurrency(donor.totalLifetimeDonations)}
                      </td>
                      <td className="px-4 py-3 text-right" data-testid={`donor-avg-${donor.leadId}`}>
                        {formatCurrency(donor.averageDonationAmount)}
                      </td>
                      <td className="px-4 py-3 text-center" data-testid={`donor-consecutive-${donor.leadId}`}>
                        {donor.consecutiveMonthsDonating || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm" data-testid={`donor-last-donation-${donor.leadId}`}>
                        {donor.monthsSinceLastDonation !== null 
                          ? `${donor.monthsSinceLastDonation} mo ago`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right" data-testid={`donor-ratio-${donor.leadId}`}>
                        {donor.currentLTGPtoCAC 
                          ? `${(donor.currentLTGPtoCAC / 100).toFixed(2)}:1`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {donorsData && donorsData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {donorsData.pagination.page} of {donorsData.pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(donorsData.pagination.totalPages, p + 1))}
                    disabled={currentPage === donorsData.pagination.totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
