import { tool, type ToolSet } from "ai";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { scheduleSchema } from "agents/schedule";
import {
  getWeatherInformationSchema,
  getLocalTimeSchema,
  scheduleTaskSchema,
  getScheduledTasksSchema,
  cancelScheduledTaskSchema,
  scheduleBlockSchema,
  updateBlockSchema,
  deleteBlockSchema,
  useArchitectSchema,
  type FluxState,
} from "../shared";

/**
 * Weather information tool that requires human confirmation
 */
const getWeatherInformation = tool({
  description: getWeatherInformationSchema.description,
  inputSchema: getWeatherInformationSchema.parameters,
});

/**
 * Local time tool that executes automatically
 */
const getLocalTime = tool({
  description: getLocalTimeSchema.description,
  inputSchema: getLocalTimeSchema.parameters,
  execute: async ({ location }: { location: string }) => {
    console.log(`Getting local time for ${location}`);
    return "10am";
  },
});

// addToBacklog tool removed - use scheduleBlock instead

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
      description: input.description,
      priority: input.priority,
      tags: input.tags || [],
      startTime,
      endTime,
      status: "pending" as const,
    };

    // Update state
    const currentState = agent!.state;
    agent!.setState({
      ...currentState,
      stream: [...(currentState.stream || []), newBlock],
      events: [
        ...(currentState.events || []),
        {
          id: crypto.randomUUID(),
          type: "BLOCK_SCHEDULED",
          payload: newBlock,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    return `Scheduled "${input.title}" from ${new Date(startTime).toLocaleTimeString()} to ${new Date(endTime).toLocaleTimeString()}.`;
  },
});

const updateBlock = tool({
  description: updateBlockSchema.description,
  inputSchema: updateBlockSchema.parameters,
  execute: async ({ id, updates }) => {
    const { agent } = getCurrentAgent<Chat>();
    const currentState = agent!.state;

    const stream = currentState.stream || [];
    const blockIndex = stream.findIndex((b) => b.id === id);

    if (blockIndex === -1) {
      return `Block with ID ${id} not found on timeline.`;
    }

    const updatedBlock = { ...stream[blockIndex], ...updates };
    const newStream = [...stream];
    newStream[blockIndex] = updatedBlock;

    agent!.setState({
      ...currentState,
      stream: newStream,
      events: [
        ...(currentState.events || []),
        {
          id: crypto.randomUUID(),
          type: "BLOCK_UPDATED",
          payload: { id, updates },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    return `Updated block "${updatedBlock.title}" on timeline.`;
  },
});

const deleteBlock = tool({
  description: deleteBlockSchema.description,
  inputSchema: deleteBlockSchema.parameters,
  execute: async ({ id }) => {
    const { agent } = getCurrentAgent<Chat>();
    const currentState = agent!.state;

    const stream = currentState.stream || [];
    const newStream = stream.filter((b) => b.id !== id);

    agent!.setState({
      ...currentState,
      stream: newStream,
      events: [
        ...(currentState.events || []),
        {
          id: crypto.randomUUID(),
          type: "BLOCK_DELETED",
          payload: { id },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    return `Deleted block ${id} from timeline.`;
  },
});

const scheduleTask = tool({
  description: scheduleTaskSchema.description,
  inputSchema: scheduleSchema, // override with specific worker schema
  execute: async ({
    when,
    description,
  }: {
    when: any;
    description: string;
  }) => {
    // we can now read the agent context from the ALS store
    const { agent } = getCurrentAgent<Chat>();

    function throwError(msg: string): string {
      throw new Error(msg);
    }
    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }
    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");
    try {
      agent!.schedule(input!, "executeTask", description);
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
    return `Task scheduled for type "${when.type}" : ${input}`;
  },
});

/**
 * Tool to list all scheduled tasks
 */
const getScheduledTasks = tool({
  description: getScheduledTasksSchema.description,
  inputSchema: getScheduledTasksSchema.parameters,
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();

    try {
      const tasks = agent!.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return tasks;
    } catch (error) {
      console.error("Error listing scheduled tasks", error);
      return `Error listing scheduled tasks: ${error}`;
    }
  },
});

/**
 * Tool to cancel a scheduled task by its ID
 */
const cancelScheduledTask = tool({
  description: cancelScheduledTaskSchema.description,
  inputSchema: cancelScheduledTaskSchema.parameters,
  execute: async ({ taskId }: { taskId: string }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      await agent!.cancelSchedule(taskId);
      return `Task ${taskId} has been successfully canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task ${taskId}: ${error}`;
    }
  },
});

const useArchitect = tool({
  description:
    "Trigger 'The Architect' workflow. Use this for ANY high-level goal, vague request, or project that needs to be broken down into steps (e.g., 'Learn German', 'Build a house', 'Plan a wedding').",
  inputSchema: useArchitectSchema.parameters,
  execute: async ({ goal }: { goal: string }) => {
    const { agent } = getCurrentAgent<Chat>();
    // Use the agent id as userId
    const userId = agent!.id;

    // Trigger workflow
    try {
      await (agent! as any).env.ARCHITECT.create({
        payload: { goal, userId },
      });
      return "Architect Workflow started. I'll break down this goal and add tasks to your timeline shortly.";
    } catch (error) {
      console.error("Error triggering architect workflow", error);
      return `Failed to trigger architect: ${error}`;
    }
  },
});

/**
 * Export all available tools
 */
export const tools = {
  getWeatherInformation,
  getLocalTime,
  scheduleBlock,
  updateBlock,
  deleteBlock,
  useArchitect,
  getScheduledTasks,
  cancelScheduledTask,
} satisfies ToolSet;

/**
 * Implementation of confirmation-required tools
 */
export const executions = {
  getWeatherInformation: async ({ city }: { city: string }) => {
    console.log(`Getting weather information for ${city}`);
    return `The weather in ${city} is sunny`;
  },
};
