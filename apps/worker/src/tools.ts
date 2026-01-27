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
  addToBacklogSchema,
  scheduleBlockSchema,
  updateTaskSchema,
  deleteTaskSchema,
  type FluxState,
} from "@flux/shared";

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

const addToBacklog = tool({
  description: addToBacklogSchema.description,
  inputSchema: addToBacklogSchema.parameters,
  execute: async (task) => {
    const { agent } = getCurrentAgent<Chat>();
    const newTask = {
      id: crypto.randomUUID(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      tags: task.tags || [],
    };

    // Update state
    const currentState = agent!.state;
    agent!.setState({
      ...currentState,
      backlog: [...(currentState.backlog || []), newTask],
      events: [
        ...(currentState.events || []),
        {
          id: crypto.randomUUID(),
          type: "TASK_CREATED",
          payload: newTask,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    return `Added "${task.title}" to backlog.`;
  },
});

const scheduleBlock = tool({
  description: scheduleBlockSchema.description,
  inputSchema: scheduleBlockSchema.parameters,
  execute: async (block) => {
    const { agent } = getCurrentAgent<Chat>();

    // Helper to ensure full ISO string
    const normalizeTime = (timeStr: string) => {
      if (timeStr.includes("T")) return timeStr; // Already ISO
      // Assuming HH:MM or HH:MM:SS format for today
      const today = new Date().toISOString().split("T")[0];
      return `${today}T${timeStr}`;
    };

    const startTime = normalizeTime(block.startTime);
    const endTime = normalizeTime(block.endTime);

    // Create ephemeral ID if no backlog task is provided
    const taskId = block.taskId || crypto.randomUUID();

    const newBlock = {
      id: crypto.randomUUID(),
      taskId,
      startTime,
      endTime,
      status: "pending" as const,
    };

    // Update state
    const currentState = agent!.state;

    // If this is a new ad-hoc task (no taskId provided), add it to backlog implicitly
    let newBacklog = currentState.backlog || [];
    let newEvents = currentState.events || [];

    // Check if task exists, if not create it
    const taskExists = newBacklog.find((t) => t.id === taskId);
    if (!taskExists) {
      const newTask = {
        id: taskId,
        title: block.title,
        priority: "medium" as const, // Default priority
        tags: ["scheduled"],
      };
      newBacklog = [...newBacklog, newTask];
      newEvents = [
        ...newEvents,
        {
          id: crypto.randomUUID(),
          type: "TASK_CREATED",
          payload: newTask,
          timestamp: new Date().toISOString(),
        },
      ];
    }

    agent!.setState({
      ...currentState,
      backlog: newBacklog,
      stream: [...(currentState.stream || []), newBlock],
      events: [
        ...newEvents,
        {
          id: crypto.randomUUID(),
          type: "BLOCK_SCHEDULED",
          payload: newBlock,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    return `Scheduled "${block.title}" from ${new Date(startTime).toLocaleTimeString()} to ${new Date(endTime).toLocaleTimeString()}.`;
  },
});

const updateTask = tool({
  description: updateTaskSchema.description,
  inputSchema: updateTaskSchema.parameters,
  execute: async ({ id, updates }) => {
    const { agent } = getCurrentAgent<Chat>();
    const currentState = agent!.state;

    const backlog = currentState.backlog || [];
    const taskIndex = backlog.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return `Task with ID ${id} not found.`;
    }

    const updatedTask = { ...backlog[taskIndex], ...updates };
    const newBacklog = [...backlog];
    newBacklog[taskIndex] = updatedTask;

    agent!.setState({
      ...currentState,
      backlog: newBacklog,
      events: [
        ...(currentState.events || []),
        {
          id: crypto.randomUUID(),
          type: "TASK_UPDATED",
          payload: { id, updates },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    return `Updated task ${updatedTask.title}`;
  },
});

const deleteTask = tool({
  description: deleteTaskSchema.description,
  inputSchema: deleteTaskSchema.parameters,
  execute: async ({ id }) => {
    const { agent } = getCurrentAgent<Chat>();
    const currentState = agent!.state;

    // Remove from backlog
    const backlog = currentState.backlog || [];
    const newBacklog = backlog.filter((t) => t.id !== id);

    // Remove from stream
    const stream = currentState.stream || [];
    const newStream = stream.filter((b) => b.taskId !== id);

    agent!.setState({
      ...currentState,
      backlog: newBacklog,
      stream: newStream,
      events: [
        ...(currentState.events || []),
        {
          id: crypto.randomUUID(),
          type: "TASK_DELETED",
          payload: { id },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    return `Deleted task ${id} and associated blocks.`;
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

/**
 * Export all available tools
 */
export const tools = {
  getWeatherInformation,
  getLocalTime,
  addToBacklog,
  scheduleBlock,
  updateTask,
  deleteTask,
  // scheduleTask, // Disable old scheduler for now to avoid confusion
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
