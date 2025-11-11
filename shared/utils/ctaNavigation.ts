import type { VisibleSections } from "../types/contentVisibility";

export interface NavigationTargets {
  primary: string;
  secondary: string;
}

export function getPersonaNavigationTargets(
  persona: string | null,
  visibleSections: VisibleSections | undefined
): NavigationTargets {
  // Preferred targets by persona
  const preferredMap: Record<string, NavigationTargets> = {
    student: { primary: 'lead-magnet', secondary: 'testimonials' },
    provider: { primary: 'lead-magnet', secondary: 'impact' },
    parent: { primary: 'lead-magnet', secondary: 'services' },
    donor: { primary: 'donation', secondary: 'campaign-impact' },
    volunteer: { primary: 'services', secondary: 'testimonials' },
    default: { primary: 'lead-magnet', secondary: 'testimonials' }
  };
  
  const preferred = preferredMap[persona || 'default'];
  
  // Fallback priority order
  const fallbackOrder: (keyof VisibleSections)[] = [
    'services', 'lead-magnet', 'impact', 'testimonials', 'donation', 'events'
  ];
  
  // If no visibility data, use preferred
  if (!visibleSections) {
    return preferred;
  }
  
  // Helper to find first visible section
  const findVisibleSection = (preferredSection: string): string => {
    if (visibleSections[preferredSection as keyof VisibleSections]) {
      return preferredSection;
    }
    // Fallback to first visible section
    return fallbackOrder.find(section => visibleSections[section]) || preferredSection;
  };
  
  return {
    primary: findVisibleSection(preferred.primary),
    secondary: findVisibleSection(preferred.secondary)
  };
}
