import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import LeadCaptureForm from "./LeadCaptureForm";

interface QuizQuestion {
  id: number;
  question: string;
  options: { value: string; label: string; score: Record<string, number> }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is your current educational goal?",
    options: [
      { value: "ged", label: "Earn my GED", score: { basic_education: 3, esl: 0, workforce: 0 } },
      { value: "english", label: "Improve my English skills", score: { basic_education: 0, esl: 3, workforce: 0 } },
      { value: "job_skills", label: "Learn job skills", score: { basic_education: 0, esl: 0, workforce: 3 } },
      { value: "general", label: "Improve my basic skills", score: { basic_education: 2, esl: 1, workforce: 1 } },
    ],
  },
  {
    id: 2,
    question: "How comfortable are you with English?",
    options: [
      { value: "beginner", label: "I'm just starting to learn", score: { basic_education: 0, esl: 3, workforce: 0 } },
      { value: "intermediate", label: "I can have basic conversations", score: { basic_education: 1, esl: 2, workforce: 1 } },
      { value: "advanced", label: "I'm comfortable but want to improve", score: { basic_education: 1, esl: 1, workforce: 2 } },
      { value: "fluent", label: "English is my first language", score: { basic_education: 3, esl: 0, workforce: 2 } },
    ],
  },
  {
    id: 3,
    question: "What is your primary reason for seeking education?",
    options: [
      { value: "employment", label: "Get a better job", score: { basic_education: 1, esl: 1, workforce: 3 } },
      { value: "personal", label: "Personal growth", score: { basic_education: 2, esl: 1, workforce: 1 } },
      { value: "family", label: "Help my children with school", score: { basic_education: 2, esl: 2, workforce: 0 } },
      { value: "credential", label: "Earn a diploma or certificate", score: { basic_education: 3, esl: 0, workforce: 2 } },
    ],
  },
];

const programRecommendations: Record<string, { title: string; description: string }> = {
  basic_education: {
    title: "Basic Education & GED Preparation",
    description: "Our Basic Education program will help you build fundamental skills in reading, writing, and math. You'll work toward earning your GED and opening doors to new opportunities.",
  },
  esl: {
    title: "English as a Second Language (ESL)",
    description: "Our ESL program offers personalized instruction to help you improve your English skills for work, family, and community engagement. Classes are available at multiple levels.",
  },
  workforce: {
    title: "Workforce Development",
    description: "Our Workforce Development program provides job training, resume building, interview skills, and career counseling to help you secure meaningful employment.",
  },
};

export default function StudentReadinessQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [recommendation, setRecommendation] = useState<string>("");
  const [quizMetadata, setQuizMetadata] = useState<Record<string, any>>({});

  const progress = ((currentStep + 1) / quizQuestions.length) * 100;

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResults();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateResults = () => {
    const scores: Record<string, number> = {
      basic_education: 0,
      esl: 0,
      workforce: 0,
    };

    quizQuestions.forEach((question) => {
      const selectedAnswer = answers[question.id];
      if (selectedAnswer) {
        const option = question.options.find((opt) => opt.value === selectedAnswer);
        if (option) {
          Object.entries(option.score).forEach(([program, points]) => {
            scores[program] += points;
          });
        }
      }
    });

    const topProgram = Object.entries(scores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    setRecommendation(topProgram);
    
    // Store quiz metadata for later use when submitting lead
    setQuizMetadata({
      quizType: "student_readiness",
      answers: answers,
      scores: scores,
      recommendation: topProgram,
      programTitle: programRecommendations[topProgram].title,
    });
    
    setShowResults(true);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setShowLeadForm(false);
    setRecommendation("");
    setQuizMetadata({});
  };

  const currentQuestion = quizQuestions[currentStep];
  const canProceed = !!answers[currentQuestion?.id];

  if (showLeadForm) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Get Your Personalized Program Guide</CardTitle>
          <CardDescription>
            Based on your quiz results, we recommend our{" "}
            <strong>{programRecommendations[recommendation].title}</strong> program.
            Fill out the form below to receive detailed information and next steps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadCaptureForm
            defaultPersona="student"
            defaultFunnelStage="awareness"
            leadMagnetId="student_readiness_quiz"
            interactionMetadata={quizMetadata}
            onSuccess={handleReset}
          />
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const program = programRecommendations[recommendation];
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-6 h-6 text-primary" />
            <CardTitle>Your Recommendation</CardTitle>
          </div>
          <CardDescription>Based on your answers, here's the best program for you:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="text-xl font-serif font-semibold text-primary mb-3">{program.title}</h3>
            <p className="text-muted-foreground">{program.description}</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleReset} variant="outline" className="flex-1" data-testid="button-retake-quiz">
              Retake Quiz
            </Button>
            <Button onClick={() => setShowLeadForm(true)} className="flex-1" data-testid="button-get-program-info">
              Get Program Info
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Student Readiness Quiz</CardTitle>
        <CardDescription>
          Answer a few questions to discover which program is the best fit for your goals.
        </CardDescription>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentStep + 1} of {quizQuestions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} data-testid="progress-quiz" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
          >
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate cursor-pointer"
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} data-testid={`radio-${option.value}`} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button onClick={handleBack} variant="outline" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1"
            data-testid="button-next"
          >
            {currentStep === quizQuestions.length - 1 ? "See Results" : "Next"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
