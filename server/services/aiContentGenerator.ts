import { IStorage } from "../storage";
import { InsertAbTestVariantAiGeneration, AbTestVariant, AbTest } from "@shared/schema";
import { GoogleGenAI } from "@google/genai";

export interface GenerationRequest {
  testId: string;
  contentType: string;
  contentItemId: string;
  persona: string;
  funnelStage: string;
  controlVariantData: any; // Current content data
  performanceContext?: {
    underperformingMetrics: string[];
    baselineScore: number;
    currentScore: number;
  };
}

export interface GenerationResult {
  variantId: string;
  generatedContent: any;
  prompt: string;
  tokensUsed: number;
  generationMetadata: any;
}

export class AiContentGeneratorService {
  private genai: GoogleGenAI;
  private model: any;

  constructor(
    private storage: IStorage,
    apiKey?: string
  ) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is required for AI content generation");
    }
    
    this.genai = new GoogleGenAI({ apiKey: key });
    this.model = this.genai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  /**
   * Generate content variant using AI
   */
  async generateVariant(request: GenerationRequest): Promise<GenerationResult> {
    // Build prompt based on content type and performance context
    const prompt = this.buildPrompt(request);

    try {
      // Generate content using Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      // Parse generated content based on content type
      const generatedContent = this.parseGeneratedContent(
        generatedText,
        request.contentType
      );

      // FIXED: Validate generated content before creating variant
      const validation = this.validateGeneratedContent(
        generatedContent,
        request.controlVariantData
      );

      if (!validation.isValid) {
        throw new Error(
          `Generated content validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Create variant in database
      const variant = await this.createVariant(request, generatedContent);

      // Track AI generation
      const tokensUsed = this.estimateTokens(prompt, generatedText);
      await this.trackGeneration(
        variant.id,
        prompt,
        generatedContent,
        tokensUsed,
        'success'
      );

      return {
        variantId: variant.id,
        generatedContent,
        prompt,
        tokensUsed,
        generationMetadata: {
          model: 'gemini-2.0-flash-exp',
          temperature: 0.7,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      // FIXED: Track failed generation with null variantId instead of fake 'failed' string
      await this.trackGeneration(
        null,
        prompt,
        null,
        0,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build AI prompt based on content type and context
   */
  private buildPrompt(request: GenerationRequest): string {
    const {
      contentType,
      persona,
      funnelStage,
      controlVariantData,
      performanceContext,
    } = request;

    // FIXED: Truncate control variant data to prevent huge prompts (max 2000 chars)
    let controlDataStr = JSON.stringify(controlVariantData, null, 2);
    if (controlDataStr.length > 2000) {
      controlDataStr = controlDataStr.substring(0, 2000) + '\n... (truncated)';
    }

    let prompt = `You are an expert copywriter for a nonprofit organization (Julie's Family Learning Program) creating personalized content.

PERSONA: ${persona}
FUNNEL STAGE: ${funnelStage}
CONTENT TYPE: ${contentType}

CURRENT CONTENT (Control Variant):
${controlDataStr}

`;

    if (performanceContext) {
      prompt += `PERFORMANCE CONTEXT:
- Current performance score: ${performanceContext.currentScore}/10000
- Baseline score: ${performanceContext.baselineScore}/10000
- Underperforming metrics: ${performanceContext.underperformingMetrics.join(', ')}

`;
    }

    prompt += this.getContentTypeGuidelines(contentType);
    prompt += this.getPersonaGuidelines(persona);
    prompt += this.getFunnelStageGuidelines(funnelStage);

    prompt += `\n\nIMPORTANT:
1. Generate content that will improve the underperforming metrics
2. Keep the same structure as the control variant
3. Maintain the nonprofit's mission-driven tone
4. Focus on emotional connection and impact
5. Return ONLY valid JSON in the same structure as the control variant
6. Do not include any explanations or markdown formatting
7. Ensure all required fields are present

Generate the improved content variant now:`;

    return prompt;
  }

  /**
   * Get content type specific guidelines
   */
  private getContentTypeGuidelines(contentType: string): string {
    switch (contentType) {
      case 'hero_section':
        return `
HERO SECTION GUIDELINES:
- Headline: Clear, compelling, emotionally resonant (5-10 words)
- Subheadline: Expands on headline, shows impact (10-20 words)
- CTA: Action-oriented, urgent, specific (2-4 words)
- Focus on transformation and hope
`;

      case 'testimonial':
        return `
TESTIMONIAL GUIDELINES:
- Quote: Authentic, specific, emotional (20-50 words)
- Impact: Concrete results and transformation
- Credibility: Real person, relatable situation
`;

      case 'program_card':
        return `
PROGRAM CARD GUIDELINES:
- Title: Clear, benefit-focused (3-6 words)
- Description: Specific outcomes, tangible benefits (15-30 words)
- Features: 3-5 key highlights
- CTA: Clear next step
`;

      case 'impact_stat':
        return `
IMPACT STAT GUIDELINES:
- Number: Bold, impressive, verifiable
- Label: Context that shows transformation
- Supporting text: Brief story or context (10-20 words)
`;

      default:
        return `
GENERAL CONTENT GUIDELINES:
- Clear, concise, benefit-focused
- Emotional connection + practical value
- Authentic nonprofit voice
`;
    }
  }

  /**
   * Get persona-specific guidelines
   */
  private getPersonaGuidelines(persona: string): string {
    const guidelines: Record<string, string> = {
      parent: `
PARENT PERSONA:
- Focus on child's future and family transformation
- Address concerns about safety, quality, affordability
- Emphasize community and support system
- Use warm, encouraging language
`,
      educator: `
EDUCATOR PERSONA:
- Highlight educational outcomes and methodology
- Reference research and best practices
- Show respect for their expertise
- Emphasize collaboration and partnership
`,
      donor: `
DONOR PERSONA:
- Show clear impact and accountability
- Quantify results and ROI
- Demonstrate transparency and effectiveness
- Make giving feel meaningful and urgent
`,
      volunteer: `
VOLUNTEER PERSONA:
- Emphasize meaningful contribution and skills
- Show flexibility and variety of opportunities
- Highlight community and connection
- Make involvement feel rewarding
`,
      community_partner: `
COMMUNITY PARTNER PERSONA:
- Focus on mutual benefit and alignment
- Emphasize credibility and reach
- Show proven track record
- Highlight partnership opportunities
`,
      student: `
STUDENT PERSONA:
- Use encouraging, empowering language
- Focus on growth and achievement
- Show clear path forward
- Celebrate small wins
`,
    };

    return guidelines[persona] || '';
  }

  /**
   * Get funnel stage specific guidelines
   */
  private getFunnelStageGuidelines(funnelStage: string): string {
    const guidelines: Record<string, string> = {
      awareness: `
AWARENESS STAGE:
- Focus on problem/pain point recognition
- Educate about the issue and solution
- Build trust and credibility
- Soft CTAs (learn more, explore)
`,
      consideration: `
CONSIDERATION STAGE:
- Show why your solution is best
- Provide proof and social validation
- Address objections and concerns
- Medium CTAs (get started, see how)
`,
      conversion: `
CONVERSION STAGE:
- Create urgency and scarcity
- Remove friction and risk
- Make the ask clear and direct
- Strong CTAs (enroll now, donate today)
`,
      retention: `
RETENTION STAGE:
- Show appreciation and impact
- Deepen engagement and commitment
- Encourage next-level involvement
- Community-building CTAs
`,
    };

    return guidelines[funnelStage] || '';
  }

  /**
   * Parse AI-generated content based on content type
   */
  private parseGeneratedContent(text: string, contentType: string): any {
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      // Fallback: try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error('Failed to parse AI-generated content as JSON');
        }
      }
      throw new Error('No valid JSON found in AI response');
    }
  }

  /**
   * Create variant in database
   */
  private async createVariant(
    request: GenerationRequest,
    generatedContent: any
  ): Promise<AbTestVariant> {
    const variant = await this.storage.createAbTestVariant({
      testId: request.testId,
      name: `AI Generated ${new Date().toISOString().split('T')[0]}`,
      presentationOverrides: generatedContent,
      isControl: false,
    });

    return variant;
  }

  /**
   * Track AI generation in database
   * FIXED: Now accepts null variantId for failed generations that didn't create a variant
   */
  private async trackGeneration(
    variantId: string | null,
    prompt: string,
    generatedContent: any,
    tokensUsed: number,
    status: 'success' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    // Skip tracking if no variantId and generation failed
    // This prevents database errors from trying to insert null foreign keys
    if (variantId === null && status === 'failed') {
      console.warn('Skipping tracking for failed generation without variant:', errorMessage);
      return;
    }

    const generation: InsertAbTestVariantAiGeneration = {
      variantId: variantId!,
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      prompt,
      generatedContent,
      tokensUsed,
      status,
      errorMessage,
    };

    try {
      await this.storage.createAbTestVariantAiGeneration(generation);
    } catch (error) {
      // Don't fail the whole operation if tracking fails
      console.error('Failed to track AI generation:', error);
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(prompt: string, response: string): number {
    // Rough estimate: ~4 characters per token
    const totalChars = prompt.length + response.length;
    return Math.ceil(totalChars / 4);
  }

  /**
   * Generate multiple variants at once
   */
  async generateMultipleVariants(
    request: GenerationRequest,
    count: number = 3
  ): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Add variation instruction to prompt for each variant
        const variedRequest = {
          ...request,
          controlVariantData: {
            ...request.controlVariantData,
            _variationNumber: i + 1,
          },
        };

        const result = await this.generateVariant(variedRequest);
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate variant ${i + 1}:`, error);
        // Continue with other variants
      }
    }

    return results;
  }

  /**
   * Validate generated content structure matches control
   */
  validateGeneratedContent(
    generated: any,
    control: any
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if both are objects
    if (typeof generated !== 'object' || typeof control !== 'object') {
      errors.push('Generated content must be an object');
      return { isValid: false, errors };
    }

    // Check all required fields from control are present
    for (const key of Object.keys(control)) {
      if (!(key in generated)) {
        errors.push(`Missing required field: ${key}`);
      }
    }

    // Check for unexpected fields
    for (const key of Object.keys(generated)) {
      if (!(key in control) && !key.startsWith('_')) {
        errors.push(`Unexpected field: ${key}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get generation history for a test
   */
  async getGenerationHistory(
    testId: string
  ): Promise<Array<{variant: AbTestVariant; generation: any}>> {
    const test = await this.storage.getAbTest(testId);
    if (!test) return [];

    const variants = await this.storage.getAbTestVariants(testId);
    const history = [];

    for (const variant of variants) {
      const generation = await this.storage.getAbTestVariantAiGeneration(variant.id);
      if (generation) {
        history.push({ variant, generation });
      }
    }

    return history;
  }
}
