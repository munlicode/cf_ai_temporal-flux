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

export const addToBacklogSchema = {
  description: "Add a task to the backlog (unassigned tasks)",
  parameters: z.object({
    title: z.string().describe("The title of the task"),
    description: z
      .string()
      .optional()
      .describe("Additional details about the task"),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
    tags: z
      .preprocess((val) => {
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      }, z.array(z.string()))
      .optional(),
  }),
};

export const scheduleBlockSchema = {
  description: "Schedule a task block on the timeline (Stream)",
  parameters: z.object({
    title: z.string().describe("The title of the task"),
    taskId: z
      .string()
      .optional()
      .describe(
        "ID of an existing backlog task. IMPORTANT: Leave empty or omit if this is a new task without an existing ID. Do NOT pass 'null' as a string.",
      ),
    startTime: z
      .string()
      .describe("ISO 8601 start time (e.g., 2024-01-27T20:00:00)"),
    endTime: z.string().describe("ISO 8601 end time"),
  }),
};

export const updateTaskSchema = {
  description: "Update an existing task in the backlog",
  parameters: z.object({
    id: z.string().describe("The ID of the task to update"),
    updates: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["high", "medium", "low"]).optional(),
        tags: z
          .preprocess((val) => {
            if (typeof val === "string") {
              try {
                return JSON.parse(val);
              } catch {
                return val;
              }
            }
            return val;
          }, z.array(z.string()))
          .optional(),
      })
      .describe("The fields to update"),
  }),
};

export const deleteTaskSchema = {
  description:
    "Delete a task from the backlog and remove all its scheduled blocks",
  parameters: z.object({
    id: z.string().describe("The ID of the task to delete"),
  }),
};

export const useStrategistSchema = {
  description:
    "Trigger 'The Strategist' workflow to break down a vague goal into concrete tasks.",
  parameters: z.object({
    goal: z.string().describe("The high-level goal to decompose"),
  }),
};
