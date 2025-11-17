import { ReactNode } from 'react';
import { useFeatureEnabled } from "@/hooks/useFeatureEnabled";

interface FeatureGateProps {
  featureKey: string;
  children: ReactNode | (() => ReactNode);
  fallback?: ReactNode;
  showLoading?: boolean;
}

export function FeatureGate({ 
  featureKey, 
  children, 
  fallback = null,
  showLoading = false 
}: FeatureGateProps) {
  const { isEnabled, isLoading } = useFeatureEnabled(featureKey);

  if (isLoading && showLoading) {
    return <div data-testid="feature-gate-loading">Loading...</div>;
  }

  if (isLoading) {
    return null;
  }

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  // If children is a function, call it to render content (render prop pattern)
  // Otherwise, render children directly (backward compatibility)
  return <>{typeof children === 'function' ? children() : children}</>;
}

// Inline variant for smaller UI elements
interface InlineFeatureGateProps {
  featureKey: string;
  children: ReactNode;
}

export function InlineFeatureGate({ featureKey, children }: InlineFeatureGateProps) {
  const { isEnabled } = useFeatureEnabled(featureKey);
  
  if (isEnabled) {
    return <>{children}</>;
  }
  
  return null;
}

// Hook variant for conditional rendering in components
export function useFeature(featureKey: string): boolean {
  const { isEnabled } = useFeatureEnabled(featureKey);
  return isEnabled;
}
