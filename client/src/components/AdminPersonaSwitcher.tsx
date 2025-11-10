import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, GraduationCap, Handshake, Baby, Heart, Hand, TrendingUp, X, TestTube2 } from "lucide-react";
import { usePersona, personaConfigs, type Persona } from "@/contexts/PersonaContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { AbTest } from "@shared/schema";

const iconComponents = {
  GraduationCap,
  Handshake,
  Baby,
  Heart,
  Hand,
};

type FunnelStage = "awareness" | "consideration" | "decision" | "retention";

const funnelStageConfigs = [
  { id: "awareness", label: "Awareness (TOFU)", description: "Just discovered us" },
  { id: "consideration", label: "Consideration (MOFU)", description: "Exploring options" },
  { id: "decision", label: "Decision (BOFU)", description: "Ready to enroll/donate" },
  { id: "retention", label: "Retention", description: "Active participant" },
];

const ADMIN_PERSONA_KEY = "admin-persona-override";
const ADMIN_FUNNEL_KEY = "admin-funnel-override";
const ADMIN_VARIANT_KEY = "admin-variant-override";

// Variant Selector Component for individual tests
interface VariantSelectorProps {
  test: AbTest;
  selectedVariantId?: string;
  onVariantChange: (variantId: string) => void;
}

