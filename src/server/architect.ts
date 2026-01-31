import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { type Env, createLogger } from "./config";
import { PROMPTS } from "@shared";

export class ArchitectWorkflow extends WorkflowEntrypoint<Env> {
  async run(
    event: WorkflowEvent<{ goal: string; userId: string }>,
    step: WorkflowStep,
  ) {
    const { goal, userId } = event.payload;
    const logger = createLogger(this.env.LOG_LEVEL);

    if (!goal || !userId) {
      return { status: "failed", reason: "Missing parameters" };
    }
    logger.info(
      `[Architect] Starting workflow for goal: ${goal.slice(0, 50)}...`,
    );
    const doId = this.env.chat.idFromString(userId);
    const doStub = this.env.chat.get(doId);

    // Helper to report progress
    const reportProgress = async (
      progress: number,
      message: string,
      forceNewId = false,
    ) => {
      await (doStub as any).setWorkflowStatus({
        status: "running",
        progress,
        message,
        ...(forceNewId ? { id: crypto.randomUUID() } : {}),
      });
    };

    await reportProgress(10, "Architecting your plan...", true);

    // Step 1: Research/Brainstorming with AI
    const decomposition = await step
      .do("decompose-goal", async () => {
        logger.debug(`[Architect] Running AI decomposition...`);
        try {
          return await this.env.AI.run(
            "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            {
              messages: [
                {
                  role: "system",
                  content: PROMPTS.DECOMPOSITION_LOGIC,
                },
                { role: "user", content: goal },
              ],
            },
          );
        } catch (error: any) {
          logger.error(`[Architect] AI.run failed:`, error);
          throw new Error(`AI.run failed: ${error.message || error}`);
        }
      })
      .then((response: any) => {
        const text = response.response;
        logger.debug(`[Architect] AI response received (${text.length} chars)`);

        try {
          // --- Robust JSON Healer (Production Grade) ---
          const findJson = (str: string) => {
            const first = str.indexOf("{");
            const last = str.lastIndexOf("}");
            if (first === -1) return null;
            return str.slice(
              first,
              last !== -1 && last > first ? last + 1 : undefined,
            );
          };

          const healJson = (str: string) => {
            let json = str.trim();
            const stack: string[] = [];
            let inString = false;
            let escaped = false;
            let lastValidIndex = -1;

            for (let i = 0; i < json.length; i++) {
              const char = json[i];
              if (char === '"' && !escaped) inString = !inString;
              escaped = char === "\\" && !escaped;

              if (!inString) {
                if (char === "{") stack.push("}");
                if (char === "[") stack.push("]");
                if (char === "}" || char === "]") {
                  if (stack[stack.length - 1] === char) stack.pop();
                }
                // Track last comma or bracket to backtrack on truncation
                if (
                  char === "," ||
                  char === "{" ||
                  char === "[" ||
                  char === "}" ||
                  char === "]"
                ) {
                  lastValidIndex = i;
                }
              }
            }

            // If we are mid-string or have open brackets, we likely have truncation
            if (inString || stack.length > 0) {
              logger.warn(`[Architect] Truncation detected. Healing...`);

              // If we're mid-string, close it
              if (inString) json += '"';

              // If we're mid-property (e.g., "key": "val... or "key": 1... or "key")
              // We check if the last char is a colon or a letter/number
              const lastChar = json[json.length - 1];
              const isMidProp = /[:a-zA-Z0-9\s]/.test(lastChar);

              if (isMidProp && lastValidIndex !== -1) {
                // Backtrack to the last clean delimiter to be safe
                json = json.slice(0, lastValidIndex + 1).trim();
                if (json.endsWith(",")) json = json.slice(0, -1);
              }

              // Close the stack
              json += stack.reverse().join("");
            }
            return json;
          };

          const cleanedStr = findJson(text) || text;
          const healed = healJson(cleanedStr);

          const parsed = JSON.parse(healed);
          const tasks = parsed.tasks || (Array.isArray(parsed) ? parsed : null);

          if (!tasks || !Array.isArray(tasks)) {
            throw new Error("Could not find tasks array in AI response");
          }

          logger.info(`[Architect] Decomposed into ${tasks.length} tasks`);
          return tasks;
        } catch (e) {
          logger.error(`[Architect] Parsing failed:`, e);
          throw new Error(
            `JSON Parsing Failed: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      });

    await reportProgress(60, "Structuring your timeline...");

    // Step 2: Push to Durable Object Timeline
    await step.do("push-to-timeline", async () => {
      logger.debug(`[Architect] Pushing tasks to DO...`);
      const doId = this.env.chat.idFromString(userId);
      const doStub = this.env.chat.get(doId);

      // Call the method on the DO to receive workflow results
      await (doStub as any).addTasksFromWorkflow(decomposition);
      logger.info(`[Architect] Workflow complete!`);
    });

    return { status: "completed", taskCount: decomposition.length };
  }
}
