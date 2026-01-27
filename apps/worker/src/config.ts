import { z } from "zod";

export interface Env {
  OPENAI_API_KEY: string;
  AI: any;
  Chat: any;
}

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  AI: z.any(),
  Chat: z.any(),
});

export function validateEnv(env: any): Env {
  return envSchema.parse(env) as unknown as Env;
}
