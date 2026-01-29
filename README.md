# Flux

**Build a step-by-step roadmap from any idea.**

[**Live Demo → flux.kreoza.com**](https://flux.kreoza.com)
---

<details>
<summary>🎬 <b>Bonus: View the "Penguin's Path" Mission Video</b></summary>
<br>

[![Cloudflare Penguin: A Journey Through Time](https://img.youtube.com/vi/DUWftlenTGc/maxresdefault.jpg)](https://www.youtube.com/watch?v=DUWftlenTGc)

> *This video is a creative bonus to the assignment.* 🐧
> 
> [!TIP] Click the image above to watch. (Cmd/Ctrl + Click to open in a new tab).*
</details>

---
### 🚀 What you can do

Flux understands natural language. You can talk to it like a project manager or a coworker.

#### 1. Architect a Goal

Break down a vague intent into a concrete sequence of tasks.

- `I want to learn German`
- `I want to launch a SaaS landing page using Cloudflare`
- `I want to build a fitness routine for the next 30 days`

#### 2. Dynamic Scheduling

Add or modify tasks directly on your timeline.

- `Schedule workout tomorrow at 8am`
- `Remind me to buy milk at 6pm`
- `Change my 3pm meeting to be high priority`
- `Delete the task about German grammar`

#### 3. Contextual Plans

Manage multiple separate timelines for different parts of your life.

- `Create a new plan for my Summer Vacation`
- `Switch to my 'Project Alpha' plan`
- `List all my active plans`

---

## 🌱 Why

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
- **Browser Support**: This feature leverages the `Web Speech API`, which is natively supported in **Google Chrome**, **Microsoft Edge**, and **Safari**. (Note: The microphone icon will only be visible in supported browsers).

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

# 3. Environment Variables
# Copy the example and adjust if needed
cp .dev.vars.example .dev.vars

# 4. Deploy (Production)
pnpm run deploy
```

### Environment Variables

| Variable    | Description                                               | Default  |
| :---------- | :-------------------------------------------------------- | :------- |
| `LOG_LEVEL` | Set the logging level (`debug`, `info`, `warn`, `error`). | `"info"` |

For production, you can set variables via the Cloudflare Dashboard.

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
- I thank my family ヾ( ˃ᴗ˂ )◞ • *✰
- Thank me 	(˵ ͡° ͜ʖ ͡°˵)
---

_Built for the Cloudflare AI Challenge and high-speed project prototyping._
