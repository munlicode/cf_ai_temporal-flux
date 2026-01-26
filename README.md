# Flux (`cf-ai-temporal-flux`)

**Adaptive Flow Control for Your Life.**

Traditional calendars are static storage bins. **Flux** is a dynamic engine that treats your schedule as a fluid stream. It uses AI to handle the chaos of daily life—oversleeping, unexpected delays, or energy dips—by instantly re-flowing your plans based on your natural language input.

## ⚡ Core Concept: Backlog to Stream

- **Backlog:** Unassigned tasks and goals (Strategy).
- **Stream:** A continuous vertical timeline of the next 48 hours (Execution).
- **Mechanism:** The AI agent pulls from the Backlog into the Stream based on context and priority. Don't drag blocks; just tell Flux what changed.

## 🛠️ Stack

- **Edge Backend:** Cloudflare Workers + Hono.
- **State:** Cloudflare Durable Objects (Real-time sync + Event Sourcing).
- **AI:** Workers AI (`llama-3-8b-instruct`).
- **Frontend:** React + shadcn/ui + TailwindCSS.

## ⚙️ Quick Start

```bash
# 1. Setup
pnpm install
npx wrangler login # Required for Workers AI local development

# 2. Develop
pnpm dev

# 3. Deploy
pnpm run deploy
```

## 🤖 AI Assisted

This project is built with AI assistance. Significant prompts and logic generations are documented in [PROMPTS.md](./PROMPTS.md).

---

_Built for the Cloudflare AI Challenge and idea prototyping._
