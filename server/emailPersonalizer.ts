import { GoogleGenAI } from "@google/genai";
import type { Lead } from "@shared/schema";
import type { Interaction } from "@shared/schema";
import type { HormoziEmailTemplate } from "@shared/hormoziEmailTemplates";
import type { Persona, FunnelStage } from "@shared/defaults/personas";

// Validate API key at module load
if (!process.env.GOOGLE_API_KEY) {
  console.warn("GOOGLE_API_KEY not configured - email personalization will fall back to basic variable replacement");
}

const genAI = process.env.GOOGLE_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
  : null;

interface PersonalizationContext {
  lead: Lead;
  recentInteractions?: Interaction[];
  template: HormoziEmailTemplate;
}

interface PersonalizedEmail {
  subject: string;
  htmlBody: string;
  textBody: string;
  suggestedVariables: Record<string, string>;
  personalizationNotes: string;
}

export async function personalizeEmailTemplate(
  context: PersonalizationContext
): Promise<PersonalizedEmail> {
  const { lead, recentInteractions, template } = context;

  // Fallback to basic personalization if API key not configured
  if (!genAI) {
    console.warn("GOOGLE_API_KEY not available, using basic variable replacement");
    return basicPersonalization(lead, template);
  }

  const prompt = buildPersonalizationPrompt(lead, recentInteractions, template);

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
      return basicPersonalization(lead, template);
    }

    // Try to parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Response was:", cleanedResponse.substring(0, 200));
      // Fallback to basic personalization
      return basicPersonalization(lead, template);
    }

    // Validate required fields exist
    if (!parsed.subject || !parsed.htmlBody || !parsed.textBody) {
      console.error("Gemini response missing required fields");
      return basicPersonalization(lead, template);
    }
    
    return {
      subject: parsed.subject,
      htmlBody: parsed.htmlBody,
      textBody: parsed.textBody,
      suggestedVariables: parsed.suggestedVariables || {},
      personalizationNotes: parsed.personalizationNotes || "AI personalization applied",
    };
  } catch (error) {
    console.error("Failed to personalize email with Gemini:", error);
    // Fallback to basic personalization instead of throwing
    console.log("Falling back to basic variable replacement");
    return basicPersonalization(lead, template);
  }
}

/**
 * Fallback personalization when AI is unavailable or fails
 * Does basic variable replacement using CRM data
 */
function basicPersonalization(
  lead: Lead,
  template: HormoziEmailTemplate
): PersonalizedEmail {
  const variables = generateVariablesSuggestionsSync(lead, template.variables);
  
  let subject = template.subject;
  let htmlBody = template.htmlBody;
  let textBody = template.textBody;

  // Replace all template variables with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    htmlBody = htmlBody.replace(new RegExp(placeholder, 'g'), value);
    textBody = textBody.replace(new RegExp(placeholder, 'g'), value);
  });

  return {
    subject,
    htmlBody,
    textBody,
    suggestedVariables: variables,
    personalizationNotes: "Basic variable replacement applied (AI personalization unavailable)",
  };
}

/**
 * Synchronous version of variable suggestions for fallback
 */
