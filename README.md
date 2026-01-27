# Flux

**Adaptive Flow Control for Your Life.**

Traditional calendars are static storage bins. **Flux** is a dynamic engine that treats your schedule as a fluid stream. It uses AI to handle the chaos of daily life—oversleeping, unexpected delays, or energy dips—by instantly re-flowing your plans based on your natural language input.

## Why

I had an idea to create an app that would assist with my daily life. The one that would remind me of what I promised, adjust for me and help to be better me. Therefore, I decided to use this assignment to implement a part of app that was more or clear to me.

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

## P.S.
Some parts of repo might not be clear or designed well. Unfortunately, I was not able to comprehend the idea to the extend where it would be clear to me what is needed and what not. 


## Gratitude

- Thank you for reading this far.
- I thank Cloudflare for offering intern opportunity.
- I thank life for everything.

---

_Built for the Cloudflare AI Challenge and idea prototyping._
