# AI Prompts & Logic Generations

This file logs significant AI prompts used to generate core logic, architecture, or documentation for **Flux** (`cf-ai-temporal-flux`).

## 📅 2026-01-26

### Project Scaffolding

**Context:** Scaffolding the initial root README.md to establish project identity and mission.
**Prompt:** `Lets start scaffolding project. First we need to clean the file structure and make it fit required scope(Cloudflare AI app )`
**Outcome:** Generated a clear file structure for the project.

### Documentation Refinement

**Context:** Simplifying the README.md to be more concise and focused.
**Prompt:** `I think README is way to blunt. I believe we should simplify it to keep only what is needed. Why should be simple, short and clear.`
**Outcome:** Condensed the README to its essential components, focusing on the core value proposition and minimalist stack/setup details.

### Infrastructure Migration

**Context:** Migrating from npm to pnpm and configuring Turborepo for better monorepo management.
**Prompt:** `Update project to use pnpm as package manager and configure tubro . Update all records of using npm to pnpm`
**Outcome:** Successfully migrated to `pnpm`, created `pnpm-workspace.yaml`, configured `turbo.json`, and updated all documentation and scripts.

## 📅 2026-01-27

### Production Grade Evaluation

**Context:** Evaluating the existing monorepo structure for production readiness, identifying gaps in type safety, shared logic, and reliability.
**Prompt:** `Find all the gaps in current structure that worsen design of system`
**Outcome:** Identified critical gaps in shared logic (duplicated constants), type safety (use of `any`), and lack of automated testing. Created a multi-phase implementation plan starting with a shared package foundation.

### Implementing Shared Foundation

**Context:** Following up on the production grade roadmap to improve architectural integrity.
**Prompt:** `lets do those.`
**Outcome:** Created `@flux/shared` package to centralize constants and types. Migrated `APPROVAL` constants and defined core domain interfaces (`TaskItem`, `StreamBlock`, `FluxState`) for single-source-of-truth across the monorepo.

### Refining UI & Cleaning Stale Dependencies

**Context:** The app had broken styling, a mobile-only fixed layout that didn't scale, and the backend was crashing due to a mandatory but missing `OPENAI_API_KEY`.
**Prompt:** `Remove stale vars and packges(ai-sdk/openai) and update styling`
**Outcome:** Removed unused `@ai-sdk/openai` package and mandatory `OPENAI_API_KEY` requirement from the worker. Revamped the design system with a premium OKLCH-based color palette, vibrant orange accents, a wider desktop layout (max-w-5xl), and improved contrast/responsive elements. Added custom scrollbars and rounded UI elements for a modern feel.

### Flux UI Implementation: Backlog & Stream

**Context:** Transforming the application from a simple chat interface into the "Tactical Command Center" envisioned in the README.
**Prompt:** `I want to start working on idea that was written in readme. How would you make it according readme?`
**Outcome:** Implemented the core 3-column layout:

1. **Backlog (Left):** View for unassigned tasks.
2. **Stream (Center):** Vertical 48-hour timeline.
3. **Copilot (Right):** Existing AI chat interface.
   Connected the frontend components to the backend `FluxState` using `onStateUpdate` synchronization, allowing real-time updates from the Durable Object to the UI.

### System Personality Tuning

**Context:** The AI agent was too passive, often asking clarifying questions (e.g., "Do you want to schedule this?") even when the user provided clear time constraints. This friction slowed down the "Flow Control" experience.

**Prompt:** `update the system prompt in @apps/worker/src/server.ts to be more decisive. Prefer action over questions when a time is mentioned.`

**Outcome:** Updated the system prompt in `apps/worker/src/server.ts` to instruct the model to be "decisive" and "prefer action". Explicitly added rules to:

1. IMMEDIATELY schedule tasks if a time is mentioned without asking for confirmation.
2. Only ask clarifying questions if the request is ambiguous AND has no time component.
3. Updated the model to `llama-3.1-8b-instruct` for potentially better instruction following.

### Update & Delete Tools Implementation

**Prompt:** `Implement `updateTask`and`deleteTask` tools in the backend (@apps/worker/src/tools.ts) to allow modifying and removing items from the Backlog and Stream. Then, disable the text-only chat and strictly use the AI Agent to perform these actions via natural language (e.g., "Delete the milk task" or "Rename that task to 'Gym'"). Finally, wire up the existing UI buttons (Plus icon, etc.) to trigger these same tools manually.`

**Outcome:**

1. Implemented `updateTask` and `deleteTask` in `apps/worker/src/tools.ts`, enabling modification and deletion of tasks via the Agent.
2. Modified `App.tsx`, `BacklogView.tsx`, and `StreamView.tsx` to wire up UI delete buttons. These buttons now send natural language commands (e.g., "Delete task 123") to the Agent, maintaining the "One Brain" architecture where all state changes go through the LLM.
3. Updated the system prompt in `server.ts` to enforce a "Headless Agent" persona that acts immediately on tools.

### Feature: Voice Input Integration

**Prompt:** `Prioritize adding Voice Input functionality to the web app (`apps/web`). Create a `VoiceInput`component that uses the browser's Web Speech API for speech-to-text. It should have a microphone icon that indicates listening state. Integrate this into the main`App.tsx` chat interface so that spoken words are appended to the user's message input. Ensure the layout is clean (icon inside the input container) and handle any TypeScript issues related to the Speech API. Don't worry about database optimization right now; focus on this "Human Enablement" feature.`

**Context:** The user wants to enhance the "Human Enablement" aspect of the Flux engine by reducing friction. Typing commands is slower than speaking them. This features allows for quicker capturing of thoughts into the system.

**Outcome:**

1. Created `apps/web/src/components/voice-input/VoiceInput.tsx` using the `webkitSpeechRecognition` API.
2. Integrated `VoiceInput` into `App.tsx`, placing the microphone icon to the left of the text input area.
3. Implemented logic to append transcribed text to the existing input and auto-resize the textarea.
4. Resolved TypeScript errors regarding the missing `SpeechRecognition` types on the `window` object.
5. Cleaned up duplicate imports and component structure in `App.tsx`.