function generateVariablesSuggestionsSync(
  lead: Lead,
  templateVariables: string[]
): Record<string, string> {
  const suggestions: Record<string, string> = {};

  // Map common variables from lead data
  if (templateVariables.includes('firstName')) {
    suggestions.firstName = lead.firstName || 'there';
  }
  if (templateVariables.includes('lastName')) {
    suggestions.lastName = lead.lastName || '';
  }
  if (templateVariables.includes('email')) {
    suggestions.email = lead.email;
  }

  // Persona-specific suggestions
  if (lead.persona === 'parent' && templateVariables.includes('childName')) {
    const metadata = lead.metadata as any;
    suggestions.childName = metadata?.childName || 'your child';
  }

  if (lead.persona === 'student' && templateVariables.includes('careerField')) {
    const metadata = lead.metadata as any;
    suggestions.careerField = metadata?.careerInterest || 'your field';
  }

  if (lead.persona === 'donor' && templateVariables.includes('companyName')) {
    const metadata = lead.metadata as any;
    suggestions.companyName = metadata?.companyName || 'your organization';
  }

  // Time-based suggestions
  if (templateVariables.includes('monthsSince') && lead.lastInteractionDate) {
    const months = Math.floor((Date.now() - new Date(lead.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    suggestions.monthsSince = Math.max(1, months).toString();
  }

  // Location-based
  if (templateVariables.includes('cityName')) {
    const metadata = lead.metadata as any;
    suggestions.cityName = metadata?.city || 'your area';
  }

  // Fill any remaining variables with placeholder values
  templateVariables.forEach(varName => {
    if (!suggestions[varName]) {
      suggestions[varName] = `[${varName}]`;
    }
  });

  return suggestions;
}

function buildPersonalizationPrompt(
  lead: Lead,
  recentInteractions: Interaction[] | undefined,
  template: HormoziEmailTemplate
): string {
  const interactionSummary = recentInteractions && recentInteractions.length > 0
    ? recentInteractions.map(i => `- ${i.interactionType}: ${i.contentEngaged || 'N/A'} (${new Date(i.createdAt!).toLocaleDateString()})`).join('\n')
    : 'No recent interactions recorded';

  const lastInteractionDate = lead.lastInteractionDate 
    ? new Date(lead.lastInteractionDate).toLocaleDateString()
    : 'Never';

  const daysSinceLastInteraction = lead.lastInteractionDate
    ? Math.floor((Date.now() - new Date(lead.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return `You are an expert email copywriter trained in Alex Hormozi's "$100M Leads" communication strategies.

**Your Task**: Personalize this email template for a specific recipient using their CRM data.

**Template Information**:
- Template Name: ${template.name}
- Outreach Type: ${template.outreachType}
- Template Category: ${template.templateCategory}
- Description: ${template.description}
- Example Context: ${template.exampleContext}

**Recipient CRM Data**:
- Name: ${lead.firstName || 'Unknown'} ${lead.lastName || ''}
- Email: ${lead.email}
- Persona: ${lead.persona} (their role/interest)
- Journey Stage: ${lead.funnelStage}
- Lead Source: ${lead.leadSource || 'Unknown'}
- Engagement Score: ${lead.engagementScore || 0}/100
- Last Interaction: ${lastInteractionDate}${daysSinceLastInteraction !== null ? ` (${daysSinceLastInteraction} days ago)` : ''}
- Notes: ${lead.notes || 'No notes available'}
- Metadata: ${lead.metadata ? JSON.stringify(lead.metadata) : 'None'}

**Recent Interactions**:
${interactionSummary}

**Original Template Subject**:
${template.subject}

**Original Template Body (HTML)**:
${template.htmlBody}

**Available Variables**: ${template.variables.join(', ')}

**Personalization Instructions**:

1. **Analyze the CRM Data**: Look for specific details that can make this email feel personal and relevant:
   - Recent interactions (what they downloaded, forms they filled, events they attended)
   - How long since last contact
   - Their specific interests or concerns from notes/metadata
   - Their journey stage (awareness, consideration, decision, retention)
   - Their persona (student, provider, parent, donor, volunteer)

2. **Fill Template Variables Intelligently**:
   - Use real data from CRM when available
   - Make educated assumptions based on persona and context when data is missing
   - Keep the tone warm and conversational (this is Julie's nonprofit)
   - Follow Hormozi's frameworks: acknowledge, compliment, ask (A-C-A) OR lead with value

3. **Customize Beyond Variables**:
   - Reference specific interactions if relevant
   - Adjust urgency based on journey stage
   - Modify examples to match their persona
   - Add or remove sentences to better fit their specific situation

4. **Maintain Template Structure**:
   - Keep the core message and strategy of the original template
   - Don't change the fundamental outreach approach
   - Preserve the template category's intent (A-C-A, value-first, social proof, etc.)

5. **Output Requirements**:
   - Subject line should be compelling and personalized
   - Replace ALL {{variables}} with actual content
   - Make sure HTML and text versions match in content
   - Keep it conversational and genuine (Julie's voice: warm, helpful, not salesy)

**Return ONLY valid JSON in this exact format (no markdown, no code blocks)**:
{
  "subject": "Personalized subject line here",
  "htmlBody": "Complete HTML email body with all variables filled",
  "textBody": "Complete plain text email body with all variables filled",
  "suggestedVariables": {
    "firstName": "actual value used",
    "lastName": "actual value used",
    "anyOtherVariable": "actual value used"
  },
  "personalizationNotes": "Brief explanation of key personalizations made (2-3 sentences)"
}

**Important**:
- Be specific and concrete, not generic
- Use the person's actual name throughout
- Reference real data from their CRM record
- Make it feel like Julie personally wrote this email for them
- If critical data is missing for key variables, make reasonable assumptions based on context but note this in personalizationNotes`;
}

export async function generateVariablesSuggestions(
  lead: Lead,
  templateVariables: string[]
): Promise<Record<string, string>> {
  const suggestions: Record<string, string> = {};

  // Map common variables from lead data
  if (templateVariables.includes('firstName')) {
    suggestions.firstName = lead.firstName || 'there';
  }
  if (templateVariables.includes('lastName')) {
    suggestions.lastName = lead.lastName || '';
  }
  if (templateVariables.includes('email')) {
    suggestions.email = lead.email;
  }

  // Persona-specific suggestions
  if (lead.persona === 'parent' && templateVariables.includes('childName')) {
    // Try to get from metadata
    const metadata = lead.metadata as any;
    suggestions.childName = metadata?.childName || 'your child';
  }

  if (lead.persona === 'student' && templateVariables.includes('careerField')) {
    const metadata = lead.metadata as any;
    suggestions.careerField = metadata?.careerInterest || 'your field';
  }

  if (lead.persona === 'donor' && templateVariables.includes('companyName')) {
    const metadata = lead.metadata as any;
    suggestions.companyName = metadata?.companyName || 'your organization';
  }

  // Time-based suggestions
  if (templateVariables.includes('monthsSince') && lead.lastInteractionDate) {
    const months = Math.floor((Date.now() - new Date(lead.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    suggestions.monthsSince = Math.max(1, months).toString();
  }

  // Location-based
  if (templateVariables.includes('cityName')) {
    const metadata = lead.metadata as any;
    suggestions.cityName = metadata?.city || 'your area';
  }

  return suggestions;
}
