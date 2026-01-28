import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import type { Env } from "./config";

export class StrategistWorkflow extends WorkflowEntrypoint<Env> {
  async run(
    event: WorkflowEvent<{ goal: string; userId: string }>,
    step: WorkflowStep,
  ) {
    const { goal, userId } = event.payload;

    // Step 1: Research/Brainstorming with AI
    const decomposition = await step.do("decompose-goal", async () => {
      const response = await this.env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: [
            {
              role: "system",
              content:
                "You are the 'Strategist'. Break down a vague goal into 3-5 concrete, actionable tasks. Return JSON: { tasks: [{ title: string, durationMinutes: number, priority: 'high'|'medium'|'low' }] }",
            },
            { role: "user", content: goal },
          ],
          response_format: { type: "json_object" },
        },
      );
      return JSON.parse(response.response).tasks;
    });

    // Step 2: Push to Durable Object Backlog
    await step.do("push-to-backlog", async () => {
      // We would call the Durable Object here.
      // For now, let's assume we have a way to signal the DO.
      const doId = this.env.chat.idFromName(userId);
      const doStub = this.env.chat.get(doId);

      // We need a method on the DO to receive workflow results
      // await doStub.addTasksFromWorkflow(decomposition);
    });

    return { status: "completed", taskCount: decomposition.length };
  }
}
