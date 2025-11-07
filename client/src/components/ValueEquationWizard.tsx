import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Lightbulb, Sparkles } from "lucide-react";
import type { Persona } from "@shared/defaults/personas";
import type { ValueEquationInputs } from "@shared/valueEquation";
import {
  VALUE_EQUATION_TEMPLATES,
  DEFAULT_VALUE_EQUATION_TEMPLATE,
} from "@shared/valueEquation";

interface ValueEquationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona?: Persona;
  onComplete: (inputs: ValueEquationInputs) => void;
}

export default function ValueEquationWizard({
  open,
  onOpenChange,
  persona,
  onComplete,
}: ValueEquationWizardProps) {
  const template = persona
    ? VALUE_EQUATION_TEMPLATES[persona]
    : DEFAULT_VALUE_EQUATION_TEMPLATE;

  const [inputs, setInputs] = useState<ValueEquationInputs>({
    dreamOutcome: "",
    perceivedLikelihood: "",
    timeDelay: "",
    effortSacrifice: "",
  });

  const [expandedSection, setExpandedSection] = useState<
    "dreamOutcome" | "perceivedLikelihood" | "timeDelay" | "effortSacrifice" | null
  >("dreamOutcome");

  const handleComplete = () => {
    // Validate that all fields are filled
    if (
      !inputs.dreamOutcome ||
      !inputs.perceivedLikelihood ||
      !inputs.timeDelay ||
      !inputs.effortSacrifice
    ) {
      return; // Could add toast notification here
    }

    onComplete(inputs);
    handleReset();
  };

  const handleReset = () => {
    setInputs({
      dreamOutcome: "",
      perceivedLikelihood: "",
      timeDelay: "",
      effortSacrifice: "",
    });
    setExpandedSection("dreamOutcome");
  };

  const isComplete =
    inputs.dreamOutcome &&
    inputs.perceivedLikelihood &&
    inputs.timeDelay &&
    inputs.effortSacrifice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-serif">
                AI Copy Assistant
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Answer these questions to help our AI create compelling copy
                using the Value Equation framework. Your answers will guide the
                AI to write copy that resonates with{" "}
                {persona ? template.label.toLowerCase() + "s" : "your audience"}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {/* Dream Outcome */}
          <Collapsible
            open={expandedSection === "dreamOutcome"}
            onOpenChange={(isOpen) =>
              setExpandedSection(isOpen ? "dreamOutcome" : null)
            }
          >
            <CollapsibleTrigger
              className="w-full"
              data-testid="button-expand-dream-outcome"
            >
              <div className="flex items-center justify-between p-4 bg-card rounded-lg border hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    1
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">
                      {template.dreamOutcome.label}
                    </h3>
                    {inputs.dreamOutcome && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Answered ✓
                      </p>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === "dreamOutcome" ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 px-4">
              <div className="space-y-3">
                <Label htmlFor="dreamOutcome">Your Answer</Label>
                <Textarea
                  id="dreamOutcome"
                  data-testid="input-dream-outcome"
                  placeholder={template.dreamOutcome.placeholder}
                  value={inputs.dreamOutcome}
                  onChange={(e) =>
                    setInputs({ ...inputs, dreamOutcome: e.target.value })
                  }
                  className="min-h-[100px]"
                />
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Examples for inspiration:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {template.dreamOutcome.examples.map((example, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Perceived Likelihood */}
          <Collapsible
            open={expandedSection === "perceivedLikelihood"}
            onOpenChange={(isOpen) =>
              setExpandedSection(isOpen ? "perceivedLikelihood" : null)
            }
          >
            <CollapsibleTrigger
              className="w-full"
              data-testid="button-expand-perceived-likelihood"
            >
              <div className="flex items-center justify-between p-4 bg-card rounded-lg border hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    2
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">
                      {template.perceivedLikelihood.label}
                    </h3>
                    {inputs.perceivedLikelihood && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Answered ✓
                      </p>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === "perceivedLikelihood" ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 px-4">
              <div className="space-y-3">
                <Label htmlFor="perceivedLikelihood">Your Answer</Label>
                <Textarea
                  id="perceivedLikelihood"
                  data-testid="input-perceived-likelihood"
                  placeholder={template.perceivedLikelihood.placeholder}
                  value={inputs.perceivedLikelihood}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      perceivedLikelihood: e.target.value,
                    })
                  }
                  className="min-h-[100px]"
                />
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Examples for inspiration:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {template.perceivedLikelihood.examples.map(
                          (example, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{example}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Time Delay */}
          <Collapsible
            open={expandedSection === "timeDelay"}
            onOpenChange={(isOpen) =>
              setExpandedSection(isOpen ? "timeDelay" : null)
            }
          >
            <CollapsibleTrigger
              className="w-full"
              data-testid="button-expand-time-delay"
            >
              <div className="flex items-center justify-between p-4 bg-card rounded-lg border hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    3
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">{template.timeDelay.label}</h3>
                    {inputs.timeDelay && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Answered ✓
                      </p>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === "timeDelay" ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 px-4">
              <div className="space-y-3">
                <Label htmlFor="timeDelay">Your Answer</Label>
                <Textarea
                  id="timeDelay"
                  data-testid="input-time-delay"
                  placeholder={template.timeDelay.placeholder}
                  value={inputs.timeDelay}
                  onChange={(e) =>
                    setInputs({ ...inputs, timeDelay: e.target.value })
                  }
                  className="min-h-[100px]"
                />
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Examples for inspiration:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {template.timeDelay.examples.map((example, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Effort & Sacrifice */}
          <Collapsible
            open={expandedSection === "effortSacrifice"}
            onOpenChange={(isOpen) =>
              setExpandedSection(isOpen ? "effortSacrifice" : null)
            }
          >
            <CollapsibleTrigger
              className="w-full"
              data-testid="button-expand-effort-sacrifice"
            >
              <div className="flex items-center justify-between p-4 bg-card rounded-lg border hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    4
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">
                      {template.effortSacrifice.label}
                    </h3>
                    {inputs.effortSacrifice && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Answered ✓
                      </p>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === "effortSacrifice" ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 px-4">
              <div className="space-y-3">
                <Label htmlFor="effortSacrifice">Your Answer</Label>
                <Textarea
                  id="effortSacrifice"
                  data-testid="input-effort-sacrifice"
                  placeholder={template.effortSacrifice.placeholder}
                  value={inputs.effortSacrifice}
                  onChange={(e) =>
                    setInputs({ ...inputs, effortSacrifice: e.target.value })
                  }
                  className="min-h-[100px]"
                />
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Examples for inspiration:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {template.effortSacrifice.examples.map((example, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="border-t pt-4 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-wizard"
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!isComplete}
            data-testid="button-complete-wizard"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Copy Variants
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
