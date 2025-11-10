import { useState } from "react";
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
import { Eye, Shield, TrendingUp, TestTube2, RotateCcw, ChevronDown } from "lucide-react";
import { personaConfigs, usePersona, type Persona } from "@/contexts/PersonaContext";
import { useAdminPreviewState } from "@/hooks/useAdminPreviewState";
import { useAuth } from "@/hooks/useAuth";
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

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">
        {contentTypeLabels[testType] || testType}
      </label>
      <Select
        value={selectedVariantId || "random"}
        onValueChange={onVariantChange}
      >
        <SelectTrigger className="h-8 text-xs" data-testid={`select-variant-${testId}`}>
          <SelectValue placeholder="Random (50/50)" />
        </SelectTrigger>
        <SelectContent className="z-[99999]">
          <SelectItem value="random">Random (50/50)</SelectItem>
          {variants.map((variant: any) => (
            <SelectItem key={variant.id} value={variant.id}>
              {variant.isControl ? "Control" : "Treatment"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface AdminPreviewDropdownProps {
  isScrolled?: boolean;
}

export function AdminPreviewDropdown({ isScrolled = false }: AdminPreviewDropdownProps) {
  const { user } = useAuth();
  const { persona: appliedPersona } = usePersona();
  const [open, setOpen] = useState(false);
  
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

  if (!user?.isAdmin) {
    return null;
  }

  // Use the actually applied persona for the trigger display, not the pending selection
  const appliedPersonaConfig = personaConfigs.find(p => p.id === appliedPersona);
  const appliedFunnelConfig = funnelStageConfigs.find(f => f.id === currentFunnel);

  return (
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
      <DropdownMenuContent align="end" className="w-80" data-testid="menu-admin-preview">
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
  );
}
