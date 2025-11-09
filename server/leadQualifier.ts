import { GoogleGenAI } from "@google/genai";
import type { Lead, IcpCriteria } from "@shared/schema";

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export interface QualificationResult {
  score: number; // 0-100
  status: 'qualified' | 'disqualified' | 'review_needed';
  insights: string; // AI-generated analysis
  matchedCriteria: string[]; // Which ICP criteria they matched
  redFlags: string[]; // Potential concerns
  recommendations: string; // Next steps or suggestions
}

/**
 * Qualify a lead against ICP criteria using Gemini AI
 */
export async function qualifyLead(
  lead: Lead,
  icpCriteria: IcpCriteria
): Promise<QualificationResult> {
  const prompt = `${icpCriteria.qualificationPrompt}

LEAD DATA TO EVALUATE:
- Name: ${lead.firstName} ${lead.lastName}
- Email: ${lead.email}
- Company: ${lead.company || 'Unknown'}
- Job Title: ${lead.jobTitle || 'Unknown'}
- LinkedIn: ${lead.linkedinUrl || 'Not provided'}
- Persona: ${lead.persona}
- Lead Source: ${lead.leadSource || 'Unknown'}
- Notes: ${lead.notes || 'None'}
${lead.enrichmentData ? `
ENRICHMENT DATA:
${JSON.stringify(lead.enrichmentData, null, 2)}
` : ''}

ICP CRITERIA:
${JSON.stringify(icpCriteria.criteria, null, 2)}

${icpCriteria.scoringWeights ? `SCORING WEIGHTS:
${JSON.stringify(icpCriteria.scoringWeights, null, 2)}` : ''}

ANALYSIS INSTRUCTIONS:
1. Evaluate this lead against the ICP criteria
2. Assign a qualification score from 0-100
   - 80-100: Strong fit (qualified)
   - 50-79: Moderate fit (review_needed)
   - 0-49: Poor fit (disqualified)
3. Identify which ICP criteria they match
4. Note any red flags or concerns
5. Provide actionable recommendations

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "score": 85,
  "status": "qualified",
  "insights": "Detailed analysis of why this lead fits or doesn't fit the ICP. Include specific details about their role, company, and relevance.",
  "matchedCriteria": ["Has decision-making authority", "Works in education sector", "Company size 50-500 employees"],
  "redFlags": ["Recent job change", "Company in financial distress"],
  "recommendations": "High priority outreach. Focus on education program ROI. Schedule demo within 48 hours."
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
    
    // Clean up the response to ensure it's valid JSON
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
    cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    cleanedResponse = cleanedResponse.trim();

    const parsed = JSON.parse(cleanedResponse);
    
    // Validate and sanitize the response
    const score = Math.max(0, Math.min(100, parseInt(parsed.score) || 0));
    
    let status: 'qualified' | 'disqualified' | 'review_needed';
    if (score >= 80) {
      status = 'qualified';
    } else if (score >= 50) {
      status = 'review_needed';
    } else {
      status = 'disqualified';
    }
    
    return {
      score,
      status,
      insights: parsed.insights || "No analysis provided",
      matchedCriteria: Array.isArray(parsed.matchedCriteria) ? parsed.matchedCriteria : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      recommendations: parsed.recommendations || "No recommendations provided",
    };
  } catch (error) {
    console.error("Failed to qualify lead:", error);
    throw new Error("Failed to qualify lead - AI analysis error");
  }
}

/**
 * Batch qualify multiple leads
 */
export async function batchQualifyLeads(
  leads: Lead[],
  icpCriteria: IcpCriteria
): Promise<Map<string, QualificationResult>> {
  const results = new Map<string, QualificationResult>();
  
  // Process leads sequentially to avoid rate limits
  // In production, consider implementing proper rate limiting and batching
  for (const lead of leads) {
    try {
      const result = await qualifyLead(lead, icpCriteria);
      results.set(lead.id, result);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to qualify lead ${lead.id}:`, error);
      // Continue with other leads even if one fails
    }
  }
  
  return results;
}

/**
 * Generate personalized outreach email using AI
 */
export async function generateOutreachEmail(
  lead: Lead,
  qualificationResult?: QualificationResult
): Promise<{ subject: string; bodyHtml: string; bodyText: string }> {
  const prompt = `You are an expert outreach email writer for Mentor Rhode Island (MRI), a nonprofit that connects children with caring adult mentors.

LEAD INFORMATION:
- Name: ${lead.firstName} ${lead.lastName}
- Company: ${lead.company || 'Unknown'}
- Job Title: ${lead.jobTitle || 'Unknown'}
- Persona: ${lead.persona}

${qualificationResult ? `
QUALIFICATION INSIGHTS:
${qualificationResult.insights}

MATCHED CRITERIA:
${qualificationResult.matchedCriteria.join(', ')}

RECOMMENDATIONS:
${qualificationResult.recommendations}
` : ''}

${lead.enrichmentData ? `
ENRICHMENT DATA (use this for personalization):
${JSON.stringify(lead.enrichmentData, null, 2)}
` : ''}

TASK:
Write a personalized cold outreach email that:
1. Opens with a relevant hook based on their role/company
2. Clearly states MRI's mission and value proposition
3. Includes a specific call-to-action
4. Keeps it under 150 words (brief and respectful of their time)
5. Professional, warm, and authentic tone
6. NEVER use emojis

MRI VALUE PROPOSITION:
- Connects children with caring adult mentors
- Research-proven impact on educational outcomes
- Flexible mentoring models (site-based, community-based)
- Comprehensive training and support for mentors
- Strong community partnerships

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "subject": "Brief, personalized subject line (max 60 characters)",
  "bodyHtml": "<p>HTML formatted email body</p>",
  "bodyText": "Plain text version of the email"
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
    
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
    cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    cleanedResponse = cleanedResponse.trim();

    const parsed = JSON.parse(cleanedResponse);
    
    return {
      subject: parsed.subject || "Partnership Opportunity with MRI",
      bodyHtml: parsed.bodyHtml || parsed.bodyText || "Email content not generated",
      bodyText: parsed.bodyText || stripHtml(parsed.bodyHtml) || "Email content not generated",
    };
  } catch (error) {
    console.error("Failed to generate outreach email:", error);
    throw new Error("Failed to generate outreach email");
  }
}

/**
 * Simple HTML strip utility
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}
