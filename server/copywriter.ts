import { GoogleGenAI } from "@google/genai";
import type {
  CopyGenerationRequest,
  CopyGenerationResponse,
  GeneratedVariant,
  ContentType
} from "@shared/valueEquation";
import {
  VALUE_EQUATION_TEMPLATES,
  DEFAULT_VALUE_EQUATION_TEMPLATE,
  CONTENT_TYPE_GUIDANCE
} from "@shared/valueEquation";
import type { Persona, FunnelStage } from "@shared/defaults/personas";
import { PERSONA_LABELS, FUNNEL_STAGE_LABELS } from "@shared/defaults/personas";

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

/**
 * Generates copy variants using Alex Hormozi's Value Equation framework:
 * Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice)
 */
export async function generateValueEquationCopy(
  request: CopyGenerationRequest
): Promise<CopyGenerationResponse> {
  const {
    originalContent,
    contentType,
    persona,
    funnelStage,
    valueEquation,
    customPrompt
  } = request;

  // Get persona-specific template or fallback to default
  const template = persona 
    ? VALUE_EQUATION_TEMPLATES[persona]
    : DEFAULT_VALUE_EQUATION_TEMPLATE;

  // Get content type-specific guidance
  const guidance = CONTENT_TYPE_GUIDANCE[contentType];

  // Build the prompt
  const prompt = customPrompt || buildValueEquationPrompt(
    originalContent,
    contentType,
    valueEquation,
    template,
    guidance,
    persona,
    funnelStage
  );

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
    
    // Parse the response
    const variants = parseVariantResponse(responseText);
    
    return {
      variants
    };
  } catch (error) {
    console.error("Failed to generate copy with Gemini:", error);
    throw new Error("Failed to generate copy variants. Please try again.");
  }
}

/**
 * Builds a comprehensive prompt for Value Equation-based copywriting
 */
function buildValueEquationPrompt(
  originalContent: string,
  contentType: ContentType,
  valueEquation: CopyGenerationRequest['valueEquation'],
  template: typeof DEFAULT_VALUE_EQUATION_TEMPLATE,
  guidance: typeof CONTENT_TYPE_GUIDANCE[ContentType],
  persona?: Persona,
  funnelStage?: FunnelStage
): string {
  const wordCount = originalContent ? originalContent.split(/\s+/).length : 0;
  const personaLabel = persona ? PERSONA_LABELS[persona] : 'General Audience';
  const stageLabel = funnelStage ? FUNNEL_STAGE_LABELS[funnelStage] : '';
  const stagContext = funnelStage ? ` They are in the ${stageLabel} stage of their journey.` : '';

  return `You are an expert copywriter trained in Alex Hormozi's Value Equation framework from "$100M Offers".

**Framework**: Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice)

**Context**: Julie's Family Learning Program - A warm, community-focused non-profit helping families through education and support services.

**Target Audience**: ${personaLabel}${stagContext}

${originalContent ? `**Original Content for Reference**: "${originalContent}"\n` : ''}**Content Type**: ${contentType}
- Tone: ${guidance.tone}
- Length: ${guidance.length} (original is ~${wordCount} words)
- Focus: ${guidance.focus}

**Value Equation Inputs**:

1. **Dream Outcome** (What transformation will they experience?):
   ${valueEquation.dreamOutcome}

2. **Perceived Likelihood** (Why should they trust this works?):
   ${valueEquation.perceivedLikelihood}

3. **Time Delay** (How quickly will they see results?):
   ${valueEquation.timeDelay}

4. **Effort & Sacrifice** (How easy is this for them?):
   ${valueEquation.effortSacrifice}

**Your Task**:
Generate exactly 3 compelling copy variants that maximize the Value Equation. Each variant should emphasize a different element while maintaining a warm, community-focused tone.

**Variant Strategy**:
- **Variant 1 (Speed + Outcome Focus)**: Lead with the dream outcome and emphasize how quickly they'll see results
- **Variant 2 (Trust + Ease Focus)**: Highlight proof/credibility and minimize perceived effort
- **Variant 3 (Balanced)**: Artfully weave all four elements together in a cohesive message

**Critical Guidelines**:
- Use warm, approachable language (not corporate or salesy)
- Be specific and concrete (avoid vague promises)
- Show don't tell (use details that build trust)
- Emphasize community and support
- Match or slightly improve upon the original length
- Include a clear, low-friction call-to-action where appropriate
- Use "you/your" language to make it personal

**Output Format**:
Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "variants": [
    {
      "text": "The actual copy variant here",
      "focus": "dream_outcome",
      "explanation": "Brief explanation of the strategic emphasis"
    },
    {
      "text": "Second variant here",
      "focus": "perceived_likelihood",
      "explanation": "Brief explanation"
    },
    {
      "text": "Third variant here",
      "focus": "balanced",
      "explanation": "Brief explanation"
    }
  ]
}

Valid focus values: "dream_outcome", "perceived_likelihood", "time_delay", "effort_sacrifice", "balanced"`;
}

