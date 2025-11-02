import { GraduationCap, Users, Calendar, Award } from "lucide-react";

export default function ImpactStats() {
  const stats = [
    {
      icon: Calendar,
      number: "50",
      label: "Years of Service",
    },
    {
      icon: Users,
      number: "1,000+",
      label: "Families Served",
    },
    {
      icon: GraduationCap,
      number: "500+",
      label: "Graduates",
    },
    {
      icon: Award,
      number: "100%",
      label: "Commitment",
    },
  ];

  return (
    <section id="impact" className="py-20 sm:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Our Impact –
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold mb-6">
            Celebrating <span className="italic">Five Decades</span> of{" "}
            <span className="font-bold">Excellence</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            For 50 years, we've been dedicated to empowering families through education and support.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center"
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-2">
                  {stat.number}
                </div>
                <div className="text-base text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
