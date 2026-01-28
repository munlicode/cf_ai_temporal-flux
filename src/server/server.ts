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
      stream: [
        {
          id: "1",
          title: "Explore Flux",
          description: "Check out your execution timeline",
          priority: "high",
          tags: ["onboarding"],
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 30 * 60000).toISOString(),
          status: "pending",
        },
      ],
      events: [],
    };
  }

  /**
   * Method called by the ArchitectWorkflow to push results into the state
   */
  async addTasksFromWorkflow(tasks: any[]) {
    console.log(`Received ${tasks.length} tasks from workflow`);

    let lastEndTime = new Date();
    // Round to next 5 minute interval
    lastEndTime.setMinutes(Math.ceil(lastEndTime.getMinutes() / 5) * 5, 0, 0);

    const newBlocks = tasks.map((t) => {
      const duration = t.durationMinutes || 30;
      const startTime = new Date(lastEndTime.getTime() + 5 * 60000); // 5 min gap
      const endTime = new Date(startTime.getTime() + duration * 60000);
      lastEndTime = endTime;

      return {
        id: generateId(),
        title: t.title,
        description: t.description || "",
        duration: duration,
        priority: t.priority || "medium",
        tags: ["architect", "auto-generated"],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "pending" as const,
      };
    });

    const currentState = this.state;
    this.setState({
      ...currentState,
      stream: [...(currentState.stream || []), ...newBlocks],
      events: [
        ...(currentState.events || []),
        {
          id: generateId(),
          type: "BLOCK_SCHEDULED",
          payload: newBlocks,
          timestamp: new Date().toISOString(),
          reason: "Architect workflow completed and auto-scheduled",
        },
      ],
    });

    return { success: true };
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
          system: `You are the ARCHITECT, an AI Project Architect. Your goal is to turn vague user intents into concrete execution timelines.

[CONTEXT]
Today is: ${new Date().toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" })}
Timeline: ${this.state.stream?.length || 0} active blocks.
[/CONTEXT]

CORE BEHAVIOR:
1. If the user presents a GOAL (e.g., "I want to learn German"), IMMEDIATELY use 'useArchitect'.
2. If the user gives a specific task at a specific time, use 'scheduleBlock'.
3. For simple additions to the timeline without a time, assume they want it "next" and use 'scheduleBlock' with a suggested time.
4. You are an EXECUTION AGENT. Don't just talk—use tools to manifest the timeline.
5. Your responses should be minimal: either a tool call or a brief "Architecting your plan..." message.

Tools:
- 'useArchitect': Use for projects/goals that need breaking down into steps.
- 'scheduleBlock': For adding ANYTHING to the timeline.
- 'updateBlock' / 'deleteBlock': For managing the timeline.
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
export { ArchitectWorkflow } from "./architect";

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
