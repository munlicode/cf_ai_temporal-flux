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

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  duration?: number; // in minutes
  priority: "high" | "medium" | "low";
  tags: string[];
}

export interface StreamBlock {
  id: string;
  taskId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: "pending" | "completed" | "cancelled";
}

export type EventType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TIMELINE_SHIFTED"
  | "BLOCK_SCHEDULED"
  | "BLOCK_UPDATED";

export interface EventLog {
  id: string;
  type: EventType;
  payload: any;
  timestamp: string; // ISO string
  reason?: string;
}

export interface FluxState {
  backlog: TaskItem[];
  stream: StreamBlock[];
  events: EventLog[];
}
