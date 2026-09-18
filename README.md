# Forge

Forge is a guided pre-build product copilot.

Its job is simple: help a builder turn a messy idea into a defensible product direction and a focused build brief **before** they start building.

Forge is not a general PM chatbot, a PRD generator, or an AI app builder. Chat is a supporting correction surface. The primary product is a short guided workflow that progressively turns ambiguity into a decision.

## Product promise

> When you have a rough product idea, Forge helps you decide what is worth building and turns that decision into a build-ready brief without making you pretend every assumption is proven.

## Core user

Solo builders and early-stage product people working on 0→1 products, especially when AI coding tools make it easy to start implementation before the product decision is clear.

## Primary workflow

```text
Home
  ↓
Frame
  ↓
Challenge
  ↓
Decide
  ↓
Build Brief
  ↓
Handoff
```

### Frame

Forge synthesizes the user's rough input into:

- primary user
- problem / opportunity
- current workaround
- desired outcome
- explicit assumptions

The user corrects the frame only when needed.

### Challenge

Forge surfaces the small number of assumptions or open decisions that could materially change what gets built.

Unknown is a valid state. The user can leave something unresolved and continue.

### Decide

Forge generates three materially different product directions and recommends one. The user chooses the direction.

### Build Brief

Forge creates a concise handoff containing:

- chosen direction
- focused V1
- must-have requirements
- explicit non-goals
- acceptance criteria
- important failure modes
- validation work
- success signals
- unresolved questions

### Handoff

The user copies either the full build brief or a compact builder prompt for the implementation tool of their choice.

## Product principles

### One screen, one primary task

Every stage should answer:

- Where am I?
- What do I need to do?
- Why does it matter?
- What happens next?

Forge uses progressive disclosure rather than exposing its full internal product model on every screen.

### The model is internal memory

Forge maintains a structured Product Model containing:

- user
- opportunity
- workaround
- desired outcome
- evidence
- assumptions
- decisions
- validation tasks

Users should benefit from that structure without having to manage it directly.

### Evidence is not assumption

Forge must not invent customer evidence, market facts, frequency, willingness to pay, or numeric certainty. Unknown information remains unknown.

### Corrections invalidate stale outputs

If a correction materially changes the product frame, downstream directions and build briefs are cleared rather than silently becoming inconsistent.

### AI should interpret, not own deterministic state

Application state such as the current project stage, selected direction, project title, and completion state is owned by the client. AI is used for synthesis, comparison, critique, and structured product reasoning.

## Architecture

```text
React / Vite / TypeScript
        │
        ▼
Forge Context
explicit project stage + persisted product state
        │
        ▼
POST /api/forge/turn
        │
        ▼
Cloudflare Worker
server-side product reasoning prompt
        │
        ▼
Groq hosted model
```

### Core modules

- `src/store/ForgeContext.tsx` — project persistence, explicit workflow state, AI actions
- `src/components/flow/` — focused workflow screens
- `src/components/workspace/CopilotPanel.tsx` — optional correction / challenge drawer
- `src/ai/remote.ts` — compact browser-to-Worker reasoning requests and transient retries
- `src/ai/forge.ts` — normalization of structured model output
- `worker/index.ts` — server-side reasoning contract and strict structured outputs
- `src/lib/format.ts` — build brief and builder-prompt formatting

## Persistence and re-entry

Projects are currently saved in browser localStorage.

A fresh visit always opens Forge Home. Saved projects remain in the sidebar and only reopen when the user explicitly selects one.

Each saved project persists its current workflow stage, so reopening a project restores meaningful progress instead of reconstructing it from UI history.

## AI modes

Forge deliberately has only three reasoning modes:

1. **chat** — update / challenge the working product frame
2. **directions** — compare three product directions
3. **lock-thesis** — turn the chosen direction into the Build Brief

This keeps model usage aligned with the product journey and avoids unnecessary calls.

## Local development

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

The Vite dev server proxies `/api` to a Worker running at `http://127.0.0.1:8787`.

For full local API testing, run the Cloudflare Worker dev process separately and configure `GROQ_API_KEY` as a Worker secret. Never expose the key through a `VITE_` variable.

## Production

Forge is deployed with Cloudflare Workers + Static Assets.

- Worker name: `forge`
- Production branch: `main`
- API route: `/api/forge/turn`
- Hosted model: configured by `GROQ_MODEL`
- Secret: `GROQ_API_KEY`

## Definition of done

A first-time user should be able to open Forge, describe a rough idea, understand each step without explanation from the founder, make a product decision, and leave with a build-ready brief.

If the workflow needs another dashboard, another persistent panel, or another explanation of how Forge itself works, simplify before adding features.
