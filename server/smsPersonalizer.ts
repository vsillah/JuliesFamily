import { GoogleGenAI } from "@google/genai";
import type { Lead, SmsTemplate } from "@shared/schema";
import type { Interaction } from "@shared/schema";

// Validate API key at module load
if (!process.env.GOOGLE_API_KEY) {
  console.warn("GOOGLE_API_KEY not configured - SMS personalization will fall back to basic variable replacement");
}

const genAI = process.env.GOOGLE_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
  : null;

interface PersonalizationContext {
  lead: Lead;
  recentInteractions?: Interaction[];
  template: SmsTemplate;
}

interface PersonalizedSms {
  messageContent: string;
  characterCount: number;
  suggestedVariables: Record<string, string>;
  personalizationNotes: string;
}

export async function personalizeSmsTemplate(
  context: PersonalizationContext
): Promise<PersonalizedSms> {
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
    if (!parsed.messageContent) {
      console.error("Gemini response missing required messageContent field");
      return basicPersonalization(lead, template);
    }

    // HARD ENFORCE character limit - fall back if AI generates over 160
    const charCount = parsed.messageContent.length;
    if (charCount > 160) {
      console.warn(`AI-generated SMS is ${charCount} characters (over 160 limit) - falling back to basic personalization`);
      return basicPersonalization(lead, template);
    }
    
    return {
      messageContent: parsed.messageContent,
      characterCount: charCount,
      suggestedVariables: parsed.suggestedVariables || {},
      personalizationNotes: parsed.personalizationNotes || "AI personalization applied",
    };
  } catch (error) {
    console.error("Failed to personalize SMS with Gemini:", error);
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
  template: SmsTemplate
): PersonalizedSms {
  // Extract variables from template by finding {variable} placeholders
  const variableMatches = template.messageTemplate.match(/\{([^}]+)\}/g) || [];
  const variables = variableMatches.map(match => match.replace(/[{}]/g, ''));
  const variableValues = generateVariablesSuggestionsSync(lead, variables);
  
  let messageContent = template.messageTemplate;

  // Replace all template variables with actual values
  Object.entries(variableValues).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    messageContent = messageContent.replace(new RegExp(placeholder, 'g'), value);
  });

  return {
    messageContent,
    characterCount: messageContent.length,
    suggestedVariables: variableValues,
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
  if (templateVariables.includes('phone')) {
    suggestions.phone = lead.phone || '';
  }

  // Persona-specific suggestions
  if (lead.persona === 'parent' && templateVariables.includes('childName')) {
    const metadata = lead.metadata as any;
    suggestions.childName = metadata?.childName || 'your child';
  }

  if (lead.persona === 'donor') {
    if (templateVariables.includes('amount')) {
      suggestions.amount = '$50';
    }
    if (templateVariables.includes('lastAmount')) {
      const metadata = lead.metadata as any;
      suggestions.lastAmount = metadata?.lastDonationAmount || '$50';
    }
    if (templateVariables.includes('companyName')) {
      const metadata = lead.metadata as any;
      suggestions.companyName = metadata?.companyName || 'your org';
    }
  }

  // Time-based suggestions
  if (templateVariables.includes('monthsSince') && lead.lastInteractionDate) {
    const months = Math.floor((Date.now() - new Date(lead.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    suggestions.monthsSince = Math.max(1, months).toString();
  }

  if (templateVariables.includes('dayOfWeek')) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    suggestions.dayOfWeek = days[today.getDay()];
  }

  if (templateVariables.includes('time')) {
    suggestions.time = '2:00pm';
  }

  if (templateVariables.includes('date')) {
    const today = new Date();
    suggestions.date = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Location-based
  if (templateVariables.includes('cityName')) {
    const metadata = lead.metadata as any;
    suggestions.cityName = metadata?.city || 'your area';
  }

  if (templateVariables.includes('address')) {
    suggestions.address = '123 Main St';
  }

  // URL shortening placeholder
  if (templateVariables.includes('link')) {
    suggestions.link = 'jflearn.org/enroll';
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
  template: SmsTemplate
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

  const templateVars = (template.variables as string[]) || [];

  return `You are an expert SMS copywriter trained in Alex Hormozi's "$100M Leads" communication strategies, optimized for SMS constraints.

**Your Task**: Personalize this SMS template for a specific recipient using their CRM data.

**CRITICAL SMS CONSTRAINTS**:
- MAXIMUM 160 characters for single-segment SMS (preferred)
- If absolutely necessary, max 306 characters (2 segments)
- Plain text only - no HTML, no formatting
- Ultra-concise, punchy, action-oriented
- Conversational tone like texting a friend
- MUST include opt-out compliance (already in template)

**Template Information**:
- Template Name: ${template.name}
- Outreach Type: ${template.outreachType || 'N/A'}
- Template Category: ${template.templateCategory || 'N/A'}
- Description: ${template.description || 'N/A'}
- Example Context: ${template.exampleContext || 'N/A'}
- Target Character Count: 160

**Recipient CRM Data**:
- Name: ${lead.firstName || 'Unknown'} ${lead.lastName || ''}
- Phone: ${lead.phone || 'Unknown'}
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

**Original Template Message**:
${template.messageTemplate}

**Available Variables**: Extract from {variable} placeholders in the template

**Personalization Instructions**:

1. **Analyze CRM Data Quickly**:
   - Recent interactions (what they did, when)
   - Their persona and journey stage
   - Specific details from notes/metadata
   - Time since last contact

2. **Fill Variables Smartly**:
   - Use real CRM data when available
   - Make educated guesses based on persona/context when missing
   - Keep tone casual and friendly (like texting, not emailing)
   - First names only unless context requires formality

3. **SMS-Specific Optimization**:
   - Use abbreviations if natural ("LAST DAY" not "Last Day Available")
   - Numbers over words ("2hrs" not "two hours", "$50" not "fifty dollars")
   - Action verbs ("Click", "Reply", "Join", "Give")
   - Remove filler words ruthlessly
   - Front-load the most important info

4. **Character Count Management**:
   - PRIORITIZE staying under 160 characters
   - Every character matters - be brutal with cuts
   - Keep opt-out language (STOP) - it's required
   - If you must go over 160, explain why in personalizationNotes

5. **Maintain Hormozi Framework**:
   - Keep template's strategic approach (A-C-A, urgency, social proof, etc.)
   - Don't change the core message
   - Preserve the framework's intent

6. **Output Requirements**:
   - Replace ALL {variables} with actual content
   - NO placeholders like [childName] - fill with something specific
   - Make it feel personal but concise
   - Count every character including spaces

**Return ONLY valid JSON in this exact format (no markdown, no code blocks)**:
{
  "messageContent": "Complete SMS message with all variables filled - aim for ≤160 chars",
  "characterCount": 142,
  "suggestedVariables": {
    "firstName": "actual value used",
    "anyOtherVariable": "actual value used"
  },
  "personalizationNotes": "Brief note on key changes made and character count management (1-2 sentences)"
}

**Important**:
- Be specific and concrete, not generic
- Use actual name/data from CRM
- Make every word count
- If missing critical data, make smart assumptions based on persona
- Remember: This is Julie's warm, helpful nonprofit - keep that voice
- Character count is CRITICAL - prioritize brevity over perfection`;
}

export async function generateVariablesSuggestions(
  lead: Lead,
  templateVariables: string[]
): Promise<Record<string, string>> {
  return generateVariablesSuggestionsSync(lead, templateVariables);
}
