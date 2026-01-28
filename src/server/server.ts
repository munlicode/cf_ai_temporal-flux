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
import type { FluxState, StreamBlock } from "../shared";

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env, FluxState> {
  env: Env;
  id: string;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    console.log(`[Chat] Initializing new instance: ${state.id.toString()}`);
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
  /**
   * Internal method to update state with new blocks and log the event
   */
  public scheduleBlocks(newBlocks: StreamBlock[], reason?: string) {
    const currentState = this.state;
    this.setState({
      ...currentState,
      stream: [...(currentState.stream || []), ...newBlocks],
      events: [
        ...(currentState.events || []),
        {
          id: generateId(),
          type: "BLOCK_SCHEDULED",
          payload: newBlocks.length === 1 ? newBlocks[0] : newBlocks,
          timestamp: new Date().toISOString(),
          reason,
        },
      ],
    });
  }

  /**
   * Internal method to update an existing block
   */
  public updateBlockState(id: string, updates: Partial<StreamBlock>) {
    const currentState = this.state;
    const stream = currentState.stream || [];
    const blockIndex = stream.findIndex((b) => b.id === id);

    if (blockIndex === -1) return null;

    const updatedBlock = { ...stream[blockIndex], ...updates };
    const newStream = [...stream];
    newStream[blockIndex] = updatedBlock;

    this.setState({
      ...currentState,
      stream: newStream,
      events: [
        ...(currentState.events || []),
        {
          id: generateId(),
          type: "BLOCK_UPDATED",
          payload: { id, updates },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    return updatedBlock;
  }

  /**
   * Internal method to delete a block
   */
  public deleteBlockState(id: string) {
    const currentState = this.state;
    const stream = currentState.stream || [];
    const newStream = stream.filter((b) => b.id !== id);

    this.setState({
      ...currentState,
      stream: newStream,
      events: [
        ...(currentState.events || []),
        {
          id: generateId(),
          type: "BLOCK_DELETED",
          payload: { id },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }

  /**
   * Method called by the ArchitectWorkflow to push results into the state
   */
  async addTasksFromWorkflow(tasks: any[]) {
    let lastEndTime = new Date();
    // Round to next 5 minute interval
    lastEndTime.setMinutes(Math.ceil(lastEndTime.getMinutes() / 5) * 5, 0, 0);

    const newBlocks: StreamBlock[] = tasks.map((t) => {
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

    this.scheduleBlocks(newBlocks, "Architect workflow completed");
    return { success: true };
  }

  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal },
  ) {
    const ai = createWorkersAI({ binding: this.env.AI });
    const model = ai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");

    // Collect all tools, including MCP tools
    let mcpTools = {};
    try {
      mcpTools = this.mcp.getAITools();
    } catch (e: any) {
      // Silence the 'jsonSchema not initialized' warning as it's expected when no MCP servers are configured
      if (!e?.message?.includes("jsonSchema not initialized")) {
        console.warn("Failed to get MCP tools:", e);
      }
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
5. IMMUTABLE RULE: Always provide a brief verbal acknowledgement (e.g., "Architecting your plan...") whenever you use a tool. Never respond with an empty segment.

Tools:
- 'useArchitect': Use for projects/goals that need breaking down into steps.
- 'scheduleBlock': For adding ANYTHING to the timeline.
- 'updateBlock' / 'deleteBlock': For managing the timeline.
`,
          messages: await convertToModelMessages(processedMessages),
          model,
          tools: allTools,
          maxSteps: 5,
          onStepFinish: (step) => {
            console.log(
              `[Chat] Step finished. Tool calls: ${step.toolCalls.length}, Finish reason: ${step.finishReason}`,
            );
            if (step.toolCalls.length > 0) {
              console.log(
                `[Chat] Tool calls made: ${step.toolCalls.map((tc) => tc.toolName).join(", ")}`,
              );
            }
          },
          onFinish: (result) => {
            console.log(
              `[Chat] Stream finished. Text length: ${result.text?.length || 0}, Finish reason: ${result.finishReason}`,
            );
            return onFinish(result as any);
          },
          abortSignal: options?.abortSignal,
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
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