function VariantSelector({ test, selectedVariantId, onVariantChange }: VariantSelectorProps) {
  const { data: variants, isLoading } = useQuery({
    queryKey: [`/api/ab-tests/${test.id}/variants`],
  });

  if (isLoading) {
    return (
      <div className="p-3 bg-background rounded border">
        <p className="text-sm text-muted-foreground">Loading variants for {test.name}...</p>
      </div>
    );
  }

  if (!variants || variants.length === 0) {
    return null;
  }

  const contentTypeLabels: Record<string, string> = {
    hero_variation: "Hero Section",
    cta_variation: "Call to Action",
    service_variation: "Service Card",
    testimonial_variation: "Testimonial",
    event_variation: "Event Card",
    video_variation: "Video Content",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium">
          {contentTypeLabels[test.type] || test.type}
        </label>
        <Badge variant="secondary" className="text-xs">
          {test.name}
        </Badge>
      </div>
      <Select
        value={selectedVariantId || "random"}
        onValueChange={onVariantChange}
      >
        <SelectTrigger className="h-8 text-sm" data-testid={`select-variant-${test.id}`}>
          <SelectValue placeholder="Random (50/50 split)" />
        </SelectTrigger>
        <SelectContent className="z-[1200]">
          <SelectItem value="random">Random Assignment (50/50)</SelectItem>
          {variants.map((variant: any) => (
            <SelectItem key={variant.id} value={variant.id}>
              {variant.isControl ? "🎯 Control" : "🧪 Treatment"} - {variant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedVariantId && selectedVariantId !== "random" && (
        <p className="text-xs text-muted-foreground">
          {variants.find((v: any) => v.id === selectedVariantId)?.isControl 
            ? "Control: Original content without overrides" 
            : "Treatment: Modified content with A/B configuration"}
        </p>
      )}
    </div>
  );
}

interface AdminPersonaSwitcherProps {
  isScrolled?: boolean;
  onOpenDialog?: () => void;
}

export function AdminPersonaSwitcher({ isScrolled = false, onOpenDialog }: AdminPersonaSwitcherProps) {
  const { user } = useAuth();
  const { persona, setPersona } = usePersona();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(persona);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelStage | "none">(
    sessionStorage.getItem(ADMIN_FUNNEL_KEY) as FunnelStage || "none"
  );
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Fetch active A/B tests for the selected persona×funnel combination
  const { data: activeTests } = useQuery<AbTest[]>({
    queryKey: ["/api/ab-tests/active", { 
      persona: selectedPersona || undefined, 
      funnelStage: selectedFunnel !== "none" ? selectedFunnel : undefined 
    }],
    enabled: showDialog, // Only fetch when dialog is open
  });

  useEffect(() => {
    const adminPersonaOverride = sessionStorage.getItem(ADMIN_PERSONA_KEY);
    if (adminPersonaOverride && adminPersonaOverride !== "none") {
      setSelectedPersona(adminPersonaOverride as Persona);
    } else {
      setSelectedPersona(persona);
    }

    const adminFunnelOverride = sessionStorage.getItem(ADMIN_FUNNEL_KEY);
    if (adminFunnelOverride) {
      setSelectedFunnel(adminFunnelOverride as FunnelStage);
    } else {
      setSelectedFunnel("none");
    }

    // Load variant overrides from sessionStorage
    const savedVariants = sessionStorage.getItem(ADMIN_VARIANT_KEY);
    if (savedVariants) {
      try {
        setSelectedVariants(JSON.parse(savedVariants));
      } catch (e) {
        setSelectedVariants({});
      }
    }
  }, [persona]);

  if (!user?.isAdmin) {
    return null;
  }

  const handleApply = async () => {
    await setPersona(selectedPersona);
    if (selectedFunnel && selectedFunnel !== "none") {
      sessionStorage.setItem(ADMIN_FUNNEL_KEY, selectedFunnel);
    } else {
      sessionStorage.removeItem(ADMIN_FUNNEL_KEY);
    }
    sessionStorage.setItem(ADMIN_PERSONA_KEY, selectedPersona || "none");
    
    // Save variant overrides
    if (Object.keys(selectedVariants).length > 0) {
      sessionStorage.setItem(ADMIN_VARIANT_KEY, JSON.stringify(selectedVariants));
    } else {
      sessionStorage.removeItem(ADMIN_VARIANT_KEY);
    }
    
    setShowDialog(false);
    window.location.reload();
  };

  const handleReset = async () => {
    await setPersona(null);
    setSelectedPersona(null);
    setSelectedFunnel("none");
    setSelectedVariants({});
    sessionStorage.removeItem(ADMIN_FUNNEL_KEY);
    sessionStorage.removeItem(ADMIN_PERSONA_KEY);
    sessionStorage.removeItem(ADMIN_VARIANT_KEY);
    setShowDialog(false);
    window.location.reload();
  };

  const isOverriding = sessionStorage.getItem(ADMIN_PERSONA_KEY) !== null;
  const currentFunnel = sessionStorage.getItem(ADMIN_FUNNEL_KEY) as FunnelStage;
  const currentPersonaConfig = personaConfigs.find(p => p.id === persona);
  const currentFunnelConfig = funnelStageConfigs.find(f => f.id === currentFunnel);

  return (
    <>
      <div className="flex items-center gap-2">
        {isOverriding && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Viewing as: {currentPersonaConfig?.label || "Default"}
              {currentFunnelConfig && ` • ${currentFunnelConfig.label}`}
            </span>
          </div>
        )}
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setShowDialog(true);
            // Small delay before closing mobile menu to allow dialog to open
            setTimeout(() => onOpenDialog?.(), 100);
          }}
          data-testid="button-admin-persona-switcher"
          className={isScrolled ? "" : "border-white/30 text-white hover:bg-white/10"}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Mode
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogPortal>
          <DialogOverlay className="z-[1100]" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-[1100] grid w-full max-w-[600px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
            )}
            data-testid="dialog-admin-persona-switcher"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Admin Preview Mode
              </DialogTitle>
              <DialogDescription>
                Preview the site from different user perspectives. Choose a persona type and funnel stage to see personalized content.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Persona Type</label>
                <Select
                  value={selectedPersona || "none"}
                  onValueChange={(value) => setSelectedPersona(value === "none" ? null : value as Persona)}
                >
                  <SelectTrigger data-testid="select-persona">
                    <SelectValue placeholder="Select a persona" />
                  </SelectTrigger>
                  <SelectContent className="z-[1200]">
                    <SelectItem value="none">Default (No persona)</SelectItem>
                    {personaConfigs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPersona && (
                  <p className="text-sm text-muted-foreground">
                    {personaConfigs.find(p => p.id === selectedPersona)?.description}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Funnel Stage
                </label>
                <Select
                  value={selectedFunnel}
                  onValueChange={(value) => setSelectedFunnel(value as FunnelStage | "none")}
                >
                  <SelectTrigger data-testid="select-funnel">
                    <SelectValue placeholder="Select a funnel stage" />
                  </SelectTrigger>
                  <SelectContent className="z-[1200]">
                    <SelectItem value="none">None selected</SelectItem>
                    {funnelStageConfigs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFunnel && selectedFunnel !== "none" && (
                  <p className="text-sm text-muted-foreground">
                    {funnelStageConfigs.find(f => f.id === selectedFunnel)?.description}
                  </p>
                )}
              </div>

              {/* A/B Test Variant Selection */}
              {activeTests && activeTests.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <TestTube2 className="w-4 h-4" />
                    A/B Test Variants
                  </label>
                  <div className="bg-primary/5 p-4 rounded-md border border-primary/20 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {activeTests.length} active {activeTests.length === 1 ? 'test' : 'tests'} for this persona×journey combination. Choose which variant to preview:
                    </p>
                    {activeTests.map((test) => (
                      <VariantSelector
                        key={test.id}
                        test={test}
                        selectedVariantId={selectedVariants[test.id]}
                        onVariantChange={(variantId) => {
                          setSelectedVariants(prev => ({
                            ...prev,
                            [test.id]: variantId
                          }));
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-md border">
                <p className="text-sm text-muted-foreground">
                  <strong>Preview Mode</strong> lets you see how different users experience the site. Content will be personalized based on the selected persona and funnel stage{activeTests && activeTests.length > 0 ? ', plus any A/B test variants you select' : ''}.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {isOverriding && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  data-testid="button-reset-view"
                >
                  Reset to Default
                </Button>
              )}
              <Button
                onClick={handleApply}
                data-testid="button-apply-view"
              >
                Apply Preview
              </Button>
            </div>

            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
