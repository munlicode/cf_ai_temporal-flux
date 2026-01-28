# Temporal Flux: Cloudflare Fast Track Submission

**Temporal Flux** is an AI-native execution engine that turns vague intents into concrete, actionable timelines. It replaces the traditional "Backlog" with a single, unified reality: **The Execution Timeline**.

## 🚀 The Philosophy: Execution over Strategy

Most systems fail because the "Strategy" (what to do) never meets the "Execution" (when to do it). Flux bridges this gap by merging them. Every goal is immediately decomposed and scheduled.

## 🛠️ Cloudflare Native Stack

### 1. LLM: Workers AI

- **Model**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- **Function**: Perceptive intent analysis and deterministic task scheduling.

### 2. Coordination: Cloudflare Workflows

- **The Architect**: A multi-step background workflow that brainstorms, estimates, and auto-schedules project plans. It ensures complex goals are broken down without blocking the user interface.

### 3. State Engine: Durable Objects + SQLite

- **Transactionality**: All timeline state lives in a Durable Object, leveraging its transactional SQLite storage for 100% consistency.
- **Real-time Sync**: Uses WebSockets to sync state changes to the UI within milliseconds.

### 4. Human Enablement: Web Speech API

- **Voice-to-Execution**: Integrated voice input allows users to "speak" tasks directly into existence, reducing friction to near zero.

## 🏗️ Technical Highlights

- **JSON Self-Healing**: The Architect workflow includes logic to detect and repair truncated JSON responses from the LLM, ensuring reliability at the edge.
- **Event Sourcing**: Every state mutation is logged as an immutable event, enabling full audit trails and "Time Travel" capabilities.

## 🏁 Quality Checklist

- [x] **YAGNI**: No unused components or dead code.
- [x] **Premium UI**: OKLCH color palette with high-contrast, modern aesthetics.
- [x] **Strict Types**: Shared TypeScript interfaces between Worker and Front-end.
