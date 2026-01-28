import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import type { Env } from "./config";

export class ArchitectWorkflow extends WorkflowEntrypoint<Env> {
  async run(
    event: WorkflowEvent<{ goal: string; userId: string }>,
    step: WorkflowStep,
  ) {
    const { goal, userId } = event.payload;

    if (!goal || !userId) {
      return { status: "failed", reason: "Missing parameters" };
    }
    console.log(`[Architect] Starting workflow`);

    // Step 1: Research/Brainstorming with AI
    const decomposition = await step
      .do("decompose-goal", async () => {
        console.log(`[Architect] Running AI decomposition...`);
        try {
          return await this.env.AI.run("@cf/meta/llama-3-8b-instruct", {
            messages: [
              {
                role: "system",
                content:
                  'You are the \'Architect\'. Break down a vague goal into 3-5 concrete, actionable tasks that will be scheduled sequentially. Return ONLY raw JSON: { "tasks": [{ "title": string, "description": string, "durationMinutes": number, "priority": \'high\'|\'medium\'|\'low\' }] }',
              },
              { role: "user", content: goal },
            ],
          });
        } catch (error: any) {
          console.error(`[Architect] AI.run failed:`, error);
          throw new Error(`AI.run failed: ${error.message || error}`);
        }
      })
      .then((response: any) => {
        const text = response.response;
        console.log(`[Architect] Received AI response (${text.length} chars)`);

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

          console.log(
            `[Architect] Successfully decomposed into ${tasks.length} tasks`,
          );
          return tasks;
        } catch (e) {
          console.error(`[Architect] Parsing failed:`, e);
          throw new Error(
            `JSON Parsing Failed: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      });

    // Step 2: Push to Durable Object Timeline
    await step.do("push-to-timeline", async () => {
      console.log(`[Architect] Pushing ${decomposition.length} tasks to DO...`);
      const doId = this.env.chat.idFromString(userId);
      const doStub = this.env.chat.get(doId);

      // Call the method on the DO to receive workflow results
      await (doStub as any).addTasksFromWorkflow(decomposition);
      console.log(`[Architect] Workflow complete!`);
    });

    return { status: "completed", taskCount: decomposition.length };
  }
}
