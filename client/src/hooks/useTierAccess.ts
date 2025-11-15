import { useQuery } from '@tanstack/react-query';
import { TIERS, hasTierAccess, getTierFeatures, type Tier, type TierFeatures } from '@shared/tiers';

interface OrganizationTierResponse {
  tier: Tier;
  organizationId: string | null;
  organizationName: string | null;
}

export function useTierAccess() {
  const { data, isLoading, error } = useQuery<OrganizationTierResponse>({
    queryKey: ['/api/organization/tier'],
  });

  const currentTier: Tier = data?.tier || TIERS.BASIC;
  const features: TierFeatures = getTierFeatures(currentTier);

  const hasAccess = (requiredTier: Tier): boolean => {
    return hasTierAccess(currentTier, requiredTier);
  };

  const hasFeature = (featureName: keyof TierFeatures): boolean => {
    return Boolean(features[featureName]);
  };

  const isWithinLimit = (limitName: keyof TierFeatures, currentUsage: number): boolean => {
    const limit = features[limitName];
    if (typeof limit !== 'number') return true;
    if (limit === -1) return true; // Unlimited
    return currentUsage < limit;
  };

  return {
    tier: currentTier,
    organizationId: data?.organizationId || null,
    organizationName: data?.organizationName || null,
    features,
    hasAccess,
    hasFeature,
    isWithinLimit,
    isLoading,
    error,
    isBasic: currentTier === TIERS.BASIC,
    isPro: currentTier === TIERS.PRO || currentTier === TIERS.PREMIUM,
    isPremium: currentTier === TIERS.PREMIUM,
  };
}
