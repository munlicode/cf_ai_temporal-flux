/**
 * Shared constants for human-in-the-loop confirmations
 */
export const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied.",
} as const;

export type ApprovalStatus = (typeof APPROVAL)[keyof typeof APPROVAL];

/**
 * Core Flux Data Structures
 */

export interface StreamBlock {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  priority: "high" | "medium" | "low";
  tags: string[];
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: "pending" | "completed" | "cancelled";
}

export type EventType =
  | "BLOCK_SCHEDULED"
  | "BLOCK_UPDATED"
  | "BLOCK_DELETED"
  | "TIMELINE_SHIFTED";

export interface EventLog {
  id: string;
  type: EventType;
  payload: any;
  timestamp: string; // ISO string
  reason?: string;
}

export interface FluxState {
  stream: StreamBlock[];
  events: EventLog[];
}

export * from "./utils";
export * from "./tools";
