---
trigger: always_on
---

# Project Context: cf_ai_temporal-flux

## 1. The Mission & Philosophy

You are building an **AI-powered assistant** that turns vague goals into concrete, actionable execution plans.

- **Core Philosophy:** Most people fail at their goals because the "Strategy" (what to do) never meets the "Execution" (when to do it). Flux bridges this gap by merging them into a single reality.
- **The "Why":** To provide an **"Execution Engine"** that handles the cognitive load of breaking down complex ideas, allowing the user to focus solely on doing.

## 2. Architecture: "The Unified Timeline"

We use a single **Execution Timeline** model. There is no separate backlog.

1.  **The Execution Timeline:** A continuous vertical sequence of actions (Now -> Future) where every task is committed to time.

- **The Mechanism:** The AI **Architect** triggers a Background Workflow to decompose goals. It then auto-schedules the resulting steps directly into the **Execution Timeline** to create immediate momentum and visibility.

## 3. The Tech Stack (Cloudflare Native)

We strictly adhere to the Cloudflare "Fast Track" requirements.

- **Repo Name:** `cf_ai_temporal-flux`
- **Backend:** Cloudflare Workers (using **Hono** framework).
- **Coordination:** **Cloudflare Workflows**. The "Architect" workflow performs multi-step brainstorming and task creation.
- **State Management:** **Cloudflare Durable Objects** (DO). Stores the "Source of Truth" (Timeline, events) and handles real-time syncing via WebSockets.
- **AI:** **Workers AI** (running `@cf/meta/llama-3.3-70b-instruct-fp8-fast`).
- **Frontend:** React (Vite) + TypeScript + **shadcn/ui** + TailwindCSS. Deployed on **Cloudflare Pages**.

## 4. Data Structure: Event Sourcing

We do not overwrite state. We append events to allow for "Time Travel/Undo."

- **State Object:**
  ```typescript
  interface FluxState {
    stream: StreamBlock[]; // The Execution Timeline
    events: EventLog[]; // History of mutations
  }
  ```

## 5. Coding Standards & "Fast Track" Rules

1.  **The Architect Persona:** The AI agent should always act as a "Project Architect"—less conversation, more tool-driven execution targeting the unified timeline.
2.  **Transparency:** Maintain `PROMPTS.md`.
3.  **Type Safety:** Strict TypeScript everywhere. Shared types between Worker and Frontend.
4.  **Performance:** Minimize cold starts; use the Edge effectively.
