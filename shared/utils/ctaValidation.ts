import { SECTION_ANCHOR_MAP, getSectionDisplayName, type VisibleSections } from "../types/contentVisibility";
import type { ContentItem } from "../schema";

/**
 * Represents a parsed CTA button URL target
 */
export interface ParsedUrlTarget {
  type: "section" | "page" | "external" | "special" | "invalid";
  section?: keyof VisibleSections;
  url: string;
  isValid: boolean;
}

/**
 * CTA metadata structure for type safety
 */
export interface CtaMetadata {
  persona?: string;
  funnelStage?: string;
  subtitle?: string;
  primaryButton?: string;
  primaryButtonLink?: string;
  secondaryButton?: string;
  secondaryButtonLink?: string;
  [key: string]: any; // Allow other metadata fields
}

/**
 * Typed CTA content item - extends ContentItem with typed metadata
 */
export type CtaContentItem = ContentItem & {
  metadata: CtaMetadata;
};

/**
 * Normalize anchor URLs by stripping trailing slashes and query strings
 */
function normalizeAnchor(anchor: string): string {
  // Remove trailing slash
  let normalized = anchor.replace(/\/$/, "");
  // Remove query string and fragment parts after the hash
  const hashIndex = normalized.indexOf("#");
  if (hashIndex !== -1) {
    const questionIndex = normalized.indexOf("?", hashIndex);
    if (questionIndex !== -1) {
      normalized = normalized.substring(0, questionIndex);
    }
  }
  return normalized.toLowerCase();
}

/**
 * Parse a button URL to determine what type of target it is
 * Supports: #anchors, /routes, http(s)://, mailto:, tel:, and protocol-relative //
 */
export function parseButtonUrl(url: string | undefined | null): ParsedUrlTarget {
  if (!url || typeof url !== "string") {
    return { type: "invalid", url: "", isValid: false };
  }

  const trimmedUrl = url.trim();

  // Check if it's an anchor link to a section
  if (trimmedUrl.startsWith("#")) {
    const normalized = normalizeAnchor(trimmedUrl);
    const section = SECTION_ANCHOR_MAP[normalized];
    if (section) {
      return {
        type: "section",
        section,
        url: trimmedUrl,
        isValid: true,
      };
    }
    // Unknown anchor
    return { type: "invalid", url: trimmedUrl, isValid: false };
  }

  // Check for special protocols (mailto:, tel:)
  if (trimmedUrl.startsWith("mailto:") || trimmedUrl.startsWith("tel:")) {
    return { type: "special", url: trimmedUrl, isValid: true };
  }

  // Check if it's an external URL (http://, https://, or protocol-relative //)
  if (
    trimmedUrl.startsWith("http://") ||
    trimmedUrl.startsWith("https://") ||
    trimmedUrl.startsWith("//")
  ) {
    return { type: "external", url: trimmedUrl, isValid: true };
  }

  // Check if it's an internal page route
  if (trimmedUrl.startsWith("/")) {
    return { type: "page", url: trimmedUrl, isValid: true };
  }

  return { type: "invalid", url: trimmedUrl, isValid: false };
}

/**
 * Validate whether a button URL target is visible given the current content availability
 * Uses optimistic defaults during loading to avoid flickering
 */
export function isButtonTargetVisible(
  url: string | undefined | null,
  visibleSections: VisibleSections | undefined
): boolean {
  const parsed = parseButtonUrl(url);

  // External links, page routes, and special protocols (mailto:, tel:) are always "visible"
  if (parsed.type === "external" || parsed.type === "page" || parsed.type === "special") {
    return true;
  }

  // Invalid URLs are considered not visible
  if (parsed.type === "invalid") {
    return false;
  }

  // For section anchors, check visibility
  if (parsed.type === "section" && parsed.section) {
    // If visibility data is still loading, be optimistic (return true) to avoid flicker
    if (!visibleSections) {
      return true;
    }
    return visibleSections[parsed.section] === true;
  }

  // Default: optimistic true if we can't determine (better UX during loading)
  return true;
}

/**
 * Get validation message for a button URL
 */
export function getUrlValidationMessage(
  url: string | undefined | null,
  visibleSections: VisibleSections | undefined
): { isValid: boolean; message: string; type: "error" | "warning" | "success" } {
  const parsed = parseButtonUrl(url);

  if (!url || url.trim() === "") {
    return { isValid: false, message: "URL is required", type: "error" };
  }

  if (parsed.type === "invalid") {
    return { isValid: false, message: "Invalid URL format", type: "error" };
  }

  if (parsed.type === "external" || parsed.type === "page" || parsed.type === "special") {
    return { isValid: true, message: "Valid URL", type: "success" };
  }

  if (parsed.type === "section" && parsed.section) {
    if (!visibleSections) {
      return { isValid: true, message: "URL format is valid", type: "success" };
    }

    const isVisible = visibleSections[parsed.section];
    if (isVisible) {
      return {
        isValid: true,
        message: `Links to ${getSectionDisplayName(parsed.section)} (visible)`,
        type: "success",
      };
    } else {
      return {
        isValid: true,
        message: `Links to ${getSectionDisplayName(parsed.section)}, which is hidden for this persona×journey combination`,
        type: "warning",
      };
    }
  }

  return { isValid: false, message: "Could not validate URL", type: "error" };
}

/**
 * Find which CTAs incorrectly reference a given section
 * Useful for showing reverse validation in content manager
 */
export interface CtaReference {
  ctaId: string;
  persona: string;
  funnelStage: string;
  buttonType: "primary" | "secondary";
  buttonUrl: string;
  isVisible: boolean;
}

export function findInvalidCtaReferences(
  sectionKey: keyof VisibleSections,
  allCtas: CtaContentItem[], // From database
  visibilityMatrix: Record<string, VisibleSections> // persona×funnel → visible sections
): CtaReference[] {
  const invalidRefs: CtaReference[] = [];

  allCtas.forEach((cta) => {
    const persona = cta.metadata.persona || "default";
    const funnelStage = cta.metadata.funnelStage || "awareness";
    const key = `${persona}-${funnelStage}`;
    const visibleSections = visibilityMatrix[key];

    // Check primary button link
    if (cta.metadata.primaryButtonLink) {
      const parsed = parseButtonUrl(cta.metadata.primaryButtonLink);
      if (parsed.type === "section" && parsed.section === sectionKey) {
        const isVisible = visibleSections?.[sectionKey] ?? false;
        if (!isVisible) {
          invalidRefs.push({
            ctaId: cta.id,
            persona,
            funnelStage,
            buttonType: "primary",
            buttonUrl: cta.metadata.primaryButtonLink,
            isVisible: false,
          });
        }
      }
    }

    // Check secondary button link
    if (cta.metadata.secondaryButtonLink) {
      const parsed = parseButtonUrl(cta.metadata.secondaryButtonLink);
      if (parsed.type === "section" && parsed.section === sectionKey) {
        const isVisible = visibleSections?.[sectionKey] ?? false;
        if (!isVisible) {
          invalidRefs.push({
            ctaId: cta.id,
            persona,
            funnelStage,
            buttonType: "secondary",
            buttonUrl: cta.metadata.secondaryButtonLink,
            isVisible: false,
          });
        }
      }
    }
  });

  return invalidRefs;
}
