import { tool, type ToolSet } from "ai";
import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import {
  scheduleBlockSchema,
  updateBlockSchema,
  deleteBlockSchema,
  useArchitectSchema,
  createPlanSchema,
  switchPlanSchema,
  listPlansSchema,
  deletePlanSchema,
} from "@shared";

/**
 * Core Timeline Management Tools
 */

const scheduleBlock = tool({
  description: scheduleBlockSchema.description,
  inputSchema: scheduleBlockSchema.parameters,
  execute: async (input) => {
    const { agent } = getCurrentAgent<Chat>();

    // Helper to ensure full ISO string
    const normalizeTime = (timeStr: string) => {
      if (timeStr.includes("T")) return timeStr; // Already ISO
      const today = new Date().toISOString().split("T")[0];
      return `${today}T${timeStr}`;
    };

    const startTime = normalizeTime(input.startTime);
    const endTime = normalizeTime(input.endTime);

    const newBlock = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description || "",
      priority: input.priority || "medium",
      tags: input.tags || [],
      startTime,
      endTime,
      status: "pending" as const,
    };

    agent!.scheduleBlocks([newBlock]);

    return `Scheduled "${input.title}" from ${new Date(startTime).toLocaleTimeString()} to ${new Date(endTime).toLocaleTimeString()}.`;
  },
});

const updateBlock = tool({
  description: updateBlockSchema.description,
  inputSchema: updateBlockSchema.parameters,
  execute: async ({ id, updates }) => {
    const { agent } = getCurrentAgent<Chat>();
    const result = agent!.updateBlockState(id, updates);

    if (!result) {
      return `Block with ID ${id} not found on timeline.`;
    }

    return `Updated block "${result.title}" on timeline.`;
  },
});

const deleteBlock = tool({
  description: deleteBlockSchema.description,
  inputSchema: deleteBlockSchema.parameters,
  execute: async ({ id }) => {
    const { agent } = getCurrentAgent<Chat>();
    agent!.deleteBlockState(id);
    return `Deleted block ${id} from timeline.`;
  },
});

const useArchitect = tool({
  description: useArchitectSchema.description,
  inputSchema: useArchitectSchema.parameters,
  execute: async ({ goal }: { goal: string }) => {
    const { agent } = getCurrentAgent<Chat>();
    const userId = agent!.id;

    try {
      await (agent! as any).env.ARCHITECT.create({
        params: { goal, userId },
      });
      return "Architect Workflow started. I'll break down this goal and add tasks to your timeline shortly.";
    } catch (error) {
      return `Failed to trigger architect: ${error}`;
    }
  },
});

/**
 * Export core tools
 */
const createPlan = tool({
  description: createPlanSchema.description,
  inputSchema: createPlanSchema.parameters,
  execute: async ({ title }) => {
    const { agent } = getCurrentAgent<Chat>();
    const plan = agent!.createPlan(title);
    return `Created plan "${plan.title}" (ID: ${plan.id}) and switched to it.`;
  },
});

const switchPlan = tool({
  description: switchPlanSchema.description,
  inputSchema: switchPlanSchema.parameters,
  execute: async ({ id }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      const plan = agent!.switchPlan(id);
      return `Switched to plan "${plan.title}" (ID: ${plan.id}).`;
    } catch (e: any) {
      return `Failed to switch plan: ${e.message}`;
    }
  },
});

const listPlans = tool({
  description: listPlansSchema.description,
  inputSchema: listPlansSchema.parameters,
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();
    const plans = agent!.listPlans();
    return `Available plans:\n${plans.map((p) => `- ${p.title} (ID: ${p.id}) ${p.isActive ? "[ACTIVE]" : ""} [${p.blocksCount} blocks]`).join("\n")}`;
  },
});

const deletePlan = tool({
  description: deletePlanSchema.description,
  inputSchema: deletePlanSchema.parameters,
  execute: async ({ id }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      agent!.deletePlan(id);
      return `Deleted plan ${id}.`;
    } catch (e: any) {
      return `Failed to delete plan: ${e.message}`;
    }
  },
});

/**
 * Export core tools
 */
export const tools = {
  scheduleBlock,
  updateBlock,
  deleteBlock,
  useArchitect,
  createPlan,
  switchPlan,
  listPlans,
  deletePlan,
} satisfies ToolSet;

/**
 * Implementation of confirmation-required tools (Empty for now)
 */
export const executions = {};
