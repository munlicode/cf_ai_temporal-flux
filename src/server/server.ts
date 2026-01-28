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
import { processToolCalls, cleanupMessages } from "@shared";
import { tools, executions } from "./tools";
import { validateEnv, type Env } from "./config";
import type { FluxState, StreamBlock, WorkflowStatus, Plan } from "@shared";

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

    // Check for migration
    const currentState = this.state as any;
    if (currentState.stream && !currentState.plans) {
      console.log(`[Chat] Migrating state to multi-plan structure`);
      const defaultPlanId = "default";
      const defaultPlan: Plan = {
        id: defaultPlanId,
        title: "Main Plan",
        stream: currentState.stream,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.initialState = {
        plans: { [defaultPlanId]: defaultPlan },
        activePlanId: defaultPlanId,
        events: currentState.events || [],
        workflow: currentState.workflow,
      };

      // Force update state immediately to persist migration
      this.setState(this.initialState);
    } else {
      const defaultPlanId = "1";
      this.initialState = {
        plans: {
          [defaultPlanId]: {
            id: defaultPlanId,
            title: "Main Plan",
            stream: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        activePlanId: defaultPlanId,
        events: [],
      };
    }
  }

  /**
   * Method called by the ArchitectWorkflow to push results into the state
   */
  /**
   * Internal method to update state with new blocks and log the event
   */
  /**
   * Helper to get the active plan
   */
  private getActivePlan(): Plan | null {
    const { plans, activePlanId } = this.state;
    if (!activePlanId || !plans[activePlanId]) return null;
    return plans[activePlanId];
  }

  /**
   * Helper to save updates to the active plan
   */
  private saveActivePlan(updatedPlan: Plan) {
    const { plans, activePlanId } = this.state;
    if (!activePlanId) return;

    this.setState({
      ...this.state,
      plans: {
        ...plans,
        [activePlanId]: updatedPlan,
      },
    });
  }

  /**
   * Create a new plan
   */
  public createPlan(title: string) {
    const id = generateId();
    const newPlan: Plan = {
      id,
      title,
      stream: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentState = this.state;
    this.setState({
      ...currentState,
      plans: {
        ...currentState.plans,
        [id]: newPlan,
      },
      activePlanId: id, // Switch to new plan immediately
      events: [
        ...(currentState.events || []),
        {
          id: generateId(),
          type: "PLAN_CREATED",
          payload: { id, title },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    return newPlan;
  }

  /**
   * Switch to a different plan
   */
  public switchPlan(id: string) {
    const currentState = this.state;
    if (!currentState.plans[id]) {
      throw new Error(`Plan ${id} not found`);
    }

    this.setState({
      ...currentState,
      activePlanId: id,
    });
    return currentState.plans[id];
  }

  /**
   * Delete a plan
   */
  public deletePlan(id: string) {
    const currentState = this.state;
    const { [id]: deletedPlan, ...remainingPlans } = currentState.plans;

    // If deleting active plan, switch to another one
    let nextActiveId = currentState.activePlanId;
    if (currentState.activePlanId === id) {
      const remainingIds = Object.keys(remainingPlans);
      if (remainingIds.length === 0) {
        throw new Error("Cannot delete the last plan");
      }
      nextActiveId = remainingIds[0];
    }

    this.setState({
      ...currentState,
      plans: remainingPlans,
      activePlanId: nextActiveId,
      events: [
        ...(currentState.events || []),
        {
          id: generateId(),
          type: "PLAN_DELETED",
          payload: { id },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }

  /**
   * List all plans
   */
  public listPlans() {
    return Object.values(this.state.plans).map((p) => ({
      id: p.id,
      title: p.title,
      isActive: p.id === this.state.activePlanId,
      blocksCount: p.stream.length,
    }));
  }

  public scheduleBlocks(newBlocks: StreamBlock[], reason?: string) {
    const activePlan = this.getActivePlan();
    if (!activePlan) return; // Should not happen

    const updatedPlan = {
      ...activePlan,
      stream: [...activePlan.stream, ...newBlocks],
      updatedAt: new Date().toISOString(),
    };

    this.saveActivePlan(updatedPlan);

    this.setState({
      ...this.state,
      events: [
        ...(this.state.events || []),
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
    const activePlan = this.getActivePlan();
    if (!activePlan) return null;

    const stream = activePlan.stream;
    const blockIndex = stream.findIndex((b) => b.id === id);

    if (blockIndex === -1) return null;

    const updatedBlock = { ...stream[blockIndex], ...updates };
    const newStream = [...stream];
    newStream[blockIndex] = updatedBlock;

    const updatedPlan = {
      ...activePlan,
      stream: newStream,
      updatedAt: new Date().toISOString(),
    };

    this.saveActivePlan(updatedPlan);

    this.setState({
      ...this.state,
      events: [
        ...(this.state.events || []),
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
    const activePlan = this.getActivePlan();
    if (!activePlan) return;

    const stream = activePlan.stream;
    const newStream = stream.filter((b) => b.id !== id);

    const updatedPlan = {
      ...activePlan,
      stream: newStream,
      updatedAt: new Date().toISOString(),
    };

    this.saveActivePlan(updatedPlan);

    this.setState({
      ...this.state,
      events: [
        ...(this.state.events || []),
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
   * Internal method to update workflow status
   */
  public setWorkflowStatus(status: Partial<WorkflowStatus>) {
    const currentState = this.state;
    this.setState({
      ...currentState,
      workflow: {
        id: generateId(),
        status: "idle",
        progress: 0,
        ...(currentState.workflow || {}),
        ...status,
      },
      events: [
        ...(currentState.events || []),
        {
          id: generateId(),
          type: "TIMELINE_SHIFTED", // We reuse this or could add WORKFLOW_UPDATED
          payload: status,
          timestamp: new Date().toISOString(),
          reason: "Workflow status update",
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

    // Reset workflow status
    this.setWorkflowStatus({
      status: "completed",
      progress: 100,
      message: "Plan synchronized!",
    });

    // Auto-dismiss after 10 seconds
    const currentWorkflowId = this.state.workflow?.id;
    if (currentWorkflowId) {
      // @ts-ignore
      this.ctx.waitUntil(
        new Promise((resolve) => setTimeout(resolve, 10000)).then(() => {
          // Only dismiss if it's still the same workflow and completed
          if (
            this.state.workflow?.id === currentWorkflowId &&
            this.state.workflow?.status === "completed"
          ) {
            this.setWorkflowStatus({ status: "idle", progress: 0 });
          }
        }),
      );
    }

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
Timeline: ${this.getActivePlan()?.stream?.length || 0} active blocks.
[/CONTEXT]

CORE BEHAVIOR:
1. If the user presents a major new GOAL or context (e.g., "I want to learn German"), check if a relevant plan exists; if not, suggest or use 'createPlan'.
2. If the user wants to break down a goal WITHIN the active plan, use 'useArchitect'.
3. If the user gives a specific task at a specific time, use 'scheduleBlock'.
4. For simple additions to the timeline without a time, assume they want it "next" and use 'scheduleBlock' with a suggested time.
5. You are an EXECUTION AGENT. Don't just talk—use tools to manifest the timeline.
6. CRITICAL: You MUST always start your response with a short verbal phrase (e.g., "I'm on it.", "Scheduling that now...", "Let me structure that query...") BEFORE calling any tool. A response with ONLY a tool call is FORBIDDEN.

Tools:
- 'useArchitect': Use for projects/goals that need breaking down into steps.
- 'scheduleBlock': For adding ANYTHING to the timeline.
- 'updateBlock' / 'deleteBlock': For managing the timeline.
- 'createPlan' / 'switchPlan' / 'listPlans' / 'deletePlan': For managing multiple plans.
`,
          messages: await convertToModelMessages(processedMessages),
          model,
          tools: allTools,
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
