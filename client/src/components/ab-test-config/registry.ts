import type { AbTestVariantConfiguration, CardOrderConfig, LayoutConfig, PresentationOverrideConfig } from "@shared/schema";
import { CardOrderEditor } from "./CardOrderEditor";
import { LayoutEditor } from "./LayoutEditor";

/**
 * Visual editor component type
 */
export type VariantEditorComponent = React.ComponentType<{
  value: any;
  onChange: (value: any) => void;
  errors?: Record<string, string>;
}>;

/**
 * Configuration definition for each test type
 */
export interface VariantConfigDefinition {
  /** Display name for this test type */
  label: string;
  /** Description shown in UI */
  description: string;
  /** Visual editor component */
  component: VariantEditorComponent | null; // null means use legacy form fields
  /** Factory function to create default configuration */
  createDefaultConfig: () => AbTestVariantConfiguration;
  /** Whether this type uses legacy form fields (hero, cta, messaging) */
  usesLegacyForms: boolean;
}

/**
 * Registry mapping test types to their configuration editors
 */
export const VARIANT_CONFIG_REGISTRY: Record<string, VariantConfigDefinition> = {
  hero: {
    label: "Hero Section",
    description: "Test different hero headlines, images, and CTAs",
    component: null, // Uses legacy form fields
    createDefaultConfig: (): PresentationOverrideConfig => ({
      kind: 'presentation',
      title: '',
      ctaText: '',
      imageName: '',
      ctaLink: '',
      buttonVariant: 'default',
    }),
    usesLegacyForms: true,
  },
  
  cta: {
    label: "Call-to-Action",
    description: "Test different CTA button text and styles",
    component: null, // Uses legacy form fields
    createDefaultConfig: (): PresentationOverrideConfig => ({
      kind: 'presentation',
      title: '',
      ctaText: '',
      buttonVariant: 'default',
    }),
    usesLegacyForms: true,
  },
  
  messaging: {
    label: "Messaging",
    description: "Test different messaging and copy variations",
    component: null, // Uses legacy form fields
    createDefaultConfig: (): PresentationOverrideConfig => ({
      kind: 'presentation',
      title: '',
      description: '',
    }),
    usesLegacyForms: true,
  },
  
  card_order: {
    label: "Card Ordering",
    description: "Test different orderings of content cards",
    component: CardOrderEditor,
    createDefaultConfig: (): CardOrderConfig => ({
      kind: 'card_order',
      contentType: 'service',
      itemIds: [],
    }),
    usesLegacyForms: false,
  },
  
  layout: {
    label: "Page Layout",
    description: "Test different page layouts and visual arrangements",
    component: LayoutEditor,
    createDefaultConfig: (): LayoutConfig => ({
      kind: 'layout',
      template: 'grid-2col',
      options: {
        cardStyle: 'elevated',
        spacing: 'comfortable',
        imagePosition: 'top',
        showImages: true,
        columnsOnMobile: '1',
      },
    }),
    usesLegacyForms: false,
  },
};

/**
 * Get configuration definition for a test type
 */
export function getConfigDefinition(testType: string): VariantConfigDefinition | undefined {
  return VARIANT_CONFIG_REGISTRY[testType];
}

/**
 * Check if a test type uses visual editor (vs legacy forms)
 */
export function usesVisualEditor(testType: string): boolean {
  const definition = getConfigDefinition(testType);
  return definition?.component !== null && !definition?.usesLegacyForms;
}

/**
 * Create default configuration for a test type
 */
export function createDefaultConfigForType(testType: string): AbTestVariantConfiguration | null {
  const definition = getConfigDefinition(testType);
  return definition?.createDefaultConfig() || null;
}
