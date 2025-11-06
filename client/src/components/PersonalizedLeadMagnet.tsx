import { usePersona } from "@/contexts/PersonaContext";
import { useQuery } from "@tanstack/react-query";
import StudentReadinessQuiz from "./StudentReadinessQuiz";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import LeadCaptureForm from "./LeadCaptureForm";
import { useState } from "react";
import type { ContentItem } from "@shared/schema";
import { 
  CheckCircle, 
  Download, 
  FileText, 
  Heart, 
  Users, 
  GraduationCap,
  HandHeart,
  Baby,
  TrendingUp,
  Lightbulb,
  Target,
  Calendar,
  Video,
  Calculator
} from "lucide-react";

// Map lead magnet types to icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  quiz: GraduationCap,
  pdf: FileText,
  guide: FileText,
  toolkit: Target,
  checklist: CheckCircle,
  report: TrendingUp,
  webinar: Video,
  workshop: Users,
  video: Video,
  calculator: Calculator,
  assessment: Lightbulb,
  case_study: FileText,
};

export default function PersonalizedLeadMagnet() {
  const { persona, funnelStage } = usePersona();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Query visible lead magnets for current persona + funnel stage
  const { data: leadMagnets = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/visible/lead_magnet", { persona, funnelStage }],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        persona: persona || '', 
        funnelStage: funnelStage || '' 
      });
      const res = await fetch(`/api/content/visible/lead_magnet?${params}`);
      if (!res.ok) throw new Error('Failed to fetch lead magnets');
      return res.json();
    },
    enabled: !!persona && !!funnelStage,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  // Get the first matching lead magnet (highest priority)
  const leadMagnet = leadMagnets[0];
  
  // Fallback UI for critical persona/stage combinations
  if (!leadMagnet) {
    // Student awareness - always show quiz as fallback
    if (persona === "student" && funnelStage === "awareness") {
      return <StudentReadinessQuiz />;
    }
    
    // Volunteer awareness - always show match quiz as fallback
    if (persona === "volunteer" && funnelStage === "awareness") {
      return <VolunteerMatchQuiz />;
    }
    
    // Parent awareness - show checklist as fallback
    if (persona === "parent" && funnelStage === "awareness") {
      const fallbackLeadMagnet: ContentItem = {
        id: 0,
        type: "lead_magnet",
        title: "School Readiness Checklist",
        description: "Assess your child's readiness for our early learning programs",
        metadata: { leadMagnetType: "checklist" },
        isActive: true,
      };
      return <SchoolReadinessChecklist leadMagnet={fallbackLeadMagnet} />;
    }
    
    return null; // No lead magnet for other persona/stage combinations
  }

  const metadata = leadMagnet.metadata as any;
  const leadMagnetType = metadata?.leadMagnetType || "pdf";
  const leadMagnetId = leadMagnet.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  // Special handling for quiz types
  if (leadMagnetType === "quiz") {
    // Student Readiness Quiz
    if (persona === "student" && funnelStage === "awareness") {
      return <StudentReadinessQuiz />;
    }

    // Volunteer Match Quiz
    if (persona === "volunteer" && funnelStage === "awareness") {
      return <VolunteerMatchQuiz />;
    }
  }

  // Special handling for checklist type
  if (leadMagnetType === "checklist" && persona === "parent" && funnelStage === "awareness") {
    return <SchoolReadinessChecklist leadMagnet={leadMagnet} />;
  }

  // Generic downloadable content renderer
  return <DownloadableLeadMagnet 
    leadMagnet={leadMagnet}
    showLeadForm={showLeadForm}
    setShowLeadForm={setShowLeadForm}
    persona={persona!}
    funnelStage={funnelStage!}
  />;
}

