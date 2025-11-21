import { createContext, useContext, ReactNode, useEffect } from "react";
import { type OrganizationLayout } from "@shared/schema";
import { getLayoutTheme } from "@shared/layouts";
import { useOrganization } from "./OrganizationContext";

interface LayoutContextType {
  layout: OrganizationLayout;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

/**
 * Convert a color string (hex, rgb, rgba, hsl, hsla, named colors) to HSL format
 * Uses Canvas API for reliable browser-native color parsing
 * Returns format: "H S% L%" (e.g., "220 100% 50%")
 */
function colorToHSL(color: string): string | null {
  if (!color || typeof color !== 'string') return null;
  
  const trimmed = color.trim();
  if (!trimmed) return null;
  
  try {
    // Use Canvas API to normalize any valid CSS color to RGB
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Set the color and read it back as normalized format
    ctx.fillStyle = trimmed;
    const normalized = ctx.fillStyle; // Browser returns hex or rgba format
    
    // If browser rejected the color, it stays as default (#000000)
    // Check if input was actually processed (unless input was black)
    if (normalized === '#000000' && !trimmed.toLowerCase().match(/^(#000|#000000|black|rgb\(0,\s*0,\s*0\)|hsl\(0,\s*0%,\s*0%\))$/)) {
      console.warn('[BrandColors] Invalid color format:', trimmed);
      return null;
    }
    
    let r: number, g: number, b: number;
    
    // Parse normalized color - can be hex or rgba
    if (normalized.startsWith('#')) {
      // Hex format
      const hex = normalized.replace('#', '');
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    } else if (normalized.startsWith('rgb')) {
      // rgba(r, g, b, a) or rgb(r, g, b) format
      // Note: Canvas may return floats for RGB when converting from hsla
      const match = normalized.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*[\d.]+)?\)/);
      if (!match) {
        console.warn('[BrandColors] Failed to parse rgba color:', normalized);
        return null;
      }
      r = parseFloat(match[1]) / 255;
      g = parseFloat(match[2]) / 255;
      b = parseFloat(match[3]) / 255;
    } else {
      console.warn('[BrandColors] Unsupported color format from canvas:', normalized);
      return null;
    }
    
    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    const hue = Math.round(h * 360);
    const saturation = Math.round(s * 100);
    const lightness = Math.round(l * 100);
    
    // Validate the conversion produced valid numbers
    if (isNaN(hue) || isNaN(saturation) || isNaN(lightness)) {
      console.warn('[BrandColors] Color conversion produced NaN values:', { hue, saturation, lightness, input: trimmed });
      return null;
    }
    
    return `${hue} ${saturation}% ${lightness}%`;
  } catch (error) {
    console.error('[BrandColors] Error converting color:', trimmed, error);
    return null;
  }
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const layout = organization?.layout || 'classic';
  const layoutTheme = getLayoutTheme(layout);

  // Apply theme class to document root for global styling
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all existing theme classes
    root.classList.remove('theme-classic', 'theme-nature', 'theme-modern', 'theme-community');
    
    // Add current theme class
    root.classList.add(layoutTheme.cssClass);
    
    return () => {
      // Cleanup: remove theme class when unmounting
      root.classList.remove(layoutTheme.cssClass);
    };
  }, [layoutTheme.cssClass]);

  // Apply organization brand colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const themeColors = organization?.themeColors as any;
    
    if (!themeColors) return;
    
    console.log('[BrandColors] Applying organization brand colors:', themeColors);
    
    // Convert all colors first to ensure atomicity (all-or-nothing for each category)
    const convertedColors = {
      primary: themeColors.primary ? colorToHSL(themeColors.primary) : null,
      accent: themeColors.accent ? colorToHSL(themeColors.accent) : null,
      background: themeColors.background ? colorToHSL(themeColors.background) : null,
      foreground: (themeColors.foreground || themeColors.text) 
        ? colorToHSL(themeColors.foreground || themeColors.text) 
        : null,
    };
    
    let appliedCount = 0;
    
    // Apply primary color (affects buttons, links, focus states)
    if (convertedColors.primary) {
      root.style.setProperty('--primary', convertedColors.primary);
      root.style.setProperty('--sidebar-primary', convertedColors.primary);
      root.style.setProperty('--ring', convertedColors.primary);
      root.style.setProperty('--chart-1', convertedColors.primary);
      root.style.setProperty('--sidebar-ring', convertedColors.primary);
      appliedCount++;
      console.log('[BrandColors] ✓ Applied primary color:', convertedColors.primary);
    } else if (themeColors.primary) {
      console.warn('[BrandColors] ✗ Failed to convert primary color:', themeColors.primary);
    }
    
    // Apply accent color (affects secondary elements, charts)
    if (convertedColors.accent) {
      root.style.setProperty('--secondary', convertedColors.accent);
      root.style.setProperty('--chart-2', convertedColors.accent);
      appliedCount++;
      console.log('[BrandColors] ✓ Applied accent color:', convertedColors.accent);
    } else if (themeColors.accent) {
      console.warn('[BrandColors] ✗ Failed to convert accent color:', themeColors.accent);
    }
    
    // Apply background color (page background)
    if (convertedColors.background) {
      root.style.setProperty('--background', convertedColors.background);
      appliedCount++;
      console.log('[BrandColors] ✓ Applied background color:', convertedColors.background);
    } else if (themeColors.background) {
      console.warn('[BrandColors] ✗ Failed to convert background color:', themeColors.background);
    }
    
    // Apply foreground/text color (main text color)
    if (convertedColors.foreground) {
      root.style.setProperty('--foreground', convertedColors.foreground);
      appliedCount++;
      console.log('[BrandColors] ✓ Applied foreground color:', convertedColors.foreground);
    } else if (themeColors.foreground || themeColors.text) {
      console.warn('[BrandColors] ✗ Failed to convert foreground color:', themeColors.foreground || themeColors.text);
    }
    
    console.log(`[BrandColors] Applied ${appliedCount} brand color${appliedCount !== 1 ? 's' : ''} successfully`);
    
    return () => {
      // Cleanup: remove custom color overrides when unmounting
      root.style.removeProperty('--primary');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--chart-1');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--chart-2');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
    };
  }, [organization?.themeColors]);

  return (
    <LayoutContext.Provider value={{ layout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
