import { tool, type ToolSet } from "ai";
import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import {
	scheduleBlockSchema,
	updateBlockSchema,
	deleteBlockSchema,
	useArchitectSchema,
} from "../shared";

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
export const tools = {
	scheduleBlock,
	updateBlock,
	deleteBlock,
	useArchitect,
} satisfies ToolSet;

/**
 * Implementation of confirmation-required tools (Empty for now)
 */
export const executions = {};