// Volunteer Match Quiz Component
function VolunteerMatchQuiz() {
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showLeadForm, setShowLeadForm] = useState(false);

  const volunteerQuestions = [
    {
      id: 1,
      question: "What type of volunteer work interests you most?",
      options: [
        { value: "teaching", label: "Teaching & Tutoring", description: "Help adults learn and grow" },
        { value: "childcare", label: "Childcare Support", description: "Care for children while parents learn" },
        { value: "admin", label: "Administrative", description: "Help with office tasks and organization" },
        { value: "events", label: "Events & Outreach", description: "Support fundraising and community events" }
      ]
    },
    {
      id: 2,
      question: "How much time can you commit per week?",
      options: [
        { value: "1-2", label: "1-2 hours", description: "Perfect for busy schedules" },
        { value: "3-5", label: "3-5 hours", description: "Regular weekly commitment" },
        { value: "6-10", label: "6-10 hours", description: "Significant involvement" },
        { value: "10+", label: "10+ hours", description: "Deep engagement" }
      ]
    }
  ];

  const currentQuestion = volunteerQuestions[quizStep];

  if (showLeadForm) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Volunteer Profile</CardTitle>
          <CardDescription>
            We'll match you with opportunities that fit your interests and availability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadCaptureForm
            defaultPersona="volunteer"
            defaultFunnelStage="awareness"
            leadMagnetId="find_your_volunteer_match"
            onSuccess={() => setShowLeadForm(false)}
          />
        </CardContent>
      </Card>
    );
  }

  if (quizStep >= volunteerQuestions.length) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <HandHeart className="w-6 h-6 text-primary" />
            <CardTitle>Your Perfect Volunteer Match</CardTitle>
          </div>
          <CardDescription>
            Based on your responses, we've identified opportunities that match your interests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-3">Recommended Opportunities:</h3>
            <ul className="space-y-3 text-sm">
              {quizAnswers["1"] === "teaching" && (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>GED Tutor:</strong> One-on-one support for adult learners
                  </div>
                </li>
              )}
              {quizAnswers["1"] === "childcare" && (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Childcare Assistant:</strong> Support early childhood education
                  </div>
                </li>
              )}
              {quizAnswers["1"] === "admin" && (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Office Support:</strong> Help with administrative tasks
                  </div>
                </li>
              )}
              {quizAnswers["1"] === "events" && (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Event Coordinator:</strong> Support fundraising and outreach
                  </div>
                </li>
              )}
            </ul>
          </div>

          <Button 
            onClick={() => setShowLeadForm(true)} 
            className="w-full"
            data-testid="button-submit-volunteer-match"
          >
            <HandHeart className="w-4 h-4 mr-2" />
            Start Your Volunteer Journey
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
          Question {quizStep + 1} of {volunteerQuestions.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((quizStep + 1) / volunteerQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setQuizAnswers({ ...quizAnswers, [currentQuestion.id]: option.value });
                  setTimeout(() => setQuizStep(quizStep + 1), 300);
                }}
                className="w-full text-left p-4 rounded-lg border border-border hover-elevate active-elevate-2 transition-all"
                data-testid={`option-${option.value}`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {quizStep > 0 && (
          <Button
            variant="outline"
            onClick={() => setQuizStep(quizStep - 1)}
            data-testid="button-back"
          >
            Back
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// School Readiness Checklist Component
function SchoolReadinessChecklist({ leadMagnet }: { leadMagnet: ContentItem }) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showLeadForm, setShowLeadForm] = useState(false);

  const checklistItems = [
    { id: "social", label: "Can play and share with other children", category: "Social Skills" },
    { id: "communication", label: "Expresses needs and wants verbally", category: "Communication" },
    { id: "independence", label: "Can use bathroom independently", category: "Independence" },
    { id: "motor", label: "Can hold a crayon and make marks on paper", category: "Fine Motor" },
    { id: "attention", label: "Can sit and focus on an activity for 10-15 minutes", category: "Attention Span" },
    { id: "following", label: "Follows simple 2-3 step directions", category: "Following Directions" },
    { id: "emotions", label: "Beginning to manage emotions and frustration", category: "Emotional Regulation" },
    { id: "curiosity", label: "Shows curiosity and asks questions", category: "Learning Readiness" }
  ];

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = checklistItems.length;
  const percentComplete = Math.round((checkedCount / totalItems) * 100);

  if (showLeadForm) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Get Your Personalized Enrollment Guide</CardTitle>
          <CardDescription>
            Based on your child's readiness assessment, we'll send you a customized guide.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadCaptureForm
            defaultPersona="parent"
            defaultFunnelStage="awareness"
            leadMagnetId="school_readiness_checklist"
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
          <Baby className="w-6 h-6 text-primary" />
          <CardTitle>{leadMagnet.title}</CardTitle>
        </div>
        <CardDescription>
          {leadMagnet.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress: {checkedCount} of {totalItems}</span>
            <span className="text-sm text-muted-foreground">{percentComplete}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
              <Checkbox
                id={item.id}
                checked={checkedItems[item.id] || false}
                onCheckedChange={(checked) => 
                  setCheckedItems({ ...checkedItems, [item.id]: !!checked })
                }
                data-testid={`checkbox-${item.id}`}
              />
              <div className="flex-1">
                <label 
                  htmlFor={item.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {item.label}
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
              </div>
            </div>
          ))}
        </div>

        {checkedCount > 0 && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-2">
              {percentComplete >= 75 ? "Great Progress!" : percentComplete >= 50 ? "You're on the Right Track!" : "Let's Work Together"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {percentComplete >= 75 
                ? "Your child shows strong readiness! Get our enrollment guide to learn about next steps."
                : percentComplete >= 50
                ? "Your child is developing well! Our program can help strengthen these skills."
                : "We're here to support your child's development at every stage."}
            </p>
          </div>
        )}

        <Button 
          onClick={() => setShowLeadForm(true)} 
          className="w-full"
          data-testid="button-get-guide"
        >
          <Download className="w-4 h-4 mr-2" />
          Get Personalized Enrollment Guide
        </Button>
      </CardContent>
    </Card>
  );
}

// Generic Downloadable Lead Magnet Component
function DownloadableLeadMagnet({ 
  leadMagnet, 
  showLeadForm, 
  setShowLeadForm,
  persona,
  funnelStage
}: { 
  leadMagnet: ContentItem; 
  showLeadForm: boolean;
  setShowLeadForm: (show: boolean) => void;
  persona: string;
  funnelStage: string;
}) {
  const metadata = leadMagnet.metadata as any;
  const leadMagnetType = metadata?.leadMagnetType || "pdf";
  const leadMagnetId = leadMagnet.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const Icon = ICON_MAP[leadMagnetType] || FileText;

  if (showLeadForm) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Get Your {leadMagnet.title}</CardTitle>
          <CardDescription>
            Enter your information to receive this resource.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadCaptureForm
            defaultPersona={persona as any}
            defaultFunnelStage={funnelStage as any}
            leadMagnetId={leadMagnetId}
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
          <Icon className="w-6 h-6 text-primary" />
          <CardTitle>{leadMagnet.title}</CardTitle>
        </div>
        <CardDescription>
          {leadMagnet.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-2">What You'll Get:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Actionable insights and practical tips</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Expert guidance from our experienced team</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Real success stories and proven strategies</span>
              </li>
            </ul>
          </div>
        </div>

        <Button 
          onClick={() => setShowLeadForm(true)} 
          className="w-full"
          data-testid="button-download"
        >
          <Download className="w-4 h-4 mr-2" />
          {leadMagnetType === "video" || leadMagnetType === "webinar" ? "Watch Now" : 
           leadMagnetType === "workshop" ? "Register Now" :
           "Download Free Resource"}
        </Button>
      </CardContent>
    </Card>
  );
}
