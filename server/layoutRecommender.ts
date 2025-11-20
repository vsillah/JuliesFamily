import { GoogleGenAI } from "@google/genai";
import type { OrganizationLayout } from "@shared/schema";

// Validate API key at module load
if (!process.env.GOOGLE_API_KEY) {
  console.warn("GOOGLE_API_KEY not configured - layout recommendation will use fallback logic");
}

const genAI = process.env.GOOGLE_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
  : null;

interface RecommendationContext {
  organizationName: string;
  missionStatement?: string;
  scrapedContent?: {
    heroText?: string;
    aboutText?: string;
    programsText?: string;
    values?: string[];
  };
  organizationType?: string; // e.g., "environmental", "youth mentoring", "education"
  existingWebsiteUrl?: string;
}

export interface LayoutRecommendation {
  recommendedLayout: OrganizationLayout;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  alternativeLayouts: {
    layout: OrganizationLayout;
    reason: string;
  }[];
}

/**
 * Recommend a layout theme based on organization characteristics using AI
 */
export async function recommendLayout(
  context: RecommendationContext
): Promise<LayoutRecommendation | null> {
  // Fallback to heuristic-based recommendation if API key not configured
  if (!genAI) {
    console.warn("GOOGLE_API_KEY not available, using heuristic-based recommendation");
    return heuristicRecommendation(context);
  }

  const prompt = buildRecommendationPrompt(context);

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const responseText = result.response?.text() || result.text || "";
    
    // Validate response is not empty
    if (!responseText || !responseText.trim()) {
      console.error("Empty response from Gemini AI");
      return heuristicRecommendation(context);
    }

    // Extract JSON from response - try multiple strategies
    let cleanedResponse = responseText.trim();
    
    // Strategy 1: Strip markdown code fences if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Strategy 2: Find JSON object boundaries (first { to last })
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      console.error("No valid JSON object found in Gemini response");
      console.error("Response was:", responseText.substring(0, 200));
      return heuristicRecommendation(context);
    }
    
    const jsonText = cleanedResponse.substring(firstBrace, lastBrace + 1);

    // Try to parse extracted JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse extracted JSON:", parseError);
      console.error("Extracted JSON was:", jsonText.substring(0, 300));
      return heuristicRecommendation(context);
    }

    // Validate required fields exist
    if (!parsed.recommendedLayout || !parsed.reasoning || !parsed.confidence) {
      console.error("Gemini response missing required fields");
      return heuristicRecommendation(context);
    }

    // Validate layout is one of the valid options
    const validLayouts: OrganizationLayout[] = ['classic', 'nature', 'modern', 'community'];
    if (!validLayouts.includes(parsed.recommendedLayout)) {
      console.error("Invalid layout recommendation:", parsed.recommendedLayout);
      return heuristicRecommendation(context);
    }

    return {
      recommendedLayout: parsed.recommendedLayout,
      reasoning: parsed.reasoning,
      confidence: parsed.confidence,
      alternativeLayouts: parsed.alternativeLayouts || [],
    };

  } catch (error) {
    console.error("Failed to get AI layout recommendation:", error);
    return heuristicRecommendation(context);
  }
}

function buildRecommendationPrompt(context: RecommendationContext): string {
  return `You are a UX design expert specializing in nonprofit websites. Analyze the following organization data and recommend the BEST visual layout theme.

ORGANIZATION DATA:
- Name: ${context.organizationName}
${context.missionStatement ? `- Mission: ${context.missionStatement}` : ''}
${context.organizationType ? `- Type: ${context.organizationType}` : ''}
${context.existingWebsiteUrl ? `- Existing Website: ${context.existingWebsiteUrl}` : ''}

${context.scrapedContent?.heroText ? `HERO TEXT (from website):
${context.scrapedContent.heroText}
` : ''}

${context.scrapedContent?.aboutText ? `ABOUT TEXT (from website):
${context.scrapedContent.aboutText.substring(0, 500)}...
` : ''}

${context.scrapedContent?.values?.length ? `ORGANIZATION VALUES:
${context.scrapedContent.values.join(', ')}
` : ''}

AVAILABLE LAYOUT THEMES:

1. **Classic** - Clean, professional design with strong calls-to-action
   - Best for: Traditional nonprofits, formal organizations, donor-focused
   - Visual style: Professional, trustworthy, grid-based layouts
   - Color scheme: Blue and green accents, professional palette

2. **Nature** - Organic, environmental design with natural elements
   - Best for: Environmental orgs, sustainability, outdoor programs, wildlife
   - Visual style: Organic shapes, soft overlays, flowing design
   - Color scheme: Earth tones, greens, natural colors

3. **Modern** - Bold, geometric design with contemporary aesthetics
   - Best for: Tech-forward, innovation-focused, youth-oriented, startups
   - Visual style: Bold typography, geometric patterns, high contrast
   - Color scheme: Vibrant accents, bold colors, minimal design

4. **Community** - Warm, people-focused design emphasizing connection
   - Best for: Mentoring, social services, family programs, community building
   - Visual style: People-centered imagery, warm atmosphere, approachable
   - Color scheme: Warm oranges, yellows, inviting tones

ANALYSIS INSTRUCTIONS:
1. Identify the organization's PRIMARY focus (people, environment, innovation, professionalism)
2. Consider their mission, values, and target audience
3. Match their characteristics to the most appropriate layout theme
4. Provide reasoning based on specific organizational attributes
5. Suggest 1-2 alternative layouts that could also work

IMPORTANT CRITERIA TO CONSIDER:
- Does the organization focus on PEOPLE and RELATIONSHIPS? → Consider Community
- Is the organization ENVIRONMENTAL or NATURE-focused? → Consider Nature
- Is the organization TECH-FORWARD or INNOVATION-driven? → Consider Modern
- Is the organization TRADITIONAL, FORMAL, or DONOR-focused? → Consider Classic

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "recommendedLayout": "community",
  "reasoning": "This organization focuses heavily on mentoring relationships and community building. Their mission emphasizes human connection, belonging, and personal relationships. The warm, people-focused Community layout aligns perfectly with their emphasis on mentorship and local impact.",
  "confidence": "high",
  "alternativeLayouts": [
    {
      "layout": "classic",
      "reason": "Could work if they want a more professional, donor-focused presentation"
    }
  ]
}

Valid confidence levels: "high", "medium", "low"
Valid layouts: "classic", "nature", "modern", "community"`;
}

