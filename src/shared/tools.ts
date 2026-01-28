import { z } from "zod";

/**
 * Shared tool definitions (schemas and descriptions)
 */

export const scheduleBlockSchema = {
	description: "Schedule a task block on the execution timeline",
	parameters: z.object({
		title: z.string().describe("The title of the task"),
		description: z.string().optional().describe("Description of the task"),
		priority: z.enum(["high", "medium", "low"]).default("medium"),
		tags: z.array(z.string()).optional(),
		startTime: z
			.string()
			.describe("ISO 8601 start time (e.g., 2024-01-27T20:00:00)"),
		endTime: z.string().describe("ISO 8601 end time"),
	}),
};

export const updateBlockSchema = {
	description: "Update an existing block on the timeline",
	parameters: z.object({
		id: z.string().describe("The ID of the block to update"),
		updates: z
			.object({
				title: z.string().optional(),
				description: z.string().optional(),
				priority: z.enum(["high", "medium", "low"]).optional(),
				startTime: z.string().optional(),
				endTime: z.string().optional(),
				status: z.enum(["pending", "completed", "cancelled"]).optional(),
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

export const deleteBlockSchema = {
	description: "Delete a block from the timeline",
	parameters: z.object({
		id: z.string().describe("The ID of the block to delete"),
	}),
};

export const useArchitectSchema = {
	description:
		"Trigger 'The Architect' workflow to break down a vague goal into concrete tasks.",
	parameters: z.object({
		goal: z.string().describe("The high-level goal to decompose"),
	}),
};
