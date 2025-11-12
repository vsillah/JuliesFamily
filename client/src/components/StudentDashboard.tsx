import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Award, Laptop, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { StudentSubmissionForm } from "@/components/StudentSubmissionForm";
import { VolunteerEnrollmentCard } from "@/components/VolunteerEnrollmentCard";

interface TGHProgress {
  enrolled: boolean;
  enrollment: {
    id: string;
    programName: string;
    status: string;
    totalClassesRequired: number;
    chromebookReceived: boolean;
    internetActivated: boolean;
    programStartDate: string | null;
    programEndDate: string | null;
  } | null;
  attendance: {
    id: string;
    classDate: string;
    classNumber: number;
    attended: boolean;
    isMakeup: boolean;
    hoursCredits: number;
  }[];
  classesCompleted: number;
  classesRemaining: number;
  hoursCompleted: number;
  percentComplete: number;
  isEligibleForRewards: boolean;
}

export function StudentDashboard() {
  const { data: progress, isLoading, error } = useQuery<TGHProgress>({
    queryKey: ["/api/tgh/progress"],
  });

  if (isLoading) {
    return (
      <section id="student-dashboard" className="py-16 bg-background" data-testid="section-student-dashboard">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !progress?.enrolled) {
    return null;
  }

  const { enrollment, attendance, classesCompleted, classesRemaining, hoursCompleted, percentComplete, isEligibleForRewards } = progress;

  if (!enrollment) {
    return null;
  }

  // Get upcoming classes (next 5 classes)
  const upcomingClasses = Array.from({ length: Math.min(5, classesRemaining) }, (_, i) => ({
    classNumber: classesCompleted + i + 1,
    totalClasses: enrollment.totalClassesRequired,
  }));

  // Get recent attendance (last 5 attended classes)
  const recentAttendance = attendance
    .filter(a => a.attended)
    .sort((a, b) => new Date(b.classDate).getTime() - new Date(a.classDate).getTime())
    .slice(0, 5);

  const statusColor = enrollment.status === 'active' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 
                      enrollment.status === 'completed' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                      'bg-muted text-muted-foreground';

  return (
    <section id="student-dashboard" className="py-16 bg-background" data-testid="section-student-dashboard">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              My Learning Journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Track your progress in the {enrollment.programName} program
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge className={statusColor} data-testid="badge-enrollment-status">
              {enrollment.status === 'active' && 'Active Enrollment'}
              {enrollment.status === 'completed' && 'Program Completed'}
              {enrollment.status === 'withdrawn' && 'Withdrawn'}
            </Badge>
          </div>

          {/* Progress Overview */}
          <Card data-testid="card-progress-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Course Progress
              </CardTitle>
              <CardDescription>
                {hoursCompleted} hours completed ({classesCompleted} sessions)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Completion</span>
                  <span className="font-semibold" data-testid="text-percent-complete">{percentComplete}%</span>
                </div>
                <Progress value={percentComplete} className="h-3" data-testid="progress-completion" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Hours Completed</div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-hours-completed">
                    {hoursCompleted}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Sessions</div>
                  <div className="text-2xl font-bold" data-testid="text-sessions-completed">
                    {classesCompleted}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upcoming Classes */}
            <Card data-testid="card-upcoming-classes">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Next Sessions
                </CardTitle>
                <CardDescription>
                  {hoursCompleted >= 15 ? 'Goal achieved! 15+ hours completed' : `Goal: 15+ hours`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {classesRemaining > 0 ? (
                  <div className="space-y-3">
                    {upcomingClasses.map(cls => (
                      <div 
                        key={cls.classNumber}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        data-testid={`item-upcoming-class-${cls.classNumber}`}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">{cls.classNumber}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Class {cls.classNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            of {cls.totalClasses} total sessions
                          </div>
                        </div>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Congratulations! You've completed all required classes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card data-testid="card-recent-attendance">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Recent Attendance
                </CardTitle>
                <CardDescription>
                  Your latest completed classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentAttendance.length > 0 ? (
                  <div className="space-y-3">
                    {recentAttendance.map(att => (
                      <div 
                        key={att.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        data-testid={`item-attendance-${att.classNumber}`}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">Class {att.classNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(att.classDate), 'MMM d, yyyy')}
                            {att.isMakeup && <span className="ml-2 text-xs">(Makeup)</span>}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {att.hoursCredits}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No classes attended yet. Start your journey today!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rewards & Goals */}
          <Card className={isEligibleForRewards ? "border-primary" : ""} data-testid="card-rewards">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Program Rewards
              </CardTitle>
              <CardDescription>
                Complete the program to earn your rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Chromebook */}
                <div className={`p-4 rounded-lg border-2 ${enrollment.chromebookReceived ? 'border-green-500 bg-green-500/5' : 'border-muted'}`}>
                  <div className="flex items-start gap-3">
                    <Laptop className={`w-8 h-8 ${enrollment.chromebookReceived ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1" data-testid="text-chromebook-title">Chromebook</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {enrollment.chromebookReceived 
                          ? 'Received and ready to use!' 
                          : isEligibleForRewards 
                            ? 'Ready to claim - contact your instructor'
                            : `Complete ${classesRemaining} more ${classesRemaining === 1 ? 'class' : 'classes'}`
                        }
                      </p>
                      <Badge 
                        variant={enrollment.chromebookReceived ? "default" : "outline"}
                        className={enrollment.chromebookReceived ? "bg-green-500" : ""}
                        data-testid="badge-chromebook-status"
                      >
                        {enrollment.chromebookReceived ? 'Received' : isEligibleForRewards ? 'Eligible' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Internet Service */}
                <div className={`p-4 rounded-lg border-2 ${enrollment.internetActivated ? 'border-green-500 bg-green-500/5' : 'border-muted'}`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`w-8 h-8 ${enrollment.internetActivated ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1" data-testid="text-internet-title">Internet Service</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {enrollment.internetActivated 
                          ? 'Service activated successfully!' 
                          : isEligibleForRewards 
                            ? 'Ready to activate - contact your instructor'
                            : `Complete ${classesRemaining} more ${classesRemaining === 1 ? 'class' : 'classes'}`
                        }
                      </p>
                      <Badge 
                        variant={enrollment.internetActivated ? "default" : "outline"}
                        className={enrollment.internetActivated ? "bg-green-500" : ""}
                        data-testid="badge-internet-status"
                      >
                        {enrollment.internetActivated ? 'Active' : isEligibleForRewards ? 'Eligible' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {isEligibleForRewards && (!enrollment.chromebookReceived || !enrollment.internetActivated) && (
                <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-foreground">
                    🎉 Congratulations! You've completed all required classes and are eligible for your rewards.
                    Contact your instructor to claim your {!enrollment.chromebookReceived && 'Chromebook'}
                    {!enrollment.chromebookReceived && !enrollment.internetActivated && ' and '}
                    {!enrollment.internetActivated && 'Internet service'}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Volunteer Engagement Card */}
        <div className="max-w-5xl mx-auto mt-8">
          <VolunteerEnrollmentCard />
        </div>

        {/* Student Submissions Section */}
        <div className="max-w-5xl mx-auto mt-8">
          <StudentSubmissionForm />
        </div>
      </div>
    </section>
  );
}