/**
 * Heuristic-based recommendation fallback (no AI required)
 * Returns null if there's insufficient data for a meaningful recommendation
 */
function heuristicRecommendation(context: RecommendationContext): LayoutRecommendation | null {
  const text = [
    context.organizationName || '',
    context.missionStatement || '',
    context.scrapedContent?.heroText || '',
    context.scrapedContent?.aboutText || '',
    context.organizationType || '',
    ...context.scrapedContent?.values || []
  ].join(' ').toLowerCase();

  // Check if we have sufficient data (at least 20 characters of meaningful text)
  const meaningfulText = text.trim();
  if (meaningfulText.length < 20) {
    console.log('Insufficient data for heuristic recommendation (text too short)');
    return null;
  }

  // Environment/nature keywords
  const natureKeywords = ['environment', 'nature', 'wildlife', 'conservation', 'sustainability', 'climate', 'ocean', 'forest', 'green', 'eco', 'earth', 'planet', 'animal', 'renewable'];
  const natureScore = natureKeywords.filter(k => text.includes(k)).length;

  // Community/people keywords
  const communityKeywords = ['mentor', 'community', 'family', 'relationship', 'connection', 'belong', 'people', 'social', 'foster', 'youth', 'children', 'volunteer', 'empower', 'support', 'serve'];
  const communityScore = communityKeywords.filter(k => text.includes(k)).length;

  // Modern/tech keywords
  const modernKeywords = ['innovation', 'tech', 'digital', 'startup', 'modern', 'future', 'ai', 'data', 'platform', 'app', 'software', 'online', 'virtual'];
  const modernScore = modernKeywords.filter(k => text.includes(k)).length;

  // Professional/traditional keywords
  const classicKeywords = ['foundation', 'trust', 'scholarship', 'education', 'grant', 'fund', 'endowment', 'professional', 'academic'];
  const classicScore = classicKeywords.filter(k => text.includes(k)).length;

  // Determine best match
  const scores = {
    nature: natureScore,
    community: communityScore,
    modern: modernScore,
    classic: classicScore,
  };

  const maxScore = Math.max(...Object.values(scores));
  
  // If no clear signal (no keyword matches), return null
  if (maxScore === 0) {
    console.log('No clear keyword matches for heuristic recommendation');
    return null;
  }

  // Find the layout with highest score
  const recommended = Object.entries(scores).reduce((a, b) => 
    scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
  )[0] as OrganizationLayout;

  const reasoningMap: Record<OrganizationLayout, string> = {
    classic: 'Based on professional and institutional language, a clean, trustworthy Classic layout is recommended.',
    nature: 'Strong environmental focus detected. The Nature layout with organic, earth-inspired design aligns well.',
    modern: 'Tech-forward and innovation language suggests a bold, modern aesthetic would be most effective.',
    community: 'People-focused mission with emphasis on relationships suggests the warm Community layout.'
  };

  // Determine confidence based on score strength
  const confidence = maxScore >= 4 ? 'high' : maxScore >= 2 ? 'medium' : 'low';

  // Get alternative layouts (sorted by score, excluding recommended)
  const alternatives = Object.entries(scores)
    .filter(([layout]) => layout !== recommended)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([layout]) => ({
      layout: layout as OrganizationLayout,
      reason: `Alternative based on ${layout} characteristics in your content`
    }));

  return {
    recommendedLayout: recommended,
    reasoning: reasoningMap[recommended],
    confidence,
    alternativeLayouts: alternatives
  };
}
