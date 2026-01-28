# Flux

**Build a step-by-step roadmap from any idea.**

[**Live Demo → flux.kreoza.com**](https://flux.kreoza.com)

Flux is an AI-powered app that breaks down an idea into an actionable plan showing step-by-step action. You can use it just by sending a message like `I want to learn German`.

Try any of these examples to see it in action:

- `I want to learn German`
- `I want to launch a SaaS landing page using Cloudflare`
- `I want to build a fitness routine for the next 30 days`
- `I want to write a technical blog post about Durable Objects`

---

## ❤️ Why

I had an idea for an app that would assist with my daily life—reminding me of promises, adjusting for me, and helping me be a better version of myself. I've focused this assignment on the part of that vision that is most clear: turning vague goals into concrete execution plans.

Most of the time, we want to do something, but we just tell ourselves **'Later'**. As Sigmund Freud said, _'Depression is the silence of emotions that have been told they are not allowed to speak.'_ When we delay our intents, we are essentially silencing a part of ourselves. **Flux is built to break that silence.**

To break it, the first step must be a 'quick start'—a way to turn that quiet intent into a loud commitment. For that, you need a plan that feels inevitable. But a plan alone isn't enough; most people fail because their **'Strategy'** (what to do) never actually meets their **'Execution'** (when to do it). Flux bridges this gap by merging them into a single reality: **The Execution Timeline**.

---

## 🛠️ Cloudflare Native Stack

We strictly adhere to the Cloudflare "Fast Track" requirements, leveraging the edge for maximum performance and consistency.

### 1. LLM: Workers AI

- **Model**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- **Role**: Perceptive intent analysis and deterministic task scheduling.

### 2. Coordination: Cloudflare Workflows

- **The Architect**: A multi-step background workflow that brainstorms, estimates, and auto-schedules project plans. It ensures complex goals are broken down without blocking the user interface.

### 3. State Engine: Durable Objects

- **Consistency**: All timeline state lives in a Durable Object, providing strong transactional consistency across all sessions.
- **Real-time Sync**: Uses WebSockets to sync state changes to the UI within milliseconds.

### 4. Human Enablement: Web Speech API

- **Voice-to-Execution**: Integrated voice input allows users to "speak" tasks directly into existence, reducing friction to near zero.

---

## 🏗️ Technical Highlights

- **JSON Self-Healing**: The Architect workflow includes logic to detect and repair truncated or invalid JSON responses from the LLM, ensuring reliability at the edge.
- **Event Logging**: Every state mutation is logged as an immutable event, enabling full audit trails and providing a foundation for future "Time Travel" / Undo capabilities.
- **AI-Native Workflow**: This project was built using an AI-native development process. Our **System Prompts**, tool definitions, and architectural roadmap are documented in **[PROMPTS.md](./PROMPTS.md)**.

---

## ⚙️ Quick Start

```bash
# 1. Setup
pnpm install
npx wrangler login

# 2. Develop (Local)
pnpm dev

# 3. Deploy (Production)
pnpm run deploy
```

---

## 📝 Quality Checklist (YAGNI)

- [x] **Zero Waste**: No unused components or dead code.
- [x] **Premium UI**: OKLCH color palette with high-contrast, modern aesthetics and smooth transitions.
- [x] **Strict Types**: Shared TypeScript interfaces between Worker and Front-end for end-to-end safety.

---

## ❤️ Gratitude

- Thank you for reading this far.
- I thank Cloudflare for offering intern opportunity.
- I thank life for everything.

---

_Built for the Cloudflare AI Challenge and high-speed project prototyping._
