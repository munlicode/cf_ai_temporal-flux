import { routeAgentRequest, type Schedule } from "agents";
// @ts-ignore
import type { DurableObjectState, Ai } from "@cloudflare/workers-types";
import { AIChatAgent } from "@cloudflare/ai-chat";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet,
} from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { processToolCalls, cleanupMessages } from "../shared";
import { tools, executions } from "./tools";
import { validateEnv, type Env } from "./config";
import type { FluxState } from "../shared";
import { getSchedulePrompt } from "agents/schedule";

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env, FluxState> {
  env: Env;
  id: string;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.env = env;
    this.id = state.id.toString();
    this.initialState = {
      backlog: [
        {
          id: "1",
          title: "Explore Flux",
          description: "Check out the new backlog view",
          priority: "high",
          tags: ["onboarding"],
        },
      ],
      stream: [],
      events: [],
    };
  }

  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal },
  ) {
    console.log("Processing chat message...");
    const ai = createWorkersAI({ binding: this.env.AI });
    const model = ai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    console.log("Model initialized:", model.modelId);

    // Collect all tools, including MCP tools
    let mcpTools = {};
    try {
      mcpTools = this.mcp.getAITools();
    } catch (e) {
      console.warn("Failed to get MCP tools:", e);
    }

    const allTools = {
      ...tools,
      ...mcpTools,
    };

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions,
        });

        const result = streamText({
          system: `You manage the user's Backlog (Strategy) and Stream (Execution).

[SYSTEM CONTEXT]
Today is: ${new Date().toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" })}
ISO Time: ${new Date().toISOString()}

CURRENT APPLICATION STATE:
Backlog (Unscheduled Tasks): ${JSON.stringify(this.state.backlog || [], null, 2)}
Stream (Scheduled Blocks): ${JSON.stringify(this.state.stream || [], null, 2)}
[/SYSTEM CONTEXT]


CRITICAL INSTRUCTIONS:
1. You are a HEADLESS AGENT. Do NOT rely on conversational text.
2. You MUST use tools to modify state. If you don't call a tool, nothing happens.
3. If the user mentions a specific time (e.g., "at 3pm", "tomorrow morning"), IMMEDIATELY use 'scheduleBlock'.
4. If the user has a general task without a time (e.g., "I need to buy milk"), use 'addToBacklog'.
5. For updates or deletions, use 'updateTask' or 'deleteTask'.
6. Do NOT ask for confirmation unless the request is genuinely unintelligible. Assume the user wants action.
7. Your response should be EITHER a tool call OR a very brief confirmation (e.g., "Done.").

Tools Available:
- 'addToBacklog': For unassigned tasks.
- 'updateTask': Modify existing tasks.
- 'deleteTask': Remove tasks and their scheduled blocks.
- 'scheduleBlock': For tasks with a time.
- 'getLocalTime': If you need to resolve relative times like "tomorrow".
`,

          messages: await convertToModelMessages(processedMessages),
          model,
          tools: allTools,
          // Type boundary: streamText expects specific tool types, but base class uses ToolSet
          // This is safe because our tools satisfy ToolSet interface (verified by 'satisfies' in tools.ts)
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10),
          abortSignal: options?.abortSignal,
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  }
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`,
          },
        ],
        metadata: {
          createdAt: new Date(),
        },
      },
    ]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export { StrategistWorkflow } from "./workflow";

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    try {
      const validatedEnv = validateEnv(env);
      const response = await routeAgentRequest(request, validatedEnv);

      if (response) return response;

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("Worker Error:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
        method: request.method,
      });

      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
} satisfies ExportedHandler<Env>;
