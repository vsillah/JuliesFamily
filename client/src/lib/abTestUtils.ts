import type { ContentItem, AbTestVariantConfiguration } from "@shared/schema";

/**
 * Apply A/B test variant configuration overrides to a content item
 * This allows testing different presentations while maintaining persona×journey content selection
 * 
 * @param content - The selected content item (chosen by persona + journey + passion tags)
 * @param variantConfig - The A/B test variant configuration with overrides
 * @returns The content item with variant overrides applied
 */
export function applyABVariantOverrides(
  content: ContentItem,
  variantConfig: AbTestVariantConfiguration | null | undefined
): ContentItem {
  if (!variantConfig) {
    return content;
  }

  const merged: ContentItem = { ...content };

  if (variantConfig.title !== undefined) {
    merged.title = variantConfig.title;
  }

  if (variantConfig.description !== undefined) {
    merged.description = variantConfig.description;
  }

  if (variantConfig.imageName !== undefined) {
    merged.imageName = variantConfig.imageName;
  }

  if (variantConfig.imageUrl !== undefined) {
    merged.imageUrl = variantConfig.imageUrl;
  }

  if (variantConfig.metadata !== undefined) {
    merged.metadata = {
      ...(typeof content.metadata === 'object' && content.metadata !== null ? content.metadata : {}),
      ...variantConfig.metadata
    };
  }

  // For content-type specific fields (like CTA buttons), merge into metadata
  if (variantConfig.ctaText || variantConfig.ctaLink || 
      variantConfig.secondaryCtaText || variantConfig.secondaryCtaLink ||
      variantConfig.buttonVariant) {
    const metadata = merged.metadata as any || {};
    
    if (variantConfig.ctaText !== undefined) {
      metadata.primaryButton = variantConfig.ctaText;
    }
    
    if (variantConfig.ctaLink !== undefined) {
      metadata.primaryButtonLink = variantConfig.ctaLink;
    }
    
    if (variantConfig.secondaryCtaText !== undefined) {
      metadata.secondaryButton = variantConfig.secondaryCtaText;
    }
    
    if (variantConfig.secondaryCtaLink !== undefined) {
      metadata.secondaryButtonLink = variantConfig.secondaryCtaLink;
    }
    
    if (variantConfig.buttonVariant !== undefined) {
      metadata.buttonVariant = variantConfig.buttonVariant;
    }
    
    merged.metadata = metadata;
  }

  return merged;
}

/**
 * Check if content item has A/B test overrides applied
 * Useful for debugging and analytics
 */
export function hasABOverrides(variantConfig: AbTestVariantConfiguration | null | undefined): boolean {
  if (!variantConfig) return false;
  
  return Object.keys(variantConfig).some(key => 
    key !== 'metadata' && variantConfig[key as keyof AbTestVariantConfiguration] !== undefined
  );
}
