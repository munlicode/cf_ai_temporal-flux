import { z } from "zod";

/**
 * Shared tool definitions (schemas and descriptions)
 * Note: AI SDK v6+ uses 'parameters' for tool definition in some contexts,
 * but 'inputSchema' in others. We'll use 'parameters' consistently and
 * map it if needed, or just use the expected keys.
 */

export const getWeatherInformationSchema = {
  description: "show the weather in a given city to the user",
  parameters: z.object({ city: z.string() }),
};

export const getLocalTimeSchema = {
  description: "get the local time for a specified location",
  parameters: z.object({ location: z.string() }),
};

export const scheduleTaskSchema = {
  description: "A tool to schedule a task to be executed at a later time",
  parameters: z.object({
    when: z.any(),
    description: z.string(),
  }),
};

export const getScheduledTasksSchema = {
  description: "List all tasks that have been scheduled",
  parameters: z.object({}),
};

export const cancelScheduledTaskSchema = {
  description: "Cancel a scheduled task using its ID",
  parameters: z.object({
    taskId: z.string().describe("The ID of the task to cancel"),
  }),
};
