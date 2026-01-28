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
          console.error(`[Architect] AI.run failed:`, error);
          throw new Error(`AI.run failed: ${error.message || error}`);
        }
      })
      .then((response: any) => {
        const text = response.response;
        logger.debug(`[Architect] AI response received (${text.length} chars)`);

        try {
          const startIndex = text.indexOf("{");
          if (startIndex === -1) throw new Error("No JSON object found");

          const jsonStr = text.substring(startIndex);

          // Healing truncated JSON (Production Guard)
          const stack: string[] = [];
          let healed = "";
          let inString = false;
          for (let i = 0; i < jsonStr.length; i++) {
            const char = jsonStr[i];
            if (char === '"' && jsonStr[i - 1] !== "\\") inString = !inString;
            if (!inString) {
              if (char === "{") stack.push("}");
              if (char === "[") stack.push("]");
              if (char === "}" || char === "]") stack.pop();
            }
            healed += char;
          }

          if (stack.length > 0) {
            console.warn(`[Architect] Healing truncated JSON...`);
            healed = healed.trim();
            if (healed.endsWith(",")) healed = healed.slice(0, -1);
            if (inString) healed += '"';
            healed += stack.reverse().join("");
          }

          const parsed = JSON.parse(healed);
          const tasks = parsed.tasks || (Array.isArray(parsed) ? parsed : null);

          if (!tasks || !Array.isArray(tasks)) {
            throw new Error("Could not find tasks array in AI response");
          }

          logger.info(`[Architect] Decomposed into ${tasks.length} tasks`);
          return tasks;
        } catch (e) {
          console.error(`[Architect] Parsing failed:`, e);
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
