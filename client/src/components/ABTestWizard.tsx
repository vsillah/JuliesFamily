import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { DiscoverStep } from "./wizard-steps/DiscoverStep";
import { ConfigureStep } from "./wizard-steps/ConfigureStep";
import { TargetStep } from "./wizard-steps/TargetStep";
import { ReviewStep } from "./wizard-steps/ReviewStep";

export type TestType = "hero" | "cta" | "card_order" | "messaging" | "layout";
export type Persona = "student" | "provider" | "parent" | "volunteer" | "donor" | null;
export type FunnelStage = "awareness" | "consideration" | "decision" | "retention" | null;

export interface TestVariantConfig {
  id: string;
  name: string;
  description: string;
  trafficWeight: number;
  isControl: boolean;
  contentItemId?: string;
  configuration: Record<string, any>;
}

export interface TestConfiguration {
  name: string;
  description: string;
  type: TestType;
  targetPersona: Persona;
  targetFunnelStage: FunnelStage;
  trafficAllocation: number;
  variants: TestVariantConfig[];
}

interface ABTestWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (config: TestConfiguration) => void;
}

const WIZARD_STEPS = [
  { id: "discover", label: "Discover", description: "Find opportunities" },
  { id: "configure", label: "Configure", description: "Build variants" },
  { id: "target", label: "Target", description: "Choose audience" },
  { id: "review", label: "Review", description: "Preview & launch" },
];

function mapTestTypeToInternal(type: TestType): string {
  const typeMap: Record<TestType, string> = {
    hero: "hero_variation",
    cta: "cta_variation",
    card_order: "service_card_order",
    messaging: "messaging_test",
    layout: "layout_test",
  };
  return typeMap[type] || type;
}

export function ABTestWizard({ open, onOpenChange, onComplete }: ABTestWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [testConfig, setTestConfig] = useState<TestConfiguration>({
    name: "",
    description: "",
    type: "hero",
    targetPersona: null,
    targetFunnelStage: null,
    trafficAllocation: 100,
    variants: [],
  });

  const updateConfig = (updates: Partial<TestConfiguration>) => {
    setTestConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSelectRecommendation = (testType: TestType, reason: string) => {
    updateConfig({
      type: testType,
      name: reason,
      description: `Automatically suggested based on performance data`,
    });
    handleNext();
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete(testConfig);
    handleClose();
  };

  const isLaunchReady = () => {
    if (testConfig.variants.length < 2) return false;
    const hasControl = testConfig.variants.some(v => v.isControl);
    if (!hasControl) return false;
    const totalWeight = testConfig.variants.reduce((sum, v) => sum + v.trafficWeight, 0);
    if (totalWeight !== 100) return false;
    return true;
  };

  const handleClose = () => {
    setCurrentStep(0);
    setTestConfig({
      name: "",
      description: "",
      type: "hero",
      targetPersona: null,
      targetFunnelStage: null,
      trafficAllocation: 100,
      variants: [],
    });
    onOpenChange(false);
  };

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="border-b px-6 py-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-serif">Create A/B Test</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].label}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                data-testid="button-close-wizard"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {WIZARD_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center ${
                    index === currentStep
                      ? "text-primary font-medium"
                      : index < currentStep
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                  }`}
                >
                  <div className="text-xs">{step.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 0 && (
            <DiscoverStep onSelectRecommendation={handleSelectRecommendation} />
          )}

          {currentStep === 1 && (
            <ConfigureStep
              testType={mapTestTypeToInternal(testConfig.type)}
              variants={testConfig.variants}
              onVariantsChange={(variants) => updateConfig({ variants })}
            />
          )}

          {currentStep === 2 && (
            <TargetStep
              targetPersona={testConfig.targetPersona}
              targetFunnelStage={testConfig.targetFunnelStage}
              trafficAllocation={testConfig.trafficAllocation}
              onPersonaChange={(persona) => updateConfig({ targetPersona: persona })}
              onFunnelStageChange={(stage) => updateConfig({ targetFunnelStage: stage })}
              onTrafficChange={(traffic) => updateConfig({ trafficAllocation: traffic })}
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              testName={testConfig.name}
              testDescription={testConfig.description}
              testType={mapTestTypeToInternal(testConfig.type)}
              variants={testConfig.variants}
              targetPersona={testConfig.targetPersona}
              targetFunnelStage={testConfig.targetFunnelStage}
              trafficAllocation={testConfig.trafficAllocation}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t px-6 py-4 flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            data-testid="button-wizard-back"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-wizard-cancel"
            >
              Cancel
            </Button>

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                data-testid="button-wizard-next"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!isLaunchReady()}
                data-testid="button-wizard-complete"
              >
                Launch Test
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
