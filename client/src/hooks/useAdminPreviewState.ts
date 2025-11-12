import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePersona, type Persona } from "@/contexts/PersonaContext";
import { queryClient } from "@/lib/queryClient";
import type { AbTest } from "@shared/schema";

type FunnelStage = "awareness" | "consideration" | "decision" | "retention";

const ADMIN_PERSONA_KEY = "admin-persona-override";
const ADMIN_FUNNEL_KEY = "admin-funnel-override";
const ADMIN_VARIANT_KEY = "admin-variant-override";

export function useAdminPreviewState() {
  const { persona, setPersona } = usePersona();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(persona);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelStage | "none">("none");
  // Single variant selection: only ONE variant can be selected at a time
  const [selectedVariant, setSelectedVariant] = useState<{ testId: string; variantId: string } | null>(null);
  
  // Track if we're in the initial hydration phase
  const isInitialHydration = useRef(true);

  // Load initial state from sessionStorage
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

    const savedVariants = sessionStorage.getItem(ADMIN_VARIANT_KEY);
    if (savedVariants) {
      try {
        const parsed = JSON.parse(savedVariants);
        // Convert from old Record format to new single-selection format if needed
        if (typeof parsed === 'object' && parsed !== null) {
          const entries = Object.entries(parsed);
          if (entries.length > 0) {
            const [testId, variantId] = entries[0] as [string, string];
            setSelectedVariant({ testId, variantId });
          }
        }
      } catch (e) {
        setSelectedVariant(null);
      }
    }
    
    // Mark initial hydration as complete
    isInitialHydration.current = false;
  }, [persona]);

  // Clear variant selection when persona or funnel changes (but not during initial hydration)
  useEffect(() => {
    // Skip clearing during initial hydration to preserve saved variant
    if (isInitialHydration.current) return;
    
    setSelectedVariant(null);
  }, [selectedPersona, selectedFunnel]);

  // Fetch active A/B tests for selected persona×funnel combination
  const { data: activeTests, isLoading: testsLoading } = useQuery<AbTest[]>({
    queryKey: ["/api/ab-tests/active", { 
      persona: selectedPersona || undefined, 
      funnelStage: selectedFunnel !== "none" ? selectedFunnel : undefined 
    }],
  });

  // Check if preview mode is currently active
  const isPreviewActive = sessionStorage.getItem(ADMIN_PERSONA_KEY) !== null;
  
  // Get current override values from sessionStorage
  const currentFunnel = sessionStorage.getItem(ADMIN_FUNNEL_KEY) as FunnelStage;

  const handleApply = async () => {
    await setPersona(selectedPersona);
    
    if (selectedFunnel && selectedFunnel !== "none") {
      sessionStorage.setItem(ADMIN_FUNNEL_KEY, selectedFunnel);
    } else {
      sessionStorage.removeItem(ADMIN_FUNNEL_KEY);
    }
    
    sessionStorage.setItem(ADMIN_PERSONA_KEY, selectedPersona || "none");
    
    // Save single variant override (only if valid selection exists)
    if (selectedVariant && selectedVariant.variantId && selectedVariant.variantId !== "none") {
      const variantOverride = { [selectedVariant.testId]: selectedVariant.variantId };
      sessionStorage.setItem(ADMIN_VARIANT_KEY, JSON.stringify(variantOverride));
    } else {
      sessionStorage.removeItem(ADMIN_VARIANT_KEY);
    }
    
    // Invalidate all queries to refetch with new persona/funnel/variant settings
    await queryClient.invalidateQueries();
  };

  const handleReset = async () => {
    await setPersona(null);
    setSelectedPersona(null);
    setSelectedFunnel("none");
    setSelectedVariant(null);
    sessionStorage.removeItem(ADMIN_FUNNEL_KEY);
    sessionStorage.removeItem(ADMIN_PERSONA_KEY);
    sessionStorage.removeItem(ADMIN_VARIANT_KEY);
    
    // Invalidate all queries to refetch with default settings
    await queryClient.invalidateQueries();
  };

  return {
    // State
    selectedPersona,
    setSelectedPersona,
    selectedFunnel,
    setSelectedFunnel,
    selectedVariant,
    setSelectedVariant,
    
    // Derived state
    isPreviewActive,
    currentFunnel,
    
    // A/B tests
    activeTests,
    testsLoading,
    
    // Actions
    handleApply,
    handleReset,
  };
}
