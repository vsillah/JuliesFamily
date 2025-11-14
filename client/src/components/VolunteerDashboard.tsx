import { VolunteerEnrollmentCard } from "@/components/VolunteerEnrollmentCard";

export function VolunteerDashboard() {
  return (
    <section id="volunteer-dashboard" className="py-16 bg-background" data-testid="section-volunteer-dashboard">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              My Volunteer Journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Track your volunteer activities and impact
            </p>
          </div>

          {/* Volunteer Engagement Card */}
          <VolunteerEnrollmentCard />
        </div>
      </div>
    </section>
  );
}
