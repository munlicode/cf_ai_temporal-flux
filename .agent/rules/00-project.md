---
trigger: always_on
---

# Project Context: cf_ai_temporal-flux

## 1. The Mission & Philosophy

You are working on engine designed to replace rigid calendars with a fluid, antifragile system.

- **Core Philosophy:** Traditional calendars are "Storage Bins" for dates. Flux is a "Flow Control System." We acknowledge that while humans plan in months (Strategy), we live in hours (Execution).
- **The "Why":** To build an "External Prefrontal Cortex" that handles the chaos of daily life (oversleeping, unexpected bugs, energy dips) by dynamically re-flowing the schedule via AI, rather than breaking it.

## 2. Architecture: "The Backlog-to-Stream Engine"

We are NOT building a grid calendar. We are building a "Tactical Command Center" with two distinct zones:

1.  **The Strategy Zone (Backlog):** A list of unassigned projects and tasks. It is NOT time-based.
2.  **The Execution Zone (Stream):** A continuous vertical timeline (Now -> Next 48 Hours).

- **The Mechanism:** The AI Agent pulls items from the _Backlog_ and slots them into the _Stream_ based on context, priority, and constraints.

## 3. The Tech Stack (Cloudflare Native)

We are strictly adhering to the Cloudflare "Fast Track" requirements.

- **Repo Name:** `cf_ai_temporal-flux`
- **Backend:** Cloudflare Workers (using **Hono** framework).
- **State Management:** **Cloudflare Durable Objects** (DO). This is the "Source of Truth" for the schedule. It handles real-time syncing via WebSockets.
- **AI:** **Workers AI** (running `@cf/meta/llama-3-8b-instruct`). The AI analyzes natural language intent and outputs JSON mutation commands.
- **Frontend:** React (Vite) + TypeScript + **shadcn/ui** + TailwindCSS. Deployed on **Cloudflare Pages**.
- **Database:** We use the Durable Object's transactional storage (SQLite-in-DO or Key-Value) to store the Event Log.

## 4. Data Structure: Event Sourcing

We do not overwrite state. We append events to allow for "Time Travel/Undo."

- **State Object:**
  ```typescript
  interface FluxState {
    backlog: TaskItem[]; // Items waiting to be played
    stream: StreamBlock[]; // Items scheduled in time
    events: EventLog[]; // History of mutations
  }
  ```
- **Event Pattern:**
  When a user says "I'm late", we do NOT just change the time. We record:
  `{ type: "SHIFT_TIMELINE", deltaMinutes: 60, reason: "User overslept", timestamp: ... }`

## 5. Coding Standards & "Fast Track" Rules

1.  **Prefix Rule:** All major infrastructure naming should respect the `cf_ai_` convention where applicable.
2.  **Transparency:** We must maintain a `PROMPTS.md` file. If you (the AI) generate a significant chunk of logic, remind me to log the prompt used.
3.  **Type Safety:** Strict TypeScript everywhere. Shared types between Worker and Frontend.
4.  **Performance:** "Internet Scale" thinking. Minimize round-trips. Use the Edge effectively.
