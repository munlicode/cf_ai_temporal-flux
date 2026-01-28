import { z } from "zod";

export interface Env {
  AI: any;
  chat: any;
  ARCHITECT: any;
  LOG_LEVEL?: "debug" | "info" | "warn" | "error";
}

const envSchema = z.object({
  AI: z.any(),
  chat: z.any(),
  ARCHITECT: z.any(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
});

export const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
export type LogLevel = keyof typeof LOG_LEVELS;

export interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export function createLogger(envLevel: string | undefined): Logger {
  const current = (envLevel as LogLevel) || "info";
  const currentVal = LOG_LEVELS[current];

  return {
    debug: (...args) =>
      LOG_LEVELS.debug >= currentVal && console.debug(...args),
    info: (...args) => LOG_LEVELS.info >= currentVal && console.info(...args),
    warn: (...args) => LOG_LEVELS.warn >= currentVal && console.warn(...args),
    error: (...args) =>
      LOG_LEVELS.error >= currentVal && console.error(...args),
  };
}

export function validateEnv(env: any): Env {
  return envSchema.parse(env) as unknown as Env;
}
