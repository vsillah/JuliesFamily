import { ReactNode } from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TIERS, getTierDisplayName, type Tier } from '@shared/tiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Crown, Zap } from 'lucide-react';

interface TierGateProps {
  requiredTier: Tier;
  featureName: string;
  children: ReactNode | (() => ReactNode);
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

const tierIcons = {
  [TIERS.BASIC]: Zap,
  [TIERS.PRO]: Sparkles,
  [TIERS.PREMIUM]: Crown,
};

const tierColors = {
  [TIERS.BASIC]: 'text-muted-foreground',
  [TIERS.PRO]: 'text-blue-600 dark:text-blue-400',
  [TIERS.PREMIUM]: 'text-amber-600 dark:text-amber-400',
};

export function TierGate({ 
  requiredTier, 
  featureName, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: TierGateProps) {
  const { hasAccess, tier: currentTier, isLoading } = useTierAccess();

  // Show loading state while tier is being determined
  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (hasAccess(requiredTier)) {
    // If children is a function, call it to render content (render prop pattern)
    // Otherwise, render children directly (backward compatibility)
    return <>{typeof children === 'function' ? children() : children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const RequiredIcon = tierIcons[requiredTier];
  const iconColor = tierColors[requiredTier];

  return (
    <Card className="border-2 border-dashed" data-testid={`tier-gate-${requiredTier}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex items-center justify-center gap-2">
          <Lock className="h-6 w-6 text-muted-foreground" />
          <RequiredIcon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <CardTitle>{featureName}</CardTitle>
        <CardDescription>
          This feature requires {getTierDisplayName(requiredTier)} tier
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="text-sm text-muted-foreground text-center">
          You are currently on: <span className="font-semibold">{getTierDisplayName(currentTier)}</span>
        </div>
        <Button 
          variant="default" 
          data-testid="button-upgrade-tier"
        >
          <Crown className="mr-2 h-4 w-4" />
          Upgrade to {getTierDisplayName(requiredTier)}
        </Button>
        <p className="text-xs text-muted-foreground">
          Contact your administrator to upgrade your organization tier
        </p>
      </CardContent>
    </Card>
  );
}

// Inline variant for smaller UI elements
interface InlineTierGateProps {
  requiredTier: Tier;
  children: ReactNode;
}

export function InlineTierGate({ requiredTier, children }: InlineTierGateProps) {
  const { hasAccess } = useTierAccess();
  
  if (hasAccess(requiredTier)) {
    return <>{children}</>;
  }
  
  return null;
}

// Hook variant for conditional rendering in components
export function useFeatureAccess(requiredTier: Tier): boolean {
  const { hasAccess } = useTierAccess();
  return hasAccess(requiredTier);
}
