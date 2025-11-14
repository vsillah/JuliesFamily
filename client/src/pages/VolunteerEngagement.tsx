import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Users, Award, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { VolunteerProgressCard } from "@/components/VolunteerProgressCard";
import type { ContentItem, VolunteerDashboardCardMetadata } from "@shared/schema";

export default function VolunteerEngagement() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/volunteer/my-enrollments'],
  });

  // Fetch volunteer dashboard card content for personalization
  const { data: volunteerCardContent } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/volunteer_dashboard_card"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">My Volunteer Activities</h1>
        <p className="text-muted-foreground">Loading your volunteer information...</p>
      </div>
    );
  }

  const enrollments = data?.enrollments || [];
  const hours = data?.hours || { totalMinutes: 0, sessionCount: 0, yearToDate: 0 };

  const upcomingEnrollments = enrollments.filter((e: any) => {
    const shiftDate = new Date(e.shift?.shiftDate);
    return shiftDate >= new Date();
  });

  const pastEnrollments = enrollments.filter((e: any) => {
    const shiftDate = new Date(e.shift?.shiftDate);
    return shiftDate < new Date();
  });

  const totalHours = Math.floor(hours.totalMinutes / 60);
  const totalMinutes = hours.totalMinutes % 60;
  const ytdHours = Math.floor(hours.yearToDate / 60);
  const ytdMinutes = hours.yearToDate % 60;

  // Calculate active enrollments (upcoming shifts with confirmed status)
  const activeEnrollments = upcomingEnrollments.filter((e: any) => 
    e.enrollment.enrollmentStatus === 'confirmed'
  ).length;

  // Extract volunteer card content from CMS
  const firstCard = volunteerCardContent?.[0];
  const cardContentData = firstCard ? {
    title: firstCard.title,
    description: firstCard.description || "Track your impact and commitment",
    buttonText: (firstCard.metadata as VolunteerDashboardCardMetadata)?.buttonText || "View My Dashboard",
    buttonLink: (firstCard.metadata as VolunteerDashboardCardMetadata)?.buttonLink || "/volunteer",
    goalText: (firstCard.metadata as VolunteerDashboardCardMetadata)?.goalText,
    motivationalText: (firstCard.metadata as VolunteerDashboardCardMetadata)?.motivationalText,
  } : undefined;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">My Volunteer Activities</h1>
        <p className="text-muted-foreground">
          Track your volunteer commitments, hours, and impact
        </p>
      </div>

      {/* Volunteer Progress Dashboard Card */}
      <div className="mb-8">
        <VolunteerProgressCard
          mode="summary"
          data={{
            totalHours: totalHours,
            activeEnrollments: activeEnrollments,
          }}
          content={cardContentData}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card data-testid="card-hours-ytd">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Year</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-hours-ytd">
              {ytdHours}h {ytdMinutes}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hours.sessionCount} {hours.sessionCount === 1 ? 'session' : 'sessions'} logged
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-hours-total">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-hours-total">
              {totalHours}h {totalMinutes}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-upcoming-count">
              {upcomingEnrollments.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {upcomingEnrollments.length === 1 ? 'commitment' : 'commitments'} scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4" data-testid="text-upcoming-header">Upcoming Commitments</h2>
          {upcomingEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">You don't have any upcoming volunteer shifts.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingEnrollments.map((enrollment: any) => (
                <Card key={enrollment.enrollment.id} className="hover-elevate" data-testid={`card-enrollment-${enrollment.enrollment.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg" data-testid={`text-event-name-${enrollment.enrollment.id}`}>
                          {enrollment.event?.name}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(enrollment.shift.shiftDate), 'EEEE, MMMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={enrollment.enrollment.enrollmentStatus === 'confirmed' ? 'default' : 'secondary'}
                        data-testid={`badge-status-${enrollment.enrollment.id}`}
                      >
                        {enrollment.enrollment.enrollmentStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm" data-testid={`text-time-${enrollment.enrollment.id}`}>
                        {enrollment.shift.startTime} - {enrollment.shift.endTime}
                      </span>
                    </div>

                    {enrollment.shift.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {enrollment.shift.location}
                        </span>
                      </div>
                    )}

                    {enrollment.enrollment.volunteerRole && (
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground">Role:</span>
                          <Badge variant="outline">
                            {enrollment.enrollment.volunteerRole}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {enrollment.shift.maxVolunteers && (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {enrollment.shift.currentEnrollments || 0} / {enrollment.shift.maxVolunteers} volunteers enrolled
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h2 className="text-2xl font-semibold mb-4" data-testid="text-history-header">Attendance History</h2>
          {pastEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No past volunteer activities yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastEnrollments.map((enrollment: any) => (
                <Card key={enrollment.enrollment.id} data-testid={`card-past-enrollment-${enrollment.enrollment.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">
                          {enrollment.event?.name}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(enrollment.shift.shiftDate), 'MMMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {enrollment.enrollment.enrollmentStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {enrollment.shift.startTime} - {enrollment.shift.endTime}
                      </span>
                    </div>

                    {enrollment.enrollment.volunteerRole && (
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          Role: {enrollment.enrollment.volunteerRole}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
