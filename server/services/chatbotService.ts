// Reference: blueprint:javascript_openai_ai_integrations
import OpenAI from "openai";
import { db } from "../db";
import { eq, desc, sql as drizzleSql } from "drizzle-orm";
import { 
  contentItems, leads, users, tasks, 
  chatbotConversations, chatbotIssues 
} from "@shared/schema";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are an intelligent admin assistant for Julie's Family Learning Program (JFLP), a nonprofit CRM and content management platform.

# Your Role
You help admins understand platform data, troubleshoot issues, and answer questions about leads, content, donations, and system performance.

# Platform Overview
JFLP is a persona-based CRM for nonprofits featuring:
- **5 Personas**: student, parent, provider, donor, volunteer
- **4 Funnel Stages**: awareness, consideration, decision, retention
- **Pipeline Stages**: new_lead, contacted, qualified, nurturing, converted, lost
- **Content Types**: service, event, testimonial, hero, cta, socialMedia, video, program_detail
- **Features**: Lead management, donation tracking, email/SMS campaigns, A/B testing, content visibility rules

# Available Tools

## Platform Analytics (Use these to answer data questions)
1. **get_platform_stats**: Get overall platform metrics
   - Returns: Total leads, users, donations, active content
   - Recent activity: Leads/donations/tasks this week
   - Use for: "Show me platform overview", "How's the platform doing?"

2. **get_lead_analytics**: Get detailed lead statistics
   - Accepts filters: persona, funnelStage, pipelineStage, daysBack
   - Returns: Lead counts by persona/funnel/pipeline, recent leads, avg engagement
   - Use for: "How many leads?", "Show donor leads", "Lead breakdown by stage"

3. **get_content_summary**: Get content and A/B test stats
   - Accepts filter: type (service, event, etc.)
   - Returns: Content counts (total/active/inactive), breakdown by type, A/B test status
   - Use for: "What content is published?", "How many programs?", "A/B test status"

4. **get_donation_stats**: Get donation metrics
   - Accepts filter: daysBack
   - Returns: Total donations/amount/average, breakdown by type/status, recent donations, campaign stats
   - Use for: "Show donation stats", "How much donated?", "Recent donations"

## Troubleshooting Tools
5. **get_recent_logs**: Fetch application logs for debugging
   - Use for investigating errors or system behavior

6. **escalate_issue**: Create tracked issue with SMS/email notifications
   - Use when you can't resolve the problem
   - Sends alerts to 617-967-7448 and vsillah@gmail.com

# Important Data Handling Rules
- **NO PII**: Never share individual email addresses, phone numbers, or personal details
- **Aggregate only**: Provide counts, averages, and breakdowns - not raw records
- **Trust the data**: The tools return accurate, real-time data - don't make up numbers
- **Be precise**: Use exact numbers from tool results, don't round unless specified
- **Include context**: Always mention when data was generated and what filters were applied

# CRM Schema Reference
- **Leads**: Email, name, phone, persona, funnelStage, pipelineStage, engagementScore, passions, notes
- **Donations**: Amount (in cents!), type (one-time/recurring/campaign), status, donor info, Stripe IDs
- **Content**: Type, title, description, isActive, order, passionTags, persona visibility
- **Users**: Email, name, role (client/admin/super_admin), persona preference
- **Tasks**: Lead assignment, due date, priority, status, notes

# How to Help
1. **Answer data questions**: Use analytics tools to get accurate, real-time stats
2. **Explain findings**: Present data clearly with context and insights
3. **Troubleshoot issues**: Use logs and analytics to diagnose problems
4. **Guide actions**: Suggest next steps based on data (e.g., "Contact the 15 nurturing-stage donors")
5. **Escalate when stuck**: Create issue if you can't resolve the problem

Always be helpful, data-driven, and proactive!`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
}

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

async function getRecentLogs(): Promise<string> {
  return `[Note: Log access would integrate with Replit's logging system. For now, check the workflow logs in the Replit interface.]`;
}

