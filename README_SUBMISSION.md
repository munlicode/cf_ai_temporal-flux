# Temporal Flux: Cloudflare Fast Track Submission

Temporal Flux is an AI-powered "External Prefrontal Cortex" designed to replace rigid calendars with a fluid, antifragile flow control system.

## Cloudflare Native Stack

This project leverages the full power of the Cloudflare developer platform to deliver a high-performance, edge-first AI application.

### 1. LLM: Workers AI

- **Model**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- **Implementation**: Used for natural language intent analysis and goal decomposition.
- **Location**: `src/server/server.ts` and `src/server/workflow.ts`.

### 2. Coordination: Cloudflare Workflows

- **Feature**: "The Strategist".
- **Implementation**: When a user provides a vague goal, a multi-step Workflow is triggered to brainstorm tasks, estimate durations, and push a structured plan back to the state engine.
- **Location**: `src/server/workflow.ts`.

### 3. State & Consistency: Durable Objects

- **Feature**: Realtime sync and event sourcing.
- **Implementation**: The "Source of Truth" for the schedule lives in a Durable Object with transactional SQLite storage. It handles WebSocket connections for zero-latency state updates.
- **Location**: `src/server/server.ts`.

### 4. Frontend: Pages + Vite

- **Implementation**: A React/TypeScript SPA deployed on Cloudflare Pages, integrated with the Hono backend via the `_worker.js` pattern.
- **Location**: `src/client/`.

## Key Features

- **Tactical Command Center**: Distinct Strategy Zone (Backlog) and Execution Zone (Stream).
- **Event Sourcing**: Every state change is an immutable event, allowing for full "Time Travel" and undo capabilities.
- **The Strategist**: Automated project decomposition using AI-orchestrated workflows.

## Development

```bash
pnpm install
pnpm run dev      # Frontend + Hono Worker
pnpm run build    # Unified production build
```
