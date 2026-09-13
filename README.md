# Forge

Forge is a product-thinking copilot that helps builders ask the questions they forget to ask themselves, sharpen their product thinking, and make better-informed decisions before they build.

It does not jump straight from an idea to a feature list or generated app. Forge first separates evidence from assumptions, surfaces important unknowns, forces an explicit product-category decision, and only then produces a specification and prototype.

## How it works

```text
Messy source material
        ↓
Evidence + assumptions
        ↓
Questions you have not answered yet
        ↓
Product-category options
        ↓
Locked product decision
        ↓
Structured specification
        ↓
Failure-mode analysis
        ↓
Interactive prototype
```

The category lock is deliberate: Forge will not write the full specification until the builder has made the product decision.

## Architecture

Forge uses React, Vite, TypeScript, Tailwind CSS, and React Context. Model inference is hosted; no model runs on the user's machine.

```text
React/Vite UI
   │
   ▼
Forge Context + deterministic state machine
   │
   ├── fallback local reasoning
   │
   └── POST /api/forge/analyze
              │
              ▼
        Cloudflare Worker
              │
              ▼
       hosted Groq model
```

The browser only sends product source material to Forge's own API. The model key and product-reasoning prompt stay server-side.

### Core modules

- `src/lib/engine.ts` — deterministic workflow, gates, fallback reasoning, and spec generation
- `src/ai/provider.ts` — analysis-provider contract
- `src/ai/remote.ts` — browser client for the Forge API
- `src/ai/forge.ts` — normalization into Forge brief/thesis types
- `worker/index.ts` — server-side AI endpoint
- `src/lib/prototype.ts` — interactive prototype generator
- `src/store/ForgeContext.tsx` — application state and conversation flow

## Engineering principles

### Product thinking before implementation

Forge should behave like a demanding product-thinking partner, not an agreeable feature generator. It should expose missing evidence, challenge assumptions, and force meaningful tradeoffs.

### Evidence is different from inference

The model must not invent customer evidence. Missing information should remain missing and become an explicit question or assumption.

### The state machine owns the workflow

The model does not decide whether Forge can skip from an idea to a spec. The deterministic application state machine controls the gates; the model supplies structured reasoning inside those gates.

### Graceful fallback

If hosted AI is unavailable, Forge falls back to the deterministic engine instead of breaking the product flow.

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

For full local API testing, run a Cloudflare Worker dev process in a second terminal and provide the model key as a local Worker secret. The key must never use a `VITE_` prefix.

## Deployment target

The intended zero-cost beta deployment is Cloudflare Workers + Static Assets. The Worker serves both the built React app and `/api/*`, and the hosted model key is configured as a Worker secret rather than committed to GitHub.

## Status

Forge is moving from a deterministic demo into a real reasoning system incrementally. V0.2 replaces simulated initial product analysis first while preserving the existing workflow and fallback engine.
