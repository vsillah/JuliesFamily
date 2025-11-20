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
): Promise<LayoutRecommendation> {
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
    
    // Clean up the response
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
    cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    cleanedResponse = cleanedResponse.trim();

    // Validate response is not empty
    if (!cleanedResponse) {
      console.error("Empty response from Gemini AI");
      return heuristicRecommendation(context);
    }

    // Try to parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Response was:", cleanedResponse.substring(0, 200));
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
 */
function heuristicRecommendation(context: RecommendationContext): LayoutRecommendation {
  const text = [
    context.missionStatement || '',
    context.scrapedContent?.heroText || '',
    context.scrapedContent?.aboutText || '',
    context.organizationType || '',
    ...context.scrapedContent?.values || []
  ].join(' ').toLowerCase();

  // Environment/nature keywords
  const natureKeywords = ['environment', 'nature', 'wildlife', 'conservation', 'sustainability', 'climate', 'ocean', 'forest', 'green', 'eco', 'earth', 'planet'];
  const natureScore = natureKeywords.filter(k => text.includes(k)).length;

  // Community/people keywords
  const communityKeywords = ['mentor', 'community', 'family', 'relationship', 'connection', 'belong', 'people', 'social', 'foster', 'youth', 'children', 'volunteer', 'empower'];
  const communityScore = communityKeywords.filter(k => text.includes(k)).length;

  // Modern/tech keywords
  const modernKeywords = ['innovation', 'tech', 'digital', 'startup', 'modern', 'future', 'ai', 'data', 'platform', 'app'];
  const modernScore = modernKeywords.filter(k => text.includes(k)).length;

  // Determine best match
  const scores = {
    nature: natureScore,
    community: communityScore,
    modern: modernScore,
  };

  const maxScore = Math.max(...Object.values(scores));
  
  // If no clear match, default to classic
  if (maxScore === 0) {
    return {
      recommendedLayout: 'classic',
      reasoning: 'Classic layout provides a professional, trustworthy design suitable for most organizations.',
      confidence: 'low',
      alternativeLayouts: [
        { layout: 'community', reason: 'Good alternative if the focus is on people and relationships' },
        { layout: 'nature', reason: 'Consider if environmental elements are important' }
      ]
    };
  }

  // Find the layout with highest score
  const recommended = Object.entries(scores).reduce((a, b) => 
    scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
  )[0] as OrganizationLayout;

  const reasoningMap: Record<OrganizationLayout, string> = {
    classic: 'Professional and trustworthy design for traditional nonprofits.',
    nature: 'Strong environmental focus detected. Organic, nature-inspired design aligns with sustainability mission.',
    modern: 'Innovation and tech-forward language suggests a modern, bold aesthetic.',
    community: 'People-focused mission with emphasis on relationships and community building.'
  };

  return {
    recommendedLayout: recommended,
    reasoning: reasoningMap[recommended],
    confidence: maxScore >= 3 ? 'high' : 'medium',
    alternativeLayouts: [
      { layout: 'classic', reason: 'Professional alternative for donor focus' }
    ]
  };
}
