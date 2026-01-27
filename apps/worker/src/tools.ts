import { tool, type ToolSet } from "ai";
import { z } from "zod";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { scheduleSchema } from "agents/schedule";
import {
  getWeatherInformationSchema,
  getLocalTimeSchema,
  scheduleTaskSchema,
  getScheduledTasksSchema,
  cancelScheduledTaskSchema,
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
  scheduleTask,
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
