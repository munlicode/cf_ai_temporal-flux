import { z } from "zod";

export interface Env {
	AI: any;
	chat: any;
}

const envSchema = z.object({
	AI: z.any(),
	chat: z.any(),
});

export function validateEnv(env: any): Env {
	return envSchema.parse(env) as unknown as Env;
}
