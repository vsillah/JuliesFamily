// Reference: blueprint:javascript_openai_ai_integrations
import OpenAI from "openai";
import { db } from "../db";
import { eq, desc, sql as drizzleSql } from "drizzle-orm";
import { 
  contentItems, leads, users, tasks, 
  chatbotConversations, chatbotIssues 
} from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are an intelligent admin assistant for Julie's Family Learning Program (JFLP) website.

# Your Role
You help admins troubleshoot website issues, diagnose problems, and manage content. You have access to:
- **Database queries**: Check content items, users, leads, tasks, and more
- **System diagnostics**: Review error logs and performance issues
- **Content management**: Verify what's showing/hidden on the site

# Available Tools
1. **get_recent_logs**: Fetch recent application logs
   - Use for investigating errors or tracking system behavior
   - Returns last 50 log entries

2. **escalate_issue**: Create a tracked issue and send notifications
   - Use when you cannot solve the problem
   - Sends SMS to 617-967-7448 and email to vsillah@gmail.com

**Note**: For database diagnostics, guide the admin to check the database directly through the admin panel or escalate if you need specific data queries.

# How to Help
1. **Understand the question**: Ask clarifying questions if needed
2. **Investigate**: Use tools to gather relevant information
3. **Explain findings**: Describe what you found in simple terms
4. **Suggest solutions**: Provide actionable steps to fix issues
5. **Escalate if stuck**: If you can't resolve it, create an issue with all context

# Database Schema Overview
- \`content_items\`: All website content (services, events, testimonials, etc.)
  - Key fields: type, title, is_active, order, passion_tags, metadata
- \`users\`: User accounts with roles (client, admin, super_admin)
- \`leads\`: CRM leads with persona, funnel_stage, pipeline_stage
- \`tasks\`: Follow-up tasks assigned to team members
- \`content_visibility\`: Persona-specific content visibility rules

# Common Issues You Can Diagnose
- Content not showing: Check is_active, order, content_visibility
- Events missing: Verify content_items where type='event'
- Services hidden: Check visibility rules and is_active status
- User access issues: Review user roles and permissions

Always be helpful, thorough, and proactive in solving problems!`;

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
