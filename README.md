# Flux

**Build a step-by-step roadmap from any idea.**

Flux is an AI-powered app that breaks down an idea into an actionable plan showing step-by-step action. You can use it just by sending a message like `I want to learn German`.
You can try any of these example prompts just to start.

- `I want to learn English`
- `I want to start reading 20 books this year`
- `I want to start running 5 times a week`
- `I want to create a website where I can post blogs about how I help animals and show my journeys in jungles`
- `I want to start learning to play guitar`

Good luck!

## Why

I had an idea for an app that would assist with my daily life—reminding me of promises, adjusting for me, and helping me be a better version of myself. I've focused this assignment on the part of that vision that is most clear: turning vague goals into concrete execution plans.

## 🛠️ Stack

- **Edge Backend:** Cloudflare Workers + Hono.
- **State:** Cloudflare Durable Objects (Real-time sync + Event Sourcing).
- **AI:** Workers AI (`llama-3.3-70b-instruct-fp8-fast`).
- **Frontend:** React + shadcn/ui + TailwindCSS.

## ⚙️ Quick Start

```bash
# 1. Setup
pnpm install
npx wrangler login

# 2. Develop
pnpm dev

# 3. Deploy
pnpm run deploy
```

## 🤖 AI Assisted

This project is built with AI assistance. Significant prompts and logic generations are documented in [PROMPTS.md](./PROMPTS.md).

## Gratitude

- Thank you for reading this far.
- I thank Cloudflare for offering intern opportunity.
- I thank life for everything.

---

_Built for the Cloudflare AI Challenge and idea prototyping._
