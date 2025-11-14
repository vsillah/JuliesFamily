import { useState, useEffect, useLayoutEffect, useRef } from "react";
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
  
  // Track previous values to detect actual changes (not just initial hydration)
  const prevPersona = useRef<Persona | null | undefined>(undefined);
  const prevFunnel = useRef<FunnelStage | "none" | undefined>(undefined);
  const isHydrating = useRef(true);
  const hasHydrated = useRef(false);

  // Load initial state from sessionStorage (runs only once on mount)
  useEffect(() => {
    const adminPersonaOverride = sessionStorage.getItem(ADMIN_PERSONA_KEY);
    const loadedPersona = (adminPersonaOverride && adminPersonaOverride !== "none") 
      ? adminPersonaOverride as Persona 
      : persona;
    setSelectedPersona(loadedPersona);

    const adminFunnelOverride = sessionStorage.getItem(ADMIN_FUNNEL_KEY);
    const loadedFunnel = adminFunnelOverride 
      ? adminFunnelOverride as FunnelStage 
      : "none";
    setSelectedFunnel(loadedFunnel);

    const savedVariants = sessionStorage.getItem(ADMIN_VARIANT_KEY);
    console.log('[useAdminPreviewState] Hydration: loading variant from sessionStorage', { 
      savedVariants,
      hasValue: !!savedVariants 
    });
    
    if (savedVariants) {
      try {
        const parsed = JSON.parse(savedVariants);
        console.log('[useAdminPreviewState] Parsed variant data:', parsed);
        
        // Convert from old Record format to new single-selection format if needed
        if (typeof parsed === 'object' && parsed !== null) {
          const entries = Object.entries(parsed);
          if (entries.length > 0) {
            const [testId, variantId] = entries[0] as [string, string];
            const variantToSet = { testId, variantId };
            console.log('[useAdminPreviewState] Setting variant during hydration:', variantToSet);
            setSelectedVariant(variantToSet);
          }
        }
      } catch (e) {
        console.error('[useAdminPreviewState] Error parsing variant:', e);
        setSelectedVariant(null);
      }
    }
    
    // Sync refs with loaded values BEFORE clearing hydration flag
    queueMicrotask(() => {
      prevPersona.current = loadedPersona;
      prevFunnel.current = loadedFunnel;
      isHydrating.current = false;
      hasHydrated.current = true;
    });
  }, [persona]);

  // Reset funnel and variant when persona changes; reset variant when funnel changes
  // Using useLayoutEffect to ensure state updates complete synchronously before browser paints,
  // preventing intermediate renders where AdminPreviewDropdown shows mismatched persona/funnel state
  useLayoutEffect(() => {
    console.log('[useAdminPreviewState] useLayoutEffect triggered', {
      isHydrating: isHydrating.current,
      hasHydrated: hasHydrated.current,
      selectedPersona,
      selectedFunnel,
      selectedVariant,
      prevPersona: prevPersona.current,
      prevFunnel: prevFunnel.current,
    });
    
    // Skip during hydration to preserve loaded variant and funnel from sessionStorage
    if (isHydrating.current) {
      console.log('[useAdminPreviewState] Skipping (still hydrating)');
      prevPersona.current = selectedPersona;
      prevFunnel.current = selectedFunnel;
      return;
    }
    
    // Skip if we haven't hydrated yet (prevents reset during initial sessionStorage load)
    if (!hasHydrated.current) {
      console.log('[useAdminPreviewState] Skipping (not hydrated yet)');
      return;
    }
    
    // Only clear if there was an actual change from previous values
    const personaChanged = prevPersona.current !== undefined && prevPersona.current !== selectedPersona;
    const funnelChanged = prevFunnel.current !== undefined && prevFunnel.current !== selectedFunnel;
    
    console.log('[useAdminPreviewState] Change detection:', { personaChanged, funnelChanged });
    
    // When persona changes, reset funnel to "none" and clear variant
    if (personaChanged) {
      console.log('[useAdminPreviewState] Persona changed - clearing funnel and variant');
      setSelectedFunnel("none");
      setSelectedVariant(null);
    } 
    // When only funnel changes (not persona), just clear variant
    else if (funnelChanged) {
      console.log('[useAdminPreviewState] Funnel changed - clearing variant');
      setSelectedVariant(null);
    } else {
      console.log('[useAdminPreviewState] No changes detected - preserving variant');
    }
    
    // Update refs for next render
    prevPersona.current = selectedPersona;
    prevFunnel.current = selectedFunnel;
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
