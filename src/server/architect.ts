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

    // Step 1: Research/Brainstorming with AI
    const decomposition = await step.do("decompose-goal", async () => {
      const response = await this.env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: [
            {
              role: "system",
              content:
                "You are the 'Architect'. Break down a vague goal into 3-5 concrete, actionable tasks that will be scheduled sequentially. Return JSON: { tasks: [{ title: string, description: string, durationMinutes: number, priority: 'high'|'medium'|'low' }] }",
            },
            { role: "user", content: goal },
          ],
          response_format: { type: "json_object" },
        },
      );
      return JSON.parse(response.response).tasks;
    });

    // Step 2: Push to Durable Object Timeline
    await step.do("push-to-timeline", async () => {
      const doId = this.env.chat.idFromName(userId);
      const doStub = this.env.chat.get(doId);

      // Call the method on the DO to receive workflow results
      await (doStub as any).addTasksFromWorkflow(decomposition);
    });

    return { status: "completed", taskCount: decomposition.length };
  }
}
