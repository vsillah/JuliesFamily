import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AbTest, AbTestVariant, AbTestAssignment } from "@shared/schema";

// Generate or retrieve session ID for A/B testing
const getSessionId = (): string => {
  const storageKey = "ab-test-session-id";
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

// Track A/B test events
export const trackABTestEvent = async (
  testId: string,
  variantId: string,
  eventType: string,
  eventTarget?: string,
  eventValue?: number,
  metadata?: Record<string, any>
) => {
  const sessionId = getSessionId();
  
  try {
    await fetch("/api/ab-tests/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testId,
        variantId,
        sessionId,
        eventType,
        eventTarget,
        eventValue,
        metadata,
      }),
    });
  } catch (error) {
    console.error("Failed to track A/B test event:", error);
  }
};

interface UseABTestOptions {
  persona?: string;
  funnelStage?: string;
  enabled?: boolean;
}

export function useABTest(testType: string, options: UseABTestOptions = {}) {
  const { persona, funnelStage, enabled = true } = options;
  const sessionId = getSessionId();
  const [assignment, setAssignment] = useState<AbTestAssignment | null>(null);
  const [variant, setVariant] = useState<AbTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active tests
  const { data: activeTests = [] } = useQuery<AbTest[]>({
    queryKey: ["/api/ab-tests/active", { persona, funnelStage }],
    enabled,
    retry: false,
  });

  // Find matching test for this type
  const test = activeTests.find(t => t.type === testType);

  useEffect(() => {
    if (!test || !enabled) {
      setIsLoading(false);
      return;
    }

    const assignVariant = async () => {
      try {
        // Check for admin variant override
        const adminVariantOverrides = sessionStorage.getItem("admin-variant-override");
        let adminVariantId: string | null = null;
        
        if (adminVariantOverrides) {
          try {
            const overrides = JSON.parse(adminVariantOverrides);
            adminVariantId = overrides[test.id];
          } catch (e) {
            // Invalid JSON, ignore
          }
        }

        let assignmentData: AbTestAssignment;
        
        // If admin has selected a specific variant, use that
        if (adminVariantId && adminVariantId !== "random") {
          // Create mock assignment for admin override
          assignmentData = {
            id: `admin-override-${test.id}`,
            testId: test.id,
            variantId: adminVariantId,
            sessionId,
            persona: persona || null,
            funnelStage: funnelStage || null,
            assignedAt: new Date().toISOString(),
          };
          setAssignment(assignmentData);
        } else {
          // Normal assignment: request from backend
          const response = await fetch("/api/ab-tests/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              testId: test.id,
              sessionId,
              persona,
              funnelStage,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to assign variant");
          }

          assignmentData = await response.json();
          setAssignment(assignmentData);
        }

        // Fetch variant details
        const variantsResponse = await fetch(`/api/ab-tests/${test.id}/variants`);
        if (variantsResponse.ok) {
          const variants: AbTestVariant[] = await variantsResponse.json();
          const assignedVariant = variants.find(v => v.id === assignmentData.variantId);
          if (assignedVariant) {
            setVariant(assignedVariant);
          }
        }

        // Track page view (only if not admin override)
        if (!adminVariantId || adminVariantId === "random") {
          await trackABTestEvent(
            test.id,
            assignmentData.variantId,
            "page_view"
          );
        }
      } catch (error) {
        console.error("Failed to assign A/B test variant:", error);
      } finally {
        setIsLoading(false);
      }
    };

    assignVariant();
  }, [test?.id, sessionId, persona, funnelStage, enabled]);

  // Helper function to track conversions
  const trackConversion = async (eventTarget?: string, eventValue?: number) => {
    if (!test || !assignment) return;
    
    // Skip tracking for admin preview to avoid polluting test results
    const adminOverrides = sessionStorage.getItem("admin-variant-override");
    if (adminOverrides) {
      try {
        const overrides = JSON.parse(adminOverrides);
        if (overrides[test.id] && overrides[test.id] !== "random") {
          return; // Admin is previewing specific variant, don't track
        }
      } catch (e) {
        // Invalid JSON, proceed with tracking
      }
    }
    
    await trackABTestEvent(
      test.id,
      assignment.variantId,
      "cta_click",
      eventTarget,
      eventValue
    );
  };

  // Helper function to track custom events
  const trackEvent = async (
    eventType: string,
    eventTarget?: string,
    eventValue?: number,
    metadata?: Record<string, any>
  ) => {
    if (!test || !assignment) return;
    
    // Skip tracking for admin preview to avoid polluting test results
    const adminOverrides = sessionStorage.getItem("admin-variant-override");
    if (adminOverrides) {
      try {
        const overrides = JSON.parse(adminOverrides);
        if (overrides[test.id] && overrides[test.id] !== "random") {
          return; // Admin is previewing specific variant, don't track
        }
      } catch (e) {
        // Invalid JSON, proceed with tracking
      }
    }
    
    await trackABTestEvent(
      test.id,
      assignment.variantId,
      eventType,
      eventTarget,
      eventValue,
      metadata
    );
  };

  // Check if admin has variant override active
  const isAdminPreview = (() => {
    try {
      const overrides = sessionStorage.getItem("admin-variant-override");
      if (!overrides) return false;
      const parsed = JSON.parse(overrides);
      return test?.id && parsed[test.id] && parsed[test.id] !== "random";
    } catch {
      return false;
    }
  })();

  return {
    isLoading,
    hasTest: !!test,
    test,
    variant,
    configuration: variant?.configuration as Record<string, any> | null,
    isAdminPreview, // Flag to indicate admin is previewing specific variant
    trackConversion,
    trackEvent,
  };
}

// Hook for getting variant configuration without side effects
export function useVariantConfig(testType: string, defaultConfig: any = {}) {
  const { configuration, isLoading } = useABTest(testType);
  
  if (isLoading || !configuration) {
    return defaultConfig;
  }
  
  return { ...defaultConfig, ...configuration };
}

// Hook for conditional rendering based on variant
export function useVariantRender(testType: string, variantName: string) {
  const { variant, isLoading } = useABTest(testType);
  
  return {
    shouldRender: !isLoading && variant?.name === variantName,
    isLoading,
  };
}
