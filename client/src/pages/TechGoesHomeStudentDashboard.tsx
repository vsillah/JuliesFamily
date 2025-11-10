import { useQuery } from "@tanstack/react-query";
import { TechGoesHomeProgressCard } from "@/components/TechGoesHomeProgressCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";

export default function TechGoesHomeStudentDashboard() {
  const [, setLocation] = useLocation();

  // Fetch student's progress
  const { data: progress, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['/api/tgh/progress'],
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Handle errors by checking response status
  if (isError) {
    const errorResponse = (error as any)?.response;
    const status = errorResponse?.status;

    // Handle 401 - Unauthorized
    if (status === 401) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-12 max-w-2xl">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>
                  Please log in to view your Tech Goes Home progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="default" 
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-login-required"
                >
                  Log In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Handle other errors (500, network issues, etc.)
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Progress</CardTitle>
              <CardDescription>
                We encountered an issue loading your progress. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred.'}
              </p>
              <Button 
                variant="default"
                onClick={() => refetch()}
                data-testid="button-retry"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle not enrolled state (data loaded successfully but user not enrolled)
  if (!progress?.enrolled) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle>Not Enrolled</CardTitle>
              <CardDescription>
                You are not currently enrolled in the Tech Goes Home program.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="default"
                asChild
                data-testid="button-go-to-enrollment"
              >
                <Link href="/programs/tech-goes-home">
                  Go to Enrollment Page
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const {
    classesCompleted,
    classesRemaining,
    hoursCompleted,
    percentComplete,
    isEligibleForRewards,
    enrollment,
    attendance = []
  } = progress;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="gap-2" asChild data-testid="button-back">
            <Link href="/programs/tech-goes-home">
              <ArrowLeft className="h-4 w-4" />
              Back to Program Info
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
              My Tech Goes Home Journey
            </h1>
            <p className="text-muted-foreground" data-testid="text-page-description">
              Track your progress and view your class attendance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <TechGoesHomeProgressCard 
                mode="full"
                data={progress}
              />

              {attendance.length > 0 && (
                <Card data-testid="card-attendance-history">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2" data-testid="text-attendance-title">
                        <Calendar className="h-5 w-5 text-primary" />
                        Class Attendance
                      </CardTitle>
                      <Badge variant="secondary" data-testid="badge-attendance-count">
                        {classesCompleted} / {enrollment?.totalClassesRequired || 15} classes
                      </Badge>
                    </div>
                    <CardDescription data-testid="text-attendance-description">
                      Your complete attendance record
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {attendance.map((record: any) => {
                        const date = new Date(record.classDate);
                        return (
                          <div 
                            key={record.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                            data-testid={`attendance-record-${record.id}`}
                          >
                            {record.attended ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" data-testid="icon-attended" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" data-testid="icon-absent" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium" data-testid="text-class-date">
                                  Class {record.classNumber}
                                </p>
                                {record.isMakeup && (
                                  <Badge variant="outline" className="text-xs" data-testid="badge-makeup">
                                    Make-up
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground" data-testid="text-class-datetime">
                                {format(date, 'MMMM d, yyyy • h:mm a')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium" data-testid="text-hours-credits">
                                {record.hoursCredits || 2}h
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card data-testid="card-quick-stats">
                <CardHeader>
                  <CardTitle data-testid="text-stats-title">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div data-testid="stat-hours-completed">
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold text-foreground">{hoursCompleted}h</p>
                  </div>
                  <div data-testid="stat-classes-attended">
                    <p className="text-sm text-muted-foreground">Classes Attended</p>
                    <p className="text-2xl font-bold text-foreground">{classesCompleted}</p>
                  </div>
                  <div data-testid="stat-completion">
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold text-foreground">{percentComplete}%</p>
                  </div>
                </CardContent>
              </Card>

              {enrollment && (
                <Card data-testid="card-enrollment-info">
                  <CardHeader>
                    <CardTitle data-testid="text-enrollment-title">Enrollment Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div data-testid="info-program-name">
                      <p className="text-muted-foreground">Program</p>
                      <p className="font-medium">{enrollment.programName}</p>
                    </div>
                    {enrollment.enrollmentDate && (
                      <div data-testid="info-enrollment-date">
                        <p className="text-muted-foreground">Enrolled</p>
                        <p className="font-medium">
                          {format(new Date(enrollment.enrollmentDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    <div data-testid="info-status">
                      <p className="text-muted-foreground">Status</p>
                      <Badge 
                        variant={enrollment.status === 'active' ? 'default' : 'secondary'}
                        data-testid="badge-enrollment-status"
                      >
                        {enrollment.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-primary/5 border-primary/20" data-testid="card-help">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium" data-testid="text-help-title">
                    Need Help?
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-help-description">
                    Contact your instructor or call the main office at (617) 269-6663
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
