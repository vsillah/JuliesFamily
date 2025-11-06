import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || undefined,
});

export async function analyzeSocialPostScreenshot(imageBase64: string): Promise<{
  caption: string;
  platform: 'instagram' | 'facebook';
  username: string;
  suggestedTitle: string;
  suggestedLink: string;
}> {

  const prompt = `You are analyzing a screenshot of a social media post. Extract the following information:

1. **Caption/Description**: The full text content of the post
2. **Platform**: Whether this is from Instagram or Facebook (look for visual indicators like interface design, icons, etc.)
3. **Username**: The account name/handle that posted this
4. **Suggested Title**: Create a short, descriptive title (max 60 characters) that summarizes what this post is about
5. **Link**: If visible, extract any links mentioned in the post. If the username is visible, construct a profile link.

For Instagram: https://instagram.com/{username}
For Facebook: https://www.facebook.com/{username}

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "caption": "the full post text here",
  "platform": "instagram",
  "username": "accountname",
  "suggestedTitle": "Brief description of post",
  "suggestedLink": "https://instagram.com/accountname"
}

If you cannot determine a field with confidence, use these defaults:
- caption: ""
- platform: "instagram"
- username: ""
- suggestedTitle: "Social Media Post"
- suggestedLink: ""`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
        ],
      },
    ],
  });

  const responseText = result.response?.text() || result.text || "";
  
  // Clean up the response to ensure it's valid JSON
  let cleanedResponse = responseText.trim();
  
  // Remove markdown code blocks if present
  cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
  cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
  cleanedResponse = cleanedResponse.trim();

  try {
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate and provide defaults
    return {
      caption: parsed.caption || "",
      platform: (parsed.platform === 'facebook' ? 'facebook' : 'instagram') as 'instagram' | 'facebook',
      username: parsed.username || "",
      suggestedTitle: parsed.suggestedTitle || "Social Media Post",
      suggestedLink: parsed.suggestedLink || "",
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", cleanedResponse);
    throw new Error("Failed to analyze screenshot - invalid response format");
  }
}
