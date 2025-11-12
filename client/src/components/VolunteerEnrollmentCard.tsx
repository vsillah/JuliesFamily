import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface VolunteerEnrollmentCardProps {
  userId?: string;
}

export function VolunteerEnrollmentCard({ userId }: VolunteerEnrollmentCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/volunteer/my-enrollments'],
    enabled: !!userId,
  });

  if (!userId || isLoading) {
    return (
      <Card data-testid="card-volunteer-enrollment">
        <CardHeader>
          <CardTitle>Your Volunteer Activities</CardTitle>
          <CardDescription>Loading your volunteer information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const enrollments = data?.enrollments || [];
  const hours = data?.hours || { totalMinutes: 0, sessionCount: 0, yearToDate: 0 };

  const upcomingEnrollments = enrollments.filter((e: any) => {
    const shiftDate = new Date(e.shift?.shiftDate);
    return shiftDate >= new Date();
  }).slice(0, 3);

  const nextShift = upcomingEnrollments[0];
  const totalHours = Math.floor(hours.yearToDate / 60);
  const totalMinutes = hours.yearToDate % 60;

  return (
    <Card className="hover-elevate" data-testid="card-volunteer-enrollment">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl">Your Volunteer Activities</CardTitle>
            <CardDescription>
              {nextShift
                ? `Next shift: ${format(new Date(nextShift.shift.shiftDate), 'MMM d, yyyy')}`
                : 'No upcoming shifts scheduled'}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="flex-shrink-0" data-testid="badge-volunteer-hours">
            <TrendingUp className="w-3 h-3 mr-1" />
            {totalHours}h {totalMinutes}m YTD
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {nextShift ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm" data-testid="text-next-event-name">
                  {nextShift.event?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(nextShift.shift.shiftDate), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {nextShift.shift.startTime} - {nextShift.shift.endTime}
              </p>
            </div>

            {nextShift.enrollment.volunteerRole && (
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <Badge variant="outline" data-testid="badge-volunteer-role">
                    {nextShift.enrollment.volunteerRole}
                  </Badge>
                </div>
              </div>
            )}

            {nextShift.enrollment.enrollmentStatus && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge 
                    variant={nextShift.enrollment.enrollmentStatus === 'confirmed' ? 'default' : 'secondary'}
                    data-testid="badge-enrollment-status"
                  >
                    {nextShift.enrollment.enrollmentStatus}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              You don't have any upcoming volunteer shifts.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Check out available opportunities to get started!
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-4 flex-wrap">
        <Button variant="default" size="default" asChild data-testid="button-volunteer-details">
          <Link href="/volunteer">
            View All Activities
          </Link>
        </Button>
        {upcomingEnrollments.length > 1 && (
          <span className="text-sm text-muted-foreground" data-testid="text-additional-shifts">
            +{upcomingEnrollments.length - 1} more upcoming
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
