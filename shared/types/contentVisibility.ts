/**
 * Shared content visibility types
 * Used by both frontend and backend to determine which content sections are visible
 */

/**
 * Available content sections that can be shown/hidden based on persona×funnel stage
 */
export interface VisibleSections {
  "campaign-impact": boolean;
  services: boolean;
  "lead-magnet": boolean;
  impact: boolean;
  testimonials: boolean;
  events: boolean;
  donation: boolean;
  "student-dashboard": boolean;
}

/**
 * Map of URL anchors to VisibleSections keys
 * Single source of truth for section anchor links
 */
export const SECTION_ANCHOR_MAP: Record<string, keyof VisibleSections> = {
  "#services": "services",
  "#impact": "impact",
  "#campaign-impact": "campaign-impact",
  "#testimonials": "testimonials",
  "#events": "events",
  "#donation": "donation",
  "#donate": "donation", // Alias
  "#lead-magnet": "lead-magnet",
  "#student-dashboard": "student-dashboard",
  "#dashboard": "student-dashboard", // Alias
};

/**
 * Get a human-readable name for a section key
 */
export function getSectionDisplayName(section: keyof VisibleSections): string {
  const displayNames: Record<keyof VisibleSections, string> = {
    "campaign-impact": "Campaign Impact",
    services: "Services",
    "lead-magnet": "Lead Magnet",
    impact: "Impact",
    testimonials: "Testimonials",
    events: "Events",
    donation: "Donation",
    "student-dashboard": "Student Dashboard",
  };
  return displayNames[section] || section;
}
