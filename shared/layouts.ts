import { OrganizationLayout } from './schema';

export interface LayoutTheme {
  id: OrganizationLayout;
  name: string;
  description: string;
  preview: {
    heroStyle: string;
    colorScheme: string;
    typography: string;
    imagery: string;
  };
  characteristics: string[];
  cssClass: string; // CSS class to apply for this theme
  styles: {
    cardStyle: 'elevated' | 'outlined' | 'minimal' | 'warm';
    sectionSpacing: 'compact' | 'comfortable' | 'spacious';
    borderRadius: 'sharp' | 'rounded' | 'soft' | 'organic';
    accentStyle: 'bold' | 'subtle' | 'vibrant' | 'natural';
  };
}

export const LAYOUT_THEMES: Record<OrganizationLayout, LayoutTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Clean, professional design with strong calls-to-action',
    preview: {
      heroStyle: 'Bold gradients with centered content',
      colorScheme: 'Blue and green accents',
      typography: 'Playfair Display headlines, Inter body',
      imagery: 'Professional photos, clear focus',
    },
    characteristics: [
      'Professional and trustworthy',
      'Clear visual hierarchy',
      'Strong donation focus',
      'Grid-based layouts',
    ],
    cssClass: 'theme-classic',
    styles: {
      cardStyle: 'elevated',
      sectionSpacing: 'comfortable',
      borderRadius: 'rounded',
      accentStyle: 'bold',
    },
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    description: 'Organic, environmental design inspired by natural elements',
    preview: {
      heroStyle: 'Large imagery with organic shapes',
      colorScheme: 'Earth tones, greens, and natural colors',
      typography: 'Flowing, organic fonts',
      imagery: 'Nature photography, soft overlays',
    },
    characteristics: [
      'Environmentally focused',
      'Organic shapes and curves',
      'Soft, natural color palettes',
      'Image-driven storytelling',
    ],
    cssClass: 'theme-nature',
    styles: {
      cardStyle: 'outlined',
      sectionSpacing: 'spacious',
      borderRadius: 'organic',
      accentStyle: 'natural',
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Bold, geometric design with contemporary aesthetics',
    preview: {
      heroStyle: 'Asymmetric layouts with bold typography',
      colorScheme: 'High contrast, vibrant accents',
      typography: 'Modern sans-serif, large headlines',
      imagery: 'Abstract patterns, geometric shapes',
    },
    characteristics: [
      'Tech-forward and innovative',
      'Bold geometric patterns',
      'High contrast design',
      'Minimal, focused content',
    ],
    cssClass: 'theme-modern',
    styles: {
      cardStyle: 'minimal',
      sectionSpacing: 'compact',
      borderRadius: 'sharp',
      accentStyle: 'vibrant',
    },
  },
  community: {
    id: 'community',
    name: 'Community',
    description: 'Warm, people-focused design emphasizing connection',
    preview: {
      heroStyle: 'People-centered imagery with warm overlays',
      colorScheme: 'Warm oranges, yellows, and earth tones',
      typography: 'Friendly, approachable fonts',
      imagery: 'Community photos, diverse faces',
    },
    characteristics: [
      'People and relationships first',
      'Warm, inviting atmosphere',
      'Emphasizes local impact',
      'Personal storytelling',
    ],
    cssClass: 'theme-community',
    styles: {
      cardStyle: 'warm',
      sectionSpacing: 'comfortable',
      borderRadius: 'soft',
      accentStyle: 'subtle',
    },
  },
};

export function getLayoutTheme(layout: OrganizationLayout): LayoutTheme {
  return LAYOUT_THEMES[layout];
}
