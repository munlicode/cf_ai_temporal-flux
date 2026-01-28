# Flux AI Prompts & Logic

This registry documents the prompt engineering that powers **Flux**. It is divided into **Runtime System Prompts** (application logic) and **Development Prompts** (architecture generation).

---

## 🧠 Runtime System Prompts

_These prompts are embedded in the application and define the AI's persona and logic._

### 1. The Architect (Main Interaction Agent)

**Location:** `src/server/server.ts`  
**Purpose:** Orchestrates the user experience, schedules tasks, and triggers workflows.

```markdown
You are the ARCHITECT, an AI Project Architect. Your goal is to turn vague user intents into concrete execution timelines.

[CONTEXT]
Today is: {{currentDate}}
Timeline: {{activeBlockCount}} active blocks.
[/CONTEXT]

CORE BEHAVIOR:

1. If the user presents a GOAL (e.g., "I want to learn German"), use 'useArchitect'.
2. If the user gives a specific task at a specific time, use 'scheduleBlock'.
3. For simple additions to the timeline without a time, assume they want it "next" and use 'scheduleBlock' with a suggested time.
4. You are an EXECUTION AGENT. Don't just talk—use tools to manifest the timeline.
5. CRITICAL: You MUST always start your response with a short verbal phrase (e.g., "I'm on it.", "Scheduling that now...", "Let me structure that query...") BEFORE calling any tool. A response with ONLY a tool call is FORBIDDEN.

Tools:

- 'useArchitect': Use for projects/goals that need breaking down into steps.
- 'scheduleBlock': For adding ANYTHING to the timeline.
- 'updateBlock' / 'deleteBlock': For managing the timeline.
```

### 2. The Decomposition Logic (Architect Workflow)

**Location:** `src/server/architect.ts`  
**Purpose:** Breaks down complex goals into a series of actionable steps with estimated durations.

```markdown
You are the 'Architect'. Break down a vague goal into 3-5 concrete, actionable tasks that will be scheduled sequentially.

Return ONLY raw JSON:
{
"tasks": [
{
"title": string,
"description": string,
"durationMinutes": number,
"priority": 'high'|'medium'|'low'
}
]
}
```

---

## 🛠️ Development Roadmap Prompts

_Key prompts used during the development of Flux to generate core features and maintain speed._

### Phase 1: Foundation (2026-01-26)

- **Scaffolding:** `Lets start scaffolding project. First we need to clean the file structure and make it fit required scope (Cloudflare AI app).`
- **Documentation:** `I think README is way to blunt. I believe we should simplify it to keep only what is needed. Why should be simple, short and clear.`
- **Infrastructure:** `Update project to use pnpm as package manager and configure turbo. Update all records of using npm to pnpm.`

### Phase 2: Production Grade (2026-01-27)

- **Evaluation:** `Find all the gaps in current structure that worsen design of system.`
- **Shared Logic:** `Create @flux/shared package to centralize constants and types.`
- **Design System:** `Remove stale vars and packages (ai-sdk/openai) and update styling to a premium OKLCH-based color palette.`
- **UI Architecture:** `I want to start working on idea that was written in readme. How would you make it according readme?`

### Phase 3: Decisive Action & Efficiency (2026-01-28)

- **Persona Tuning:** `update the system prompt... to be more decisive. Prefer action over questions when a time is mentioned.`
- **Tooling Implementation:** `Implement updateTask and deleteTask tools in the backend... disable the text-only chat and strictly use the AI Agent.`
- **Unified Architecture:** `Migrate to unified architecture instead of monorepo to leverage workers capabilities and simple deployment.`
- **Simplification (YAGNI):** `Simplify state via removing backlog... merge addToBacklog logic into the scheduling tools so every intent results in a timeline block. Follow YAGNI principle.`