/**
 * Parses the AI response and extracts copy variants
 */
function parseVariantResponse(responseText: string): GeneratedVariant[] {
  // Clean up the response
  let cleanedResponse = responseText.trim();
  
  // Remove markdown code blocks if present
  cleanedResponse = cleanedResponse.replace(/```json\s*/gi, '');
  cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleanedResponse = cleanedResponse.trim();

  try {
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate structure
    if (!parsed.variants || !Array.isArray(parsed.variants)) {
      throw new Error("Invalid response structure");
    }

    // Validate each variant
    const variants: GeneratedVariant[] = parsed.variants.map((v: any) => {
      if (!v.text || !v.focus || !v.explanation) {
        throw new Error("Missing required variant fields");
      }
      
      return {
        text: v.text,
        focus: v.focus,
        explanation: v.explanation
      };
    });

    // Ensure we have exactly 3 variants
    if (variants.length !== 3) {
      console.warn(`Expected 3 variants, got ${variants.length}`);
    }

    return variants;
  } catch (error) {
    console.error("Failed to parse Gemini response:", cleanedResponse);
    throw new Error("Failed to parse AI response - invalid format");
  }
}

/**
 * Generates multiple A/B test variants from a control variant
 * Optimized for creating test alternatives quickly
 */
export async function generateAbTestVariants(
  controlContent: string,
  contentType: ContentType,
  persona?: Persona,
  funnelStage?: FunnelStage
): Promise<CopyGenerationResponse> {
  // Build a simplified prompt for A/B test variant generation
  const personaLabel = persona ? PERSONA_LABELS[persona] : 'General Audience';
  const stageLabel = funnelStage ? FUNNEL_STAGE_LABELS[funnelStage] : '';
  const stageContext = funnelStage ? ` in the ${stageLabel} stage` : '';
  const guidance = CONTENT_TYPE_GUIDANCE[contentType];

  const prompt = `You are an expert A/B testing copywriter using the Value Equation framework.

**Framework**: Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice)

**Context**: Julie's Family Learning Program - A warm, community-focused non-profit.

**Target Audience**: ${personaLabel}${stageContext}

**Control Variant (Current Copy)**: "${controlContent}"

**Content Type**: ${contentType}
- Tone: ${guidance.tone}
- Length: ${guidance.length}

**Your Task**:
Generate 3 alternative variants for A/B testing. Each should test a different value equation hypothesis:

1. **Speed Hypothesis**: What if we emphasize how quickly they see results?
2. **Trust Hypothesis**: What if we lead with proof and credibility?
3. **Ease Hypothesis**: What if we make the effort seem even simpler?

**Guidelines**:
- Keep the same general message and offer
- Maintain warm, community-focused tone
- Make meaningful (not trivial) changes worth testing
- Each variant should be noticeably different but not radically so
- Match the control's length approximately

**Output Format**:
Return ONLY valid JSON with exactly 3 variants:
{
  "variants": [
    {
      "text": "First test variant (speed focus)",
      "focus": "time_delay",
      "explanation": "Tests faster results messaging"
    },
    {
      "text": "Second test variant (trust focus)",
      "focus": "perceived_likelihood",
      "explanation": "Tests proof-first approach"
    },
    {
      "text": "Third test variant (ease focus)",
      "focus": "effort_sacrifice",
      "explanation": "Tests simplicity messaging"
    }
  ]
}`;

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
    const variants = parseVariantResponse(responseText);
    
    return { variants };
  } catch (error) {
    console.error("Failed to generate A/B test variants:", error);
    throw new Error("Failed to generate test variants. Please try again.");
  }
}
