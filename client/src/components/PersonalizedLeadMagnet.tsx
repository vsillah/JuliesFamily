import { usePersona } from "@/contexts/PersonaContext";
import StudentReadinessQuiz from "./StudentReadinessQuiz";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import LeadCaptureForm from "./LeadCaptureForm";
import { useState } from "react";
import { 
  CheckCircle, 
  Download, 
  FileText, 
  Heart, 
  Users, 
  GraduationCap,
  HandHeart,
  Baby,
  TrendingUp
} from "lucide-react";

export default function PersonalizedLeadMagnet() {
  const { persona, funnelStage } = usePersona();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  if (persona === "student" && funnelStage === "awareness") {
    return <StudentReadinessQuiz />;
  }

  if (persona === "student" && funnelStage === "consideration") {
    if (showLeadForm) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Get Your Success Stories Guide</CardTitle>
            <CardDescription>
              Enter your information to receive inspiring alumni stories and career pathways.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              defaultPersona="student"
              defaultFunnelStage="consideration"
              leadMagnetId="success_stories_guide"
              onSuccess={() => setShowLeadForm(false)}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <CardTitle>Success Stories Guide</CardTitle>
          </div>
          <CardDescription>
            See how real students transformed their lives through education
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">What You'll Discover:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Real success stories from GED to career advancement</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Step-by-step education and career pathways</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Resources and support available at each stage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Tips from successful alumni on overcoming challenges</span>
                </li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={() => setShowLeadForm(true)} 
            className="w-full"
            data-testid="button-download-guide"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Free Guide
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (persona === "provider" && funnelStage === "awareness") {
    if (showLeadForm) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Get Your Partnership Quick Guide</CardTitle>
            <CardDescription>
              Enter your information to receive our partnership overview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              defaultPersona="provider"
              defaultFunnelStage="awareness"
              leadMagnetId="partnership_quick_guide"
              onSuccess={() => setShowLeadForm(false)}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-6 h-6 text-primary" />
            <CardTitle>Partnership Quick Guide</CardTitle>
          </div>
          <CardDescription>
            Learn how your organization can collaborate with us to serve your clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">Partner With Us:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Easy client referral process</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Collaborative case management opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Resource sharing and joint programming</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>No-cost services for your clients</span>
                </li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={() => setShowLeadForm(true)} 
            className="w-full"
            data-testid="button-download-guide"
          >
            <Download className="w-4 h-4 mr-2" />
            Get Partnership Guide
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (persona === "provider" && funnelStage === "consideration") {
    if (showLeadForm) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Get Your Referral Toolkit</CardTitle>
            <CardDescription>
              Access templates and forms to streamline client referrals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              defaultPersona="provider"
              defaultFunnelStage="consideration"
              leadMagnetId="referral_toolkit"
              onSuccess={() => setShowLeadForm(false)}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-primary" />
            <CardTitle>Client Referral Toolkit</CardTitle>
          </div>
          <CardDescription>
            Everything you need to refer clients efficiently and track outcomes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">Toolkit Includes:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Fillable referral forms (PDF & online)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Client consent and release templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Program eligibility criteria quick reference</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Follow-up communication templates</span>
                </li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={() => setShowLeadForm(true)} 
            className="w-full"
            data-testid="button-download-toolkit"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Toolkit
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (persona === "parent" && funnelStage === "awareness") {
    const checklistItems = [
      { id: "social", label: "Can play and share with other children", category: "Social Skills" },
      { id: "communication", label: "Expresses needs and wants verbally", category: "Communication" },
      { id: "motor", label: "Uses scissors and holds pencil correctly", category: "Motor Skills" },
      { id: "independence", label: "Uses bathroom independently", category: "Self-Care" },
      { id: "attention", label: "Sits and focuses for 10-15 minutes", category: "Attention" },
    ];

    const checkedCount = Object.values(checkedItems).filter(Boolean).length;

    if (showLeadForm) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Get Your Full Readiness Report</CardTitle>
            <CardDescription>
              Receive a personalized assessment and recommended next steps for your child.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              defaultPersona="parent"
              defaultFunnelStage="awareness"
              leadMagnetId="school_readiness_checklist"
              interactionMetadata={{ checkedItems, checkedCount }}
              onSuccess={() => {
                setShowLeadForm(false);
                setCheckedItems({});
              }}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Baby className="w-6 h-6 text-primary" />
            <CardTitle>School Readiness Checklist</CardTitle>
          </div>
          <CardDescription>
            Check off the skills your child has mastered to assess their readiness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-3 p-4 rounded-lg border hover-elevate"
              >
                <Checkbox
                  id={item.id}
                  checked={checkedItems[item.id] || false}
                  onCheckedChange={(checked) =>
                    setCheckedItems({ ...checkedItems, [item.id]: checked as boolean })
                  }
                  data-testid={`checkbox-${item.id}`}
                />
                <label htmlFor={item.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.category}</div>
                </label>
              </div>
            ))}
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium">
              Progress: {checkedCount} of {checklistItems.length} skills checked
            </p>
          </div>

          <Button 
            onClick={() => setShowLeadForm(true)} 
            className="w-full"
            data-testid="button-get-readiness-report"
          >
            Get Full Readiness Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (persona === "parent" && funnelStage === "consideration") {
    if (showLeadForm) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Get Your Enrollment Guide</CardTitle>
            <CardDescription>
              Receive detailed enrollment information and program comparisons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              defaultPersona="parent"
              defaultFunnelStage="consideration"
              leadMagnetId="enrollment_guide"
              onSuccess={() => setShowLeadForm(false)}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-primary" />
            <CardTitle>Preschool Enrollment Guide</CardTitle>
          </div>
          <CardDescription>
            Step-by-step guide to enrolling your child in our programs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">Guide Includes:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Program options and schedule comparison</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Complete enrollment checklist and required documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Financial assistance and subsidy information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Important dates and deadlines</span>
                </li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={() => setShowLeadForm(true)} 
            className="w-full"
            data-testid="button-download-enrollment-guide"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Enrollment Guide
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (persona === "donor" && funnelStage === "awareness") {
    if (showLeadForm) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Get Our Impact Report</CardTitle>
            <CardDescription>
              See the difference your support can make in our community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              defaultPersona="donor"
              defaultFunnelStage="awareness"
              leadMagnetId="impact_report"
              onSuccess={() => setShowLeadForm(false)}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <CardTitle>2024 Impact Report</CardTitle>
          </div>
          <CardDescription>
            See how donations transform lives in our community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">Discover Our Impact:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Lives changed: Stories and statistics from 2024</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Where donations go: Transparent financial breakdown</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Community outcomes: Employment and education gains</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Looking ahead: 2025 goals and expansion plans</span>
                </li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={() => setShowLeadForm(true)} 
            className="w-full"
            data-testid="button-view-impact-report"
          >
            <Download className="w-4 h-4 mr-2" />
            View Impact Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (persona === "donor" && funnelStage === "consideration") {
    if (showLeadForm) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Get Your Giving Options Guide</CardTitle>
            <CardDescription>
              Explore different ways to support our mission and their unique benefits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              defaultPersona="donor"
              defaultFunnelStage="consideration"
              leadMagnetId="giving_options_guide"
              onSuccess={() => setShowLeadForm(false)}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-6 h-6 text-primary" />
            <CardTitle>Ways to Give Guide</CardTitle>
          </div>
          <CardDescription>
            Explore different donation options and maximize your impact
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">Giving Methods Covered:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>One-time gifts vs. recurring donations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Planned giving and legacy opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Corporate matching and workplace giving</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Tax benefits and charitable deduction guidance</span>
                </li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={() => setShowLeadForm(true)} 
            className="w-full"
            data-testid="button-download-giving-guide"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Giving Guide
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (persona === "volunteer" && funnelStage === "awareness") {
    const volunteerQuestions = [
      {
        id: 1,
        question: "What type of volunteer work interests you most?",
        options: [
          { value: "teaching", label: "Teaching & Tutoring" },
          { value: "admin", label: "Administrative Support" },
          { value: "events", label: "Event Planning & Support" },
          { value: "childcare", label: "Childcare Assistance" },
        ],
      },
      {
        id: 2,
        question: "How much time can you commit?",
        options: [
          { value: "2-4hrs", label: "2-4 hours per week" },
          { value: "4-8hrs", label: "4-8 hours per week" },
          { value: "8+hrs", label: "8+ hours per week" },
          { value: "flexible", label: "Flexible/Project-based" },
        ],
      },
    ];

    const currentQuestion = volunteerQuestions[quizStep];
    const allAnswered = quizStep >= volunteerQuestions.length;

    if (showLeadForm) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Get Your Volunteer Match Results</CardTitle>
            <CardDescription>
              Receive personalized volunteer opportunities based on your interests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              defaultPersona="volunteer"
              defaultFunnelStage="awareness"
              leadMagnetId="volunteer_match_quiz"
              interactionMetadata={{ quizAnswers }}
              onSuccess={() => {
                setShowLeadForm(false);
                setQuizStep(0);
                setQuizAnswers({});
              }}
            />
          </CardContent>
        </Card>
      );
    }

    if (allAnswered) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              <CardTitle>Great! We Found Your Match</CardTitle>
            </div>
            <CardDescription>
              Based on your answers, we have volunteer opportunities perfect for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="text-lg font-semibold mb-2">Your Matches:</h3>
              <p className="text-sm text-muted-foreground">
                Submit your information to receive detailed volunteer opportunity descriptions 
                and next steps to get started.
              </p>
            </div>

            <Button 
              onClick={() => setShowLeadForm(true)} 
              className="w-full"
              data-testid="button-get-volunteer-matches"
            >
              Get My Matches
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <HandHeart className="w-6 h-6 text-primary" />
            <CardTitle>Find Your Volunteer Match</CardTitle>
          </div>
          <CardDescription>
            Answer 2 quick questions to discover the best volunteer opportunities for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Question {quizStep + 1} of {volunteerQuestions.length}
            </h3>
            <p className="mb-4">{currentQuestion.question}</p>
            <div className="space-y-2">
              {currentQuestion.options.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setQuizAnswers({ ...quizAnswers, [currentQuestion.id]: option.value });
                    setQuizStep(quizStep + 1);
                  }}
                  data-testid={`button-option-${option.value}`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (persona === "volunteer" && funnelStage === "consideration") {
    if (showLeadForm) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Get Your Volunteer Handbook Preview</CardTitle>
            <CardDescription>
              Learn what to expect and how to get started as a volunteer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              defaultPersona="volunteer"
              defaultFunnelStage="consideration"
              leadMagnetId="volunteer_handbook"
              onSuccess={() => setShowLeadForm(false)}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-primary" />
            <CardTitle>Volunteer Handbook Preview</CardTitle>
          </div>
          <CardDescription>
            Everything you need to know before starting your volunteer journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">Handbook Includes:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Volunteer roles and responsibilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Training and orientation process</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Background check and requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Tips for success from experienced volunteers</span>
                </li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={() => setShowLeadForm(true)} 
            className="w-full"
            data-testid="button-download-handbook"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Handbook Preview
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <StudentReadinessQuiz />;
}
