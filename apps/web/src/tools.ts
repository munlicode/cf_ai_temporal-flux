import { z } from "zod";

export const tools = {
  getWeatherInformation: {
    description: "show the weather in a given city to the user",
    parameters: z.object({ city: z.string() }),
  },
  getLocalTime: {
    description: "get the local time for a specified location",
    parameters: z.object({ location: z.string() }),
  },
  scheduleTask: {
    description: "A tool to schedule a task to be executed at a later time",
    parameters: z.object({
      when: z.any(),
      description: z.string(),
    }),
  },
  getScheduledTasks: {
    description: "List all tasks that have been scheduled",
    parameters: z.object({}),
  },
  cancelScheduledTask: {
    description: "Cancel a scheduled task using its ID",
    parameters: z.object({
      taskId: z.string().describe("The ID of the task to cancel"),
    }),
  },
};
