import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Check, Code2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ValueEquationWizard from "./ValueEquationWizard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Persona, FunnelStage } from "@shared/defaults/personas";
import type {
  ValueEquationInputs,
  GeneratedVariant,
  CopyGenerationRequest,
  CopyGenerationResponse,
  ContentType,
} from "@shared/valueEquation";

interface CopyVariantGeneratorProps {
  originalContent: string;
  contentType: ContentType;
  persona?: Persona;
  funnelStage?: FunnelStage;
  onSelectVariant: (variant: string) => void;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost";
}

export default function CopyVariantGenerator({
  originalContent,
  contentType,
  persona,
  funnelStage,
  onSelectVariant,
  buttonText = "✨ Generate AI Copy",
  buttonVariant = "outline",
}: CopyVariantGeneratorProps) {
  const { toast } = useToast();
  const [showWizard, setShowWizard] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [variants, setVariants] = useState<GeneratedVariant[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(null);
  const [editedVariant, setEditedVariant] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const generateMutation = useMutation({
    mutationFn: async (valueEquation: ValueEquationInputs) => {
      const request: CopyGenerationRequest = {
        originalContent,
        contentType,
        persona,
        funnelStage,
        valueEquation,
        allowCustomPrompt: showCustomPrompt && !!customPrompt,
        customPrompt: showCustomPrompt ? customPrompt : undefined,
      };

      const response = await apiRequest(
        "POST",
        "/api/ai/generate-copy",
        request
      );
      const data: CopyGenerationResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setVariants(data.variants);
      setShowVariants(true);
      setShowWizard(false);
      
      if (data.variants.length > 0) {
        setSelectedVariantIndex(0);
        setEditedVariant(data.variants[0].text);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description:
          error.message ||
          "Failed to generate copy variants. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [pendingInputs, setPendingInputs] = useState<ValueEquationInputs | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  const handleWizardComplete = (inputs: ValueEquationInputs) => {
    setPendingInputs(inputs);
    setShowPromptEditor(true);
    setShowWizard(false);
  };

  const handleGenerate = () => {
    if (pendingInputs) {
      // Update the mutation to use custom prompt if provided
      if (customPrompt && customPrompt.trim() !== "Default AI prompt will be used based on your Value Equation inputs.") {
        setShowCustomPrompt(true);
      }
      generateMutation.mutate(pendingInputs);
      setShowPromptEditor(false);
    }
  };

  const handleSelectVariant = () => {
    if (editedVariant) {
      onSelectVariant(editedVariant);
      handleReset();
      toast({
        title: "Copy Selected",
        description: "The AI-generated copy has been applied.",
      });
    }
  };

  const handleReset = () => {
    setShowWizard(false);
    setShowVariants(false);
    setShowPromptEditor(false);
    setVariants([]);
    setSelectedVariantIndex(null);
    setEditedVariant("");
    setShowCustomPrompt(false);
    setCustomPrompt("");
    setPendingInputs(null);
  };

  const getFocusLabel = (focus: GeneratedVariant["focus"]) => {
    const labels = {
      dream_outcome: "Dream Outcome",
      perceived_likelihood: "Trust & Proof",
      time_delay: "Speed Focus",
      effort_sacrifice: "Ease Focus",
      balanced: "Balanced",
    };
    return labels[focus] || focus;
  };

  const getFocusColor = (focus: GeneratedVariant["focus"]) => {
    const colors = {
      dream_outcome: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      perceived_likelihood: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      time_delay: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      effort_sacrifice: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      balanced: "bg-primary/20 text-primary",
    };
    return colors[focus] || "bg-muted text-muted-foreground";
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={() => setShowWizard(true)}
        data-testid="button-open-copy-generator"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>

      <ValueEquationWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        persona={persona}
        onComplete={handleWizardComplete}
      />

      {/* Custom Prompt Editor (Advanced) */}
      <Dialog open={showPromptEditor} onOpenChange={setShowPromptEditor}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Advanced: Customize AI Prompt
            </DialogTitle>
            <DialogDescription>
              Review and customize the prompt that will be sent to the AI. Most users can skip this step.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customPrompt">AI Prompt (Advanced Users Only)</Label>
              <Textarea
                id="customPrompt"
                value={customPrompt || "Default AI prompt will be used based on your Value Equation inputs."}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom prompt here..."
                className="min-h-[200px] font-mono text-sm mt-2"
                data-testid="textarea-custom-prompt"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Leave empty to use the default prompt. Customize only if you understand AI prompt engineering.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setShowPromptEditor(false);
                setShowWizard(true);
              }}
              data-testid="button-back-to-wizard"
            >
              ← Back to Wizard
            </Button>
            <Button
              onClick={handleGenerate}
              data-testid="button-generate-from-prompt"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Variants
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVariants} onOpenChange={setShowVariants}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-serif">
              Choose Your Copy Variant
            </DialogTitle>
            <DialogDescription className="text-base">
              Our AI generated 3 variants using the Value Equation framework.
              Select one below or edit it to make it perfect.
            </DialogDescription>
          </DialogHeader>

          {generateMutation.isPending ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Generating compelling copy variants...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-6 space-y-4">
                {/* Variant Selection */}
                <div className="grid gap-3">
                  {variants.map((variant, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedVariantIndex(index);
                        setEditedVariant(variant.text);
                      }}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        selectedVariantIndex === index
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid={`button-select-variant-${index}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Badge
                          className={`${getFocusColor(variant.focus)} shrink-0`}
                        >
                          {getFocusLabel(variant.focus)}
                        </Badge>
                        {selectedVariantIndex === index && (
                          <Check className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-foreground mb-2">{variant.text}</p>
                      <p className="text-sm text-muted-foreground">
                        {variant.explanation}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Editable Version */}
                {selectedVariantIndex !== null && (
                  <div className="pt-4 space-y-3">
                    <Label htmlFor="editVariant" className="text-base">
                      Edit Your Selected Copy
                    </Label>
                    <Textarea
                      id="editVariant"
                      data-testid="textarea-edit-variant"
                      value={editedVariant}
                      onChange={(e) => setEditedVariant(e.target.value)}
                      className="min-h-[120px]"
                      placeholder="Edit the selected copy variant..."
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  data-testid="button-cancel-variant-selection"
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowVariants(false);
                      setShowWizard(true);
                    }}
                    data-testid="button-try-again"
                  >
                    Try Different Inputs
                  </Button>
                  <Button
                    onClick={handleSelectVariant}
                    disabled={!editedVariant}
                    data-testid="button-apply-variant"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Use This Copy
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
