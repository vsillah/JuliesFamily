import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePersona, type Persona } from "@/contexts/PersonaContext";
import type { AbTest } from "@shared/schema";

type FunnelStage = "awareness" | "consideration" | "decision" | "retention";

const ADMIN_PERSONA_KEY = "admin-persona-override";
const ADMIN_FUNNEL_KEY = "admin-funnel-override";
const ADMIN_VARIANT_KEY = "admin-variant-override";

export function useAdminPreviewState() {
  const { persona, setPersona } = usePersona();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(persona);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelStage | "none">("none");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

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
        setSelectedVariants(JSON.parse(savedVariants));
      } catch (e) {
        setSelectedVariants({});
      }
    }
  }, [persona]);

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
    
    // Save variant overrides
    if (Object.keys(selectedVariants).length > 0) {
      sessionStorage.setItem(ADMIN_VARIANT_KEY, JSON.stringify(selectedVariants));
    } else {
      sessionStorage.removeItem(ADMIN_VARIANT_KEY);
    }
    
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
    window.location.reload();
  };

  return {
    // State
    selectedPersona,
    setSelectedPersona,
    selectedFunnel,
    setSelectedFunnel,
    selectedVariants,
    setSelectedVariants,
    
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
