import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Sparkles,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Mail,
  MessageSquare,
  CheckCircle2,
  BarChart3,
  Zap,
  Heart,
  Globe,
  ArrowRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ProductLanding() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  const submitLeadMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string }) => {
      return await apiRequest("POST", "/api/leads", {
        ...data,
        persona: "provider",
        funnelStage: "awareness",
        leadSource: "Product Landing Page",
      });
    },
    onSuccess: () => {
      toast({
        title: "Thanks for your interest!",
        description: "We'll be in touch soon to discuss how we can help your nonprofit thrive.",
      });
      setEmail("");
      setOrganization("");
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !organization) {
      toast({
        title: "Missing information",
        description: "Please provide both your email and organization name.",
        variant: "destructive",
      });
      return;
    }

    submitLeadMutation.mutate({
      email,
      firstName: organization,
      lastName: "Organization",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" data-testid="badge-platform-type">
                Introducing Kinflo
              </Badge>
              <h1 className="text-5xl font-bold mb-6" data-testid="text-hero-title">
                The relationship-first CRM for nonprofits
              </h1>
              <p className="text-xl text-muted-foreground mb-8" data-testid="text-hero-subtitle">
                Kinflo personalizes every touchpoint with AI-powered insights, automates your outreach, and helps grow donations by 28% in your first year
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg" data-testid="button-cta-primary">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg" data-testid="button-cta-secondary">
                  Watch Demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4" data-testid="text-trial-info">
                Free 14-day trial • No credit card required • Setup in minutes
              </p>
            </div>
            <div className="relative">
              <div className="bg-card border rounded-lg shadow-2xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">AI-Powered Personalization</p>
                      <p className="text-sm text-muted-foreground">120 unique donor journeys</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold">Built-in A/B Testing</p>
                      <p className="text-sm text-muted-foreground">Optimize every campaign</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">Pipeline Analytics</p>
                      <p className="text-sm text-muted-foreground">Identify bottlenecks instantly</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-success-rate">
                28%
              </div>
              <div className="text-sm text-muted-foreground">Average donation increase</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-time-saved">
                15hrs
              </div>
              <div className="text-sm text-muted-foreground">Saved per week</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-personas">
                5×4
              </div>
              <div className="text-sm text-muted-foreground">Persona × journey stages</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-integrations">
                All-in-One
              </div>
              <div className="text-sm text-muted-foreground">Website + CRM + Automation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Differentiators */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" data-testid="text-differentiators-title">
              Why nonprofits choose Kinflo over the competition
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              While others charge $99-$1,299/month for basic CRMs, Kinflo is the first truly intelligent nonprofit platform built for relationships
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Copy Generation</CardTitle>
                <CardDescription>
                  Using Alex Hormozi's Value Equation framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Generate high-converting emails, SMS messages, and landing pages in seconds. Kinflo's AI creates 3 variants optimized for Dream Outcome, Trust, Speed, and Ease.
                </p>
                <div className="mt-4 flex items-center text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Competitors charge $50+/month extra
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>120 Personalized Journeys</CardTitle>
                <CardDescription>
                  5 personas × 4 funnel stages = perfect targeting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every donor sees content tailored to their role (Student, Parent, Donor, Volunteer, Provider) and stage (Awareness, Consideration, Decision, Retention).
                </p>
                <div className="mt-4 flex items-center text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Competitors offer basic segmentation only
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Passion-Based Donation Campaigns</CardTitle>
                <CardDescription>
                  Multi-channel fundraising with member dashboards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create targeted campaigns by passion tags, notify members (parents, students) of donations in real-time, track progress, and enable beneficiaries to submit thank-you testimonials to donors.
                </p>
                <div className="mt-4 flex items-center text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Most CRMs charge $500+/year for fundraising
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Built-in A/B Testing</CardTitle>
                <CardDescription>
                  Optimize everything, no extra tools needed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Test hero images, CTAs, email subject lines, and entire landing pages. Track conversions automatically and let data drive your decisions.
                </p>
                <div className="mt-4 flex items-center text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save $200+/month on separate A/B tools
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: "Donation Campaign Management",
                description: "Passion-based targeting, goal tracking, real-time progress updates",
              },
              {
                icon: Users,
                title: "Campaign Member Dashboards",
                description: "Parents & students track donations, opt-in to notifications, submit testimonials",
              },
              {
                icon: Calendar,
                title: "Google Calendar Integration",
                description: "Appointment scheduling, task sync, volunteer registration",
              },
              {
                icon: Mail,
                title: "Email Automation",
                description: "SendGrid integration with AI-powered templates and tracking",
              },
              {
                icon: MessageSquare,
                title: "SMS Campaigns",
                description: "Twilio integration for text messaging with delivery tracking",
              },
              {
                icon: BarChart3,
                title: "Pipeline Analytics",
                description: "Visual kanban, conversion rates, bottleneck detection",
              },
              {
                icon: Zap,
                title: "Task Automation",
                description: "Auto-create follow-ups, sync to calendar, track completion",
              },
              {
                icon: Globe,
                title: "Website Builder",
                description: "Persona-based content, dynamic navigation, SEO optimized",
              },
            ].map((feature, index) => (
              <div key={index} className="flex gap-4" data-testid={`feature-${index}`}>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold mb-12 text-center" data-testid="text-comparison-title">
            How Kinflo compares to traditional nonprofit CRMs
          </h2>

          <div className="bg-card rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left font-semibold">Feature</th>
                  <th className="p-4 text-center font-semibold">Kinflo</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">Bloomerang</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">Neon CRM</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">DonorPerfect</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Website Builder Included", us: true, b: false, n: true, d: false },
                  { feature: "Donation Campaign Management", us: true, b: true, n: true, d: true },
                  { feature: "Campaign Member Dashboards", us: true, b: false, n: false, d: false },
                  { feature: "Passion-Based Donor Targeting", us: true, b: false, n: false, d: false },
                  { feature: "Persona-Based Personalization", us: true, b: false, n: false, d: false },
                  { feature: "Built-in A/B Testing", us: true, b: false, n: false, d: false },
                  { feature: "AI Copy Generation", us: true, b: true, n: false, d: false },
                  { feature: "Email Automation", us: true, b: true, n: true, d: true },
                  { feature: "SMS Campaigns", us: true, b: false, n: true, d: false },
                  { feature: "Calendar Integration", us: true, b: false, n: true, d: false },
                  { feature: "Starting Price", us: "Free", b: "$125/mo", n: "$99/mo", d: "$99/mo" },
                ].map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      {typeof row.us === "boolean" ? (
                        row.us ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" data-testid={`check-us-${index}`} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="font-semibold text-green-600">{row.us}</span>
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {typeof row.b === "boolean" ? (
                        row.b ? (
                          <CheckCircle2 className="h-5 w-5 mx-auto" />
                        ) : (
                          "—"
                        )
                      ) : (
                        row.b
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {typeof row.n === "boolean" ? (
                        row.n ? (
                          <CheckCircle2 className="h-5 w-5 mx-auto" />
                        ) : (
                          "—"
                        )
                      ) : (
                        row.n
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {typeof row.d === "boolean" ? (
                        row.d ? (
                          <CheckCircle2 className="h-5 w-5 mx-auto" />
                        ) : (
                          "—"
                        )
                      ) : (
                        row.d
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Affiliate/Partnership Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-secondary/10 to-accent/10 border-2">
            <CardContent className="p-8 md:p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-affiliate-title">
                  Interested in implementing Kinflo for your organization?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  We're looking for nonprofit partners and affiliates who want to leverage Kinflo's powerful, persona-based CRM and website platform. Whether you're a nonprofit seeking a complete digital transformation or an agency wanting to offer Kinflo to your clients, we'd love to connect.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" variant="default" asChild data-testid="button-partner-contact">
                    <a href="mailto:vsillah@gmail.com?subject=Partnership Inquiry - Nonprofit CRM Platform">
                      <Mail className="mr-2 h-5 w-5" />
                      Contact Us About Partnership
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild data-testid="button-schedule-demo">
                    <a href="/schedule">
                      <Calendar className="mr-2 h-5 w-5" />
                      Schedule a Demo
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  Perfect for: Nonprofit organizations, digital agencies, consultants, and technology partners
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4" data-testid="text-cta-title">
              Ready to transform your nonprofit?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join forward-thinking organizations using data and AI to maximize their impact
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="organization">Organization Name</Label>
                  <Input
                    id="organization"
                    placeholder="Julie's Family Learning Program"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    required
                    data-testid="input-organization"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@nonprofit.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitLeadMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitLeadMutation.isPending ? "Submitting..." : "Get Started Free"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By submitting this form, you agree to our Terms of Service and Privacy Policy. We'll never share your information.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
