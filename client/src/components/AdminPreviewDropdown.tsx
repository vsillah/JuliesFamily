import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, Shield, TrendingUp, TestTube2, RotateCcw, ChevronDown, X, CheckCircle2 } from "lucide-react";
import { personaConfigs, usePersona, type Persona } from "@/contexts/PersonaContext";
import { useAdminPreviewState } from "@/hooks/useAdminPreviewState";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const funnelStageConfigs = [
  { id: "awareness", label: "Awareness (TOFU)", description: "Just discovered us" },
  { id: "consideration", label: "Consideration (MOFU)", description: "Exploring options" },
  { id: "decision", label: "Decision (BOFU)", description: "Ready to enroll/donate" },
  { id: "retention", label: "Retention", description: "Active participant" },
];

type FunnelStage = "awareness" | "consideration" | "decision" | "retention";

// Unified Variant Selector - only allows ONE variant selection across all tests
interface UnifiedVariantSelectorProps {
  activeTests: any[];
  selectedPersona: string | null;
  selectedFunnel: string | "none";
  selectedVariantId: string | undefined;
  onVariantChange: (variantId: string, testId: string) => void;
}

function UnifiedVariantSelector({ 
  activeTests, 
  selectedPersona, 
  selectedFunnel,
  selectedVariantId, 
  onVariantChange 
}: UnifiedVariantSelectorProps) {
  // Fetch variants for all active tests
  const variantQueries = useQuery({
    queryKey: ['/api/ab-tests/variants-all', activeTests.map(t => t.id)],
    queryFn: async () => {
      const results = await Promise.all(
        activeTests.map(async (test) => {
          const response = await fetch(`/api/ab-tests/${test.id}/variants`);
          if (!response.ok) return { testId: test.id, variants: [] };
          const variants = await response.json();
          return { testId: test.id, testName: test.name, testType: test.type, variants };
        })
      );
      return results;
    },
    enabled: activeTests.length > 0,
  });

  const contentTypeLabels: Record<string, string> = {
    hero_variation: "Hero",
    cta_variation: "CTA",
    service_variation: "Service",
    testimonial_variation: "Testimonial",
    event_variation: "Event",
    video_variation: "Video",
  };

  const personaLabels: Record<string, string> = {
    parent: "Parent",
    volunteer: "Volunteer",
    donor: "Donor",
    partner: "Partner",
    student: "Student",
  };

  const funnelLabels: Record<string, string> = {
    awareness: "Awareness",
    consideration: "Consideration",
    decision: "Decision",
    retention: "Retention",
  };

  if (variantQueries.isLoading) {
    return <div className="text-xs text-muted-foreground">Loading variants...</div>;
  }

  if (!variantQueries.data || variantQueries.data.length === 0) {
    return null;
  }

  // Flatten all variants with test context
  const allVariants: Array<{
    variantId: string;
    testId: string;
    testName: string;
    testType: string;
    variant: any;
  }> = [];

  variantQueries.data.forEach((testData: any) => {
    testData.variants.forEach((variant: any) => {
      allVariants.push({
        variantId: variant.id,
        testId: testData.testId,
        testName: testData.testName,
        testType: testData.testType,
        variant,
      });
    });
  });

  // Sort: control variants first, then by test name
  allVariants.sort((a, b) => {
    if (a.variant.isControl && !b.variant.isControl) return -1;
    if (!a.variant.isControl && b.variant.isControl) return 1;
    return a.testName.localeCompare(b.testName);
  });

  return (
    <div className="space-y-2">
      <RadioGroup
        value={selectedVariantId || "none"}
        onValueChange={(value) => {
          if (value === "none") {
            onVariantChange("none", "");
          } else {
            const selected = allVariants.find(v => v.variantId === value);
            if (selected) {
              onVariantChange(selected.variantId, selected.testId);
            }
          }
        }}
        className="space-y-2"
      >
        {/* No variant selected option */}
        <div
          className={cn(
            "flex items-start space-x-3 p-3 rounded-md border cursor-pointer hover-elevate",
            (!selectedVariantId || selectedVariantId === "none") && "border-primary bg-primary/5"
          )}
          onClick={() => onVariantChange("none", "")}
          data-testid="radio-variant-none"
        >
          <RadioGroupItem value="none" id="variant-none" className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <Label
              htmlFor="variant-none"
              className="text-sm font-medium cursor-pointer leading-snug"
            >
              No A/B Test Override
            </Label>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Use default experience (auto-assign per test)
            </p>
          </div>
        </div>

        {/* Variant options */}
        {allVariants.map(({ variantId, testId, testName, testType, variant }) => (
          <div
            key={variantId}
            className={cn(
              "flex items-start space-x-3 p-3 rounded-md border cursor-pointer hover-elevate",
              selectedVariantId === variantId && "border-primary bg-primary/5"
            )}
            onClick={() => onVariantChange(variantId, testId)}
            data-testid={`radio-variant-${variantId}`}
          >
            <RadioGroupItem value={variantId} id={variantId} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={variantId}
                className="text-sm font-medium cursor-pointer flex flex-wrap items-center gap-1.5 leading-snug"
              >
                <span className="break-words">{variant.name || (variant.isControl ? "Control" : "Treatment")}</span>
                {variant.isControl && (
                  <Badge variant="outline" className="text-xs shrink-0">Baseline</Badge>
                )}
              </Label>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <Badge variant="secondary" className="text-xs shrink-0">
                  {contentTypeLabels[testType] || testType}
                </Badge>
                {selectedPersona && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {personaLabels[selectedPersona] || selectedPersona}
                  </Badge>
                )}
                {selectedFunnel && selectedFunnel !== "none" && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {funnelLabels[selectedFunnel] || selectedFunnel}
                  </Badge>
                )}
              </div>
              {variant.description && (
                <p className="text-xs text-muted-foreground mt-1.5 break-words leading-relaxed">
                  {variant.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

interface AdminPreviewDropdownProps {
  isScrolled?: boolean;
}

export function AdminPreviewDropdown({ isScrolled = false }: AdminPreviewDropdownProps) {
  const { isAdmin } = useUserRole();
  const { persona: appliedPersona } = usePersona();
  const [open, setOpen] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  
  const {
    selectedPersona,
    setSelectedPersona,
    selectedFunnel,
    setSelectedFunnel,
    selectedVariant,
    setSelectedVariant,
    isPreviewActive,
    currentFunnel,
    activeTests,
    handleApply,
    handleReset,
  } = useAdminPreviewState();

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (showMobileOverlay) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showMobileOverlay]);

  if (!isAdmin) {
    return null;
  }

  // Use the actually applied persona for the trigger display, not the pending selection
  const appliedPersonaConfig = personaConfigs.find(p => p.id === appliedPersona);
  const appliedFunnelConfig = funnelStageConfigs.find(f => f.id === currentFunnel);

  // Check if mobile when button is clicked
  const handleTriggerClick = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setShowMobileOverlay(true);
    } else {
      setOpen(true);
    }
  };

  // Mobile full-screen overlay - portaled to document.body to escape stacking context
  const mobileOverlay = showMobileOverlay && typeof document !== 'undefined' && createPortal(
    <div 
      className="fixed inset-0 w-screen h-screen bg-background z-[99999]"
      data-testid="menu-admin-preview"
    >
      {/* Close button - fixed position so it stays visible while scrolling */}
      <button
        onClick={() => setShowMobileOverlay(false)}
        className="fixed top-4 right-4 h-11 w-11 flex items-center justify-center hover:bg-accent rounded-md transition-colors z-[100001] pointer-events-auto"
        data-testid="button-close-admin-preview"
        aria-label="Close preview menu"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="h-full overflow-y-auto px-4 pt-16 pb-8 relative z-[100000]">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-base">Admin Preview Mode</h2>
        </div>
        <div className="h-px bg-border mb-4" />
  
        {/* Persona Selection */}
        <div className="py-2 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Persona Type</label>
          <Select
            value={selectedPersona || "none"}
            onValueChange={(value) => setSelectedPersona(value === "none" ? null : value as Persona)}
          >
            <SelectTrigger className="h-11 text-base" data-testid="select-persona">
              <SelectValue placeholder="Select persona" />
            </SelectTrigger>
            <SelectContent className="z-[100000]">
              <SelectItem value="none">None (Unauthenticated, no selection)</SelectItem>
              <SelectItem value="default">Default (No Persona)</SelectItem>
              {personaConfigs.filter(c => c.id !== 'default').map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funnel Stage Selection */}
        <div className="py-2 space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Funnel Stage
          </label>
          <Select
            value={selectedFunnel}
            onValueChange={(value) => setSelectedFunnel(value as FunnelStage | "none")}
          >
            <SelectTrigger className="h-11 text-base" data-testid="select-funnel">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent className="z-[100000]">
              <SelectItem value="none">None selected</SelectItem>
              {funnelStageConfigs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* A/B Test Variants */}
        {activeTests && activeTests.length > 0 && (
          <>
            <div className="h-px bg-border my-4" />
            <div className="py-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <TestTube2 className="w-4 h-4" />
                A/B Test Variant Override
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Select one variant to test (only one can be active at a time)
              </p>
              <UnifiedVariantSelector
                activeTests={activeTests}
                selectedPersona={selectedPersona}
                selectedFunnel={selectedFunnel}
                selectedVariantId={selectedVariant?.variantId}
                onVariantChange={(variantId, testId) => {
                  if (variantId === "none") {
                    setSelectedVariant(null);
                  } else {
                    setSelectedVariant({ testId, variantId });
                  }
                }}
              />
            </div>
          </>
        )}

        <div className="h-px bg-border my-4" />

        {/* Action Buttons */}
        <div className="py-2 space-y-3">
          <Button
            className="w-full h-12 text-base"
            onClick={() => {
              handleApply();
              setShowMobileOverlay(false);
            }}
            data-testid="button-apply-preview-dropdown"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Preview
          </Button>
          {isPreviewActive && (
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => {
                handleReset();
                setShowMobileOverlay(false);
              }}
              data-testid="button-reset-preview-dropdown"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          )}
        </div>

        <div className="h-px bg-border my-4" />

        {/* Admin Dashboard Link & Sign Out */}
        <div className="space-y-2">
          <Link href="/admin">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base"
              data-testid="menu-admin-dashboard-dropdown"
            >
              <Shield className="w-5 h-5 mr-2" />
              Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );

  // Desktop dropdown and combined render
  return (
    <>
      {mobileOverlay}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isScrolled ? "outline" : "ghost"}
            size="sm"
            className={cn(
              "gap-2",
              !isScrolled && "border-white/30 text-white hover:bg-white/10"
            )}
            data-testid="button-admin-preview-dropdown"
            onPointerDown={(e) => {
              // Prevent Radix dropdown from opening on mobile
              const isMobile = window.innerWidth < 768;
              if (isMobile) {
                e.preventDefault();
                e.stopPropagation();
                setShowMobileOverlay(true);
                setOpen(false); // Ensure dropdown stays closed
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              const isMobile = window.innerWidth < 768;
              if (!isMobile) {
                handleTriggerClick();
              }
            }}
          >
            <Eye className={cn(
              "w-4 h-4",
              isPreviewActive && "text-primary"
            )} />
            {isPreviewActive && (
              <span className="text-xs font-medium">
                {appliedPersonaConfig?.label || "Default"}
                {appliedFunnelConfig && ` • ${appliedFunnelConfig.label}`}
              </span>
            )}
            {!isPreviewActive && (
              <span className="text-xs">Preview</span>
            )}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 z-[99999] max-h-[calc(100vh-100px)] overflow-y-auto md:block hidden" 
        data-testid="menu-admin-preview"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Admin Preview Mode
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Persona Selection */}
        <div className="px-2 py-2 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Persona Type</label>
          <Select
            value={selectedPersona || "none"}
            onValueChange={(value) => setSelectedPersona(value === "none" ? null : value as Persona)}
          >
            <SelectTrigger className="h-8 text-sm" data-testid="select-persona">
              <SelectValue placeholder="Select persona" />
            </SelectTrigger>
            <SelectContent className="z-[99999]">
              <SelectItem value="none">None (Unauthenticated, no selection)</SelectItem>
              <SelectItem value="default">Default (No Persona)</SelectItem>
              {personaConfigs.filter(c => c.id !== 'default').map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funnel Stage Selection */}
        <div className="px-2 py-2 space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Funnel Stage
          </label>
          <Select
            value={selectedFunnel}
            onValueChange={(value) => setSelectedFunnel(value as FunnelStage | "none")}
          >
            <SelectTrigger className="h-8 text-sm" data-testid="select-funnel">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent className="z-[99999]">
              <SelectItem value="none">None selected</SelectItem>
              {funnelStageConfigs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* A/B Test Variants */}
        {activeTests && activeTests.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TestTube2 className="w-3 h-3" />
                A/B Test Variant Override
              </label>
              <p className="text-[11px] text-muted-foreground mb-2">
                Select one variant to test (only one can be active at a time)
              </p>
              <UnifiedVariantSelector
                activeTests={activeTests}
                selectedPersona={selectedPersona}
                selectedFunnel={selectedFunnel}
                selectedVariantId={selectedVariant?.variantId}
                onVariantChange={(variantId, testId) => {
                  if (variantId === "none") {
                    setSelectedVariant(null);
                  } else {
                    setSelectedVariant({ testId, variantId });
                  }
                }}
              />
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Action Buttons */}
        <div className="px-2 py-2 space-y-2">
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              handleApply();
              setOpen(false);
            }}
            data-testid="button-apply-preview-dropdown"
          >
            Apply Preview
          </Button>
          {isPreviewActive && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                handleReset();
                setOpen(false);
              }}
              data-testid="button-reset-preview-dropdown"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Reset to Default
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Admin Dashboard Link */}
        <Link href="/admin">
          <DropdownMenuItem data-testid="menu-admin-dashboard-dropdown">
            <Shield className="w-4 h-4 mr-2" />
            Admin Dashboard
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
