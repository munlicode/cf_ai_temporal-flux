# Suggestion: Proactive Plan Segregation & Automated Architecture

**Description:**
The agent should proactively detect when a user's request represents a fundamentally new or distinct goal (e.g., switching from "Learning German" to "Earning $10") and handle the entire setup process automatically.

**The Problem:**
Currently, if the agent isn't explicitly told to "Create a new plan," it might attempt to append unrelated tasks to the currently active timeline. This leads to "Context Pollution," where a language learning roadmap gets cluttered with financial tasks, breaking the focus and visibility of the Unified Timeline.

**Proposed Improvement:**
Implement a **"New Goal Detection"** logic that triggers a multi-step setup:

1.  **Contextual Analysis**: Detect if the intent belongs to the active plan or a new domain.
2.  **Automated Segregation**: If it's a new domain, the agent should:
    - Initialize a new plan via `createPlan`.
    - **Immediately** trigger the `useArchitect` workflow for that goal.
3.  **User Notification**: Verbally acknowledge the shift (e.g., _"I see you're starting a new goal for earning money! I've created a dedicated 'Financial' plan and I'm breaking that down for you now..."_).

**Desired Outcome:**
The user can throw arbitrary goals at the Architect without worrying about organization. The system handles the cognitive load of segregating "Language" from "Money" from "Project X," ensuring every distinct pursuit has its own clean, architected timeline.