async function escalateIssue(args: {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  diagnosticData?: any;
}): Promise<string> {
  return JSON.stringify({ 
    action: 'escalate', 
    ...args,
    note: 'Issue will be logged and notifications sent'
  });
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_recent_logs",
      description: "Retrieve recent application logs to investigate errors or system behavior",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "escalate_issue",
      description: "Create a tracked issue when you cannot resolve the problem. This sends notifications to admin via SMS and email.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Brief title summarizing the issue"
          },
          description: {
            type: "string",
            description: "Detailed description of the issue and what was tried"
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "How urgent the issue is"
          },
          category: {
            type: "string",
            description: "Category: content, technical, user_account, performance, or other"
          },
          diagnosticData: {
            type: "object",
            description: "Any relevant data gathered during diagnosis"
          }
        },
        required: ["title", "description", "severity"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_platform_stats",
      description: "Get overall platform metrics including total leads, users, donations, active content, and recent activity (this week)",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_lead_analytics",
      description: "Get detailed lead statistics with optional filtering by persona, funnel stage, pipeline stage, or time period",
      parameters: {
        type: "object",
        properties: {
          persona: {
            type: "string",
            enum: ["student", "parent", "provider", "donor", "volunteer"],
            description: "Filter by specific persona"
          },
          funnelStage: {
            type: "string",
            enum: ["awareness", "consideration", "decision", "retention"],
            description: "Filter by funnel stage"
          },
          pipelineStage: {
            type: "string",
            enum: ["new_lead", "contacted", "qualified", "nurturing", "converted", "lost"],
            description: "Filter by pipeline stage"
          },
          daysBack: {
            type: "number",
            description: "Number of days to look back for recent leads (default: 30)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_content_summary",
      description: "Get content statistics including total, active, inactive counts, breakdown by type, and A/B test status",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["service", "event", "testimonial", "sponsor", "lead_magnet", "impact_stat", "hero", "cta", "socialMedia", "video", "review", "program_detail"],
            description: "Filter by content type"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_donation_stats",
      description: "Get donation metrics including total count, amount, average, breakdown by type/status, recent donations, and campaign stats",
      parameters: {
        type: "object",
        properties: {
          daysBack: {
            type: "number",
            description: "Number of days to look back for recent donations (default: 30)"
          }
        },
        required: []
      }
    }
  }
];

async function executeTool(toolCall: ToolCall): Promise<string> {
  const { name, arguments: argsStr } = toolCall.function;
  const args = JSON.parse(argsStr);

  switch (name) {
    case 'get_recent_logs':
      return await getRecentLogs();
    case 'escalate_issue':
      return await escalateIssue(args);
    case 'get_platform_stats':
      const platformStats = await storage.getPlatformStats();
      return JSON.stringify(platformStats, null, 2);
    case 'get_lead_analytics':
      const leadAnalytics = await storage.getLeadAnalytics(args);
      return JSON.stringify(leadAnalytics, null, 2);
    case 'get_content_summary':
      const contentSummary = await storage.getContentSummary(args);
      return JSON.stringify(contentSummary, null, 2);
    case 'get_donation_stats':
      const donationStats = await storage.getDonationStats(args);
      return JSON.stringify(donationStats, null, 2);
    default:
      return `Unknown tool: ${name}`;
  }
}

export async function processChatMessage(
  userId: string,
  sessionId: string,
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<{ 
  response: string; 
  toolCalls?: any[];
  toolResults?: any[];
  shouldEscalate?: boolean;
  escalationData?: any;
}> {
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      tools: TOOLS,
      max_completion_tokens: 8192,
    });

    const assistantMessage = response.choices[0]?.message;
    
    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const result = await executeTool(toolCall as ToolCall);
          return {
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            result
          };
        })
      );

      const escalationCall = assistantMessage.tool_calls.find(
        tc => tc.function.name === 'escalate_issue'
      );
      
      let shouldEscalate = false;
      let escalationData = null;
      
      if (escalationCall) {
        shouldEscalate = true;
        escalationData = JSON.parse(escalationCall.function.arguments);
      }

      const followUpMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...messages,
        assistantMessage,
        ...toolResults.map(tr => ({
          role: 'tool' as const,
          tool_call_id: tr.tool_call_id,
          content: tr.result
        }))
      ];

      const followUpResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: followUpMessages,
        max_completion_tokens: 8192,
      });

      const finalResponse = followUpResponse.choices[0]?.message?.content || 'I encountered an issue processing your request.';

      return {
        response: finalResponse,
        toolCalls: assistantMessage.tool_calls,
        toolResults,
        shouldEscalate,
        escalationData
      };
    }

    return {
      response: assistantMessage.content || 'I apologize, but I couldn\'t generate a response.'
    };

  } catch (error: any) {
    console.error('Error in chatbot service:', error);
    return {
      response: `I encountered an error: ${error.message}. Please try again or contact support if the issue persists.`
    };
  }
}
