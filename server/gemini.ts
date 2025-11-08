import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function analyzeSocialPostScreenshot(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  caption: string;
  platform: 'instagram' | 'facebook' | 'linkedin';
  username: string;
  suggestedTitle: string;
  suggestedLink: string;
}> {

  const prompt = `You are analyzing a screenshot of a social media post. Extract the following information:

1. **Caption/Description**: The full text content of the post
2. **Platform**: Whether this is from Instagram, Facebook, or LinkedIn (look for visual indicators like interface design, icons, colors, layout, etc.)
3. **Username**: The account name/handle or company name that posted this
4. **Suggested Title**: Create a short, descriptive title (max 60 characters) that summarizes what this post is about
5. **Link**: If visible, extract any links mentioned in the post. If the username/company name is visible, construct a profile link.

For Instagram: https://instagram.com/{username}
For Facebook: https://www.facebook.com/{username}
For LinkedIn: https://linkedin.com/company/{company-name}

Visual platform indicators:
- Instagram: Camera icon, colorful gradient theme, square/portrait photos
- Facebook: Blue theme, "f" logo, reactions icons (Like, Love, etc.)
- LinkedIn: Blue and white professional theme, "in" logo, corporate/professional content

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
              mimeType: mimeType,
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
    
    // Validate platform and provide defaults
    let platform: 'instagram' | 'facebook' | 'linkedin' = 'instagram';
    if (parsed.platform === 'facebook') {
      platform = 'facebook';
    } else if (parsed.platform === 'linkedin') {
      platform = 'linkedin';
    }
    
    return {
      caption: parsed.caption || "",
      platform,
      username: parsed.username || "",
      suggestedTitle: parsed.suggestedTitle || "Social Media Post",
      suggestedLink: parsed.suggestedLink || "",
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", cleanedResponse);
    throw new Error("Failed to analyze screenshot - invalid response format");
  }
}

export async function analyzeYouTubeVideoThumbnail(
  thumbnailUrl: string,
  videoTitle?: string,
  videoDescription?: string
): Promise<{
  suggestedTitle: string;
  suggestedDescription: string;
  category: string;
  tags: string[];
}> {
  // Fetch the thumbnail image
  const response = await fetch(thumbnailUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString('base64');

  const prompt = `You are analyzing a thumbnail from a YouTube video${videoTitle ? ` titled "${videoTitle}"` : ''}${videoDescription ? ` with description: "${videoDescription}"` : ''}. 

Based on the thumbnail image${videoTitle ? ', title,' : ''}${videoDescription ? ' and description,' : ''} extract or suggest the following:

1. **Suggested Title**: ${videoTitle ? `Refine or improve the existing title "${videoTitle}" to be more engaging and descriptive (max 80 characters)` : 'Create a compelling, descriptive title (max 80 characters) that captures what this video is about'}
2. **Suggested Description**: Create a detailed description (2-3 sentences) that would work well for a nonprofit educational program website, highlighting the value and content
3. **Category**: Classify this video into ONE of these categories: virtual_tour, program_overview, testimonial, educational_content, event_coverage, community_impact
4. **Tags**: Suggest 3-5 relevant tags/keywords that describe this video's content (e.g., "early learning", "family programs", "community", "education")

Visual analysis cues:
- Look for people (staff, families, children) to identify testimonials or program activities
- Identify facilities, classrooms, or spaces to categorize as virtual_tour
- Look for text overlays, graphics, or presentation elements to identify educational_content
- Identify group activities or gatherings to categorize as event_coverage or community_impact

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "suggestedTitle": "Engaging video title here",
  "suggestedDescription": "Detailed 2-3 sentence description highlighting educational value and impact for families",
  "category": "virtual_tour",
  "tags": ["tag1", "tag2", "tag3"]
}

If you cannot determine a field with confidence, use these defaults:
- suggestedTitle: "${videoTitle || 'Educational Video'}"
- suggestedDescription: "Discover more about our programs and community impact"
- category: "program_overview"
- tags: ["education", "community", "families"]`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
  });

  const responseText = result.response?.text() || result.text || "";
  
  // Clean up the response to ensure it's valid JSON
  let cleanedResponse = responseText.trim();
  cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
  cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
  cleanedResponse = cleanedResponse.trim();

  try {
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate category
    const validCategories = ['virtual_tour', 'program_overview', 'testimonial', 'educational_content', 'event_coverage', 'community_impact'];
    let category = 'program_overview';
    if (validCategories.includes(parsed.category)) {
      category = parsed.category;
    }
    
    return {
      suggestedTitle: parsed.suggestedTitle || videoTitle || "Educational Video",
      suggestedDescription: parsed.suggestedDescription || "Discover more about our programs and community impact",
      category,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ["education", "community", "families"],
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", cleanedResponse);
    throw new Error("Failed to analyze video thumbnail - invalid response format");
  }
}
