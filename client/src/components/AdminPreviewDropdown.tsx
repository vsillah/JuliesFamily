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

// Variant Selector for individual A/B tests
interface VariantSelectorProps {
  testId: string;
  testName: string;
  testType: string;
  selectedVariantId?: string;
  onVariantChange: (variantId: string) => void;
}

function VariantSelector({ testId, testName, testType, selectedVariantId, onVariantChange }: VariantSelectorProps) {
  const { data: variants, isLoading } = useQuery({
    queryKey: [`/api/ab-tests/${testId}/variants`],
  });

  if (isLoading) {
    return <div className="text-xs text-muted-foreground">Loading variants...</div>;
  }

  if (!variants || variants.length === 0) {
    return null;
  }

  const contentTypeLabels: Record<string, string> = {
    hero_variation: "Hero",
    cta_variation: "CTA",
    service_variation: "Service",
    testimonial_variation: "Testimonial",
    event_variation: "Event",
    video_variation: "Video",
  };

  // Calculate total traffic for auto-assign display
  const totalTraffic = variants.reduce((sum: number, v: any) => sum + (v.trafficWeight || 0), 0);
  const trafficDisplay = variants
    .map((v: any) => `${v.trafficWeight || 0}%`)
    .join(' / ');

  // Sort variants to show control first
  const sortedVariants = [...variants].sort((a: any, b: any) => {
    if (a.isControl && !b.isControl) return -1;
    if (!a.isControl && b.isControl) return 1;
    return 0;
  });

  return (
    <div className="space-y-2 border rounded-md p-2 sm:p-3 bg-card/50">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium truncate">
          {contentTypeLabels[testType] || testType}
        </label>
        <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0 px-1.5 py-0">
          Preview Override
        </Badge>
      </div>
      
      <RadioGroup
        value={selectedVariantId || "auto"}
        onValueChange={onVariantChange}
        className="space-y-1.5 sm:space-y-2"
      >
        {/* Auto-assign option */}
        <div
          className={cn(
            "flex items-start space-x-2 p-2 sm:p-2.5 rounded-md border cursor-pointer hover-elevate",
            (!selectedVariantId || selectedVariantId === "auto") && "border-primary bg-primary/5"
          )}
          onClick={() => onVariantChange("auto")}
          data-testid={`radio-variant-auto-${testId}`}
        >
          <RadioGroupItem value="auto" id={`auto-${testId}`} className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <Label
              htmlFor={`auto-${testId}`}
              className="text-xs font-medium cursor-pointer flex flex-wrap items-center gap-1 sm:gap-2"
            >
              <span>Auto-assign</span>
              <span className="text-muted-foreground font-normal text-[11px] sm:text-xs">({trafficDisplay})</span>
            </Label>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Randomly assign based on traffic allocation
            </p>
          </div>
        </div>

        {/* Variant options */}
        {sortedVariants.map((variant: any) => (
          <div
            key={variant.id}
            className={cn(
              "flex items-start space-x-2 p-2 sm:p-2.5 rounded-md border cursor-pointer hover-elevate",
              selectedVariantId === variant.id && "border-primary bg-primary/5"
            )}
            onClick={() => onVariantChange(variant.id)}
            data-testid={`radio-variant-${variant.id}`}
          >
            <RadioGroupItem value={variant.id} id={variant.id} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={variant.id}
                className="text-xs font-medium cursor-pointer flex flex-wrap items-center gap-1 sm:gap-2"
              >
                <span className="truncate">{variant.name || (variant.isControl ? "Control" : "Treatment")}</span>
                {variant.isControl && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">Baseline</Badge>
                )}
                <span className="text-muted-foreground font-normal text-[11px] sm:text-xs shrink-0">{variant.trafficWeight}%</span>
              </Label>
              {variant.description && (
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 break-words">
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
    selectedVariants,
    setSelectedVariants,
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
      className="fixed inset-0 w-screen h-screen bg-background z-[99999] overflow-y-auto"
      data-testid="menu-admin-preview"
    >
      {/* Close button */}
      <button
        onClick={() => setShowMobileOverlay(false)}
        className="absolute top-3 right-3 p-2 hover:bg-accent rounded-md transition-colors z-10"
        data-testid="button-close-admin-preview"
        aria-label="Close preview menu"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="px-3 pt-14 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Admin Preview Mode</h2>
        </div>
        <div className="h-px bg-border mb-3" />
  
        {/* Persona Selection */}
        <div className="py-1.5 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Persona Type</label>
          <Select
            value={selectedPersona || "none"}
            onValueChange={(value) => setSelectedPersona(value === "none" ? null : value as Persona)}
          >
            <SelectTrigger className="h-9 text-sm" data-testid="select-persona">
              <SelectValue placeholder="Select persona" />
            </SelectTrigger>
            <SelectContent className="z-[100000]">
              <SelectItem value="none">Default (No persona)</SelectItem>
              {personaConfigs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funnel Stage Selection */}
        <div className="py-1.5 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Funnel Stage
          </label>
          <Select
            value={selectedFunnel}
            onValueChange={(value) => setSelectedFunnel(value as FunnelStage | "none")}
          >
            <SelectTrigger className="h-9 text-sm" data-testid="select-funnel">
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
            <div className="h-px bg-border my-3" />
            <div className="py-1.5 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TestTube2 className="w-3 h-3" />
                A/B Test Variants ({activeTests.length})
              </label>
              <div className="space-y-1.5">
                {activeTests.map((test) => (
                  <VariantSelector
                    key={test.id}
                    testId={test.id}
                    testName={test.name}
                    testType={test.type}
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
          </>
        )}

        <div className="h-px bg-border my-3" />

        {/* Action Buttons */}
        <div className="py-1.5 space-y-2">
          <Button
            size="sm"
            className="w-full h-10"
            onClick={() => {
              handleApply();
              setShowMobileOverlay(false);
            }}
            data-testid="button-apply-preview-dropdown"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Apply Preview
          </Button>
          {isPreviewActive && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-10"
              onClick={() => {
                handleReset();
                setShowMobileOverlay(false);
              }}
              data-testid="button-reset-preview-dropdown"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" />
              Reset to Default
            </Button>
          )}
        </div>

        <div className="h-px bg-border my-3" />

        {/* Admin Dashboard Link */}
        <Link href="/admin">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-10"
            data-testid="menu-admin-dashboard-dropdown"
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
        </Link>
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
            onClick={(e) => {
              e.preventDefault();
              handleTriggerClick();
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
        className="w-80 z-[99999] max-h-[calc(100vh-100px)] overflow-y-auto" 
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
              <SelectItem value="none">Default (No persona)</SelectItem>
              {personaConfigs.map((config) => (
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
                A/B Test Variants ({activeTests.length})
              </label>
              <div className="space-y-2">
                {activeTests.map((test) => (
                  <VariantSelector
                    key={test.id}
                    testId={test.id}
                    testName={test.name}
                    testType={test.type}
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
