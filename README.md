# Forge

Forge is a product-thinking copilot that helps builders ask the questions they forget to ask themselves, sharpen their product thinking, and make better-informed decisions before they build.

It does not jump straight from an idea to a feature list or generated app. Forge first separates evidence from assumptions, surfaces important unknowns, forces an explicit product-category decision, and only then produces a specification and prototype.

## The Problem

A lot of products start as a mix of:

- notes
- customer conversations
- feature requests
- assumptions
- constraints
- half-formed ideas

The dangerous move is turning that ambiguity into implementation too quickly. A polished build can still be the wrong product.

Forge is designed to improve the quality of the decisions that happen before implementation.

## How It Works

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

## Current Architecture

Forge currently uses React, Vite, TypeScript, Tailwind CSS, and React Context.

```text
React UI
   │
   ▼
Forge Context
   │
   ├──────────────► deterministic state machine
   │                 idle → brief → position → spec → prototype
   │
   └──────────────► AI reasoning provider
                     │
                     └── Ollama (local, zero-cost development)
```

### Core modules

- `src/lib/engine.ts` — deterministic workflow, gates, fallback reasoning, and spec generation
- `src/ai/provider.ts` — model-provider contract
- `src/ai/ollama.ts` — local Ollama JSON provider
- `src/ai/forge.ts` — structured product-reasoning prompt and normalization
- `src/lib/prototype.ts` — interactive prototype generator
- `src/types.ts` — shared application types
- `src/store/ForgeContext.tsx` — application state and conversation flow

## Engineering Principles

### Product thinking before implementation

Forge should behave like a demanding product-thinking partner, not an agreeable feature generator. It should expose missing evidence, challenge assumptions, and force meaningful tradeoffs.

### Evidence is different from inference

The model is instructed not to invent customer evidence. Missing information should stay missing and become an explicit question or assumption.

### The state machine owns the workflow

The model does not decide whether Forge can skip from an idea to a spec. The deterministic application state machine controls the gates; the model supplies structured reasoning inside those gates.

### Graceful local fallback

If Ollama is unavailable, Forge falls back to the deterministic engine instead of breaking the product flow. This keeps development and the existing demo usable while AI functionality is expanded.

## Running Locally

Install dependencies:

```bash
npm install
```

Install Ollama, then pull the default open-source model:

```bash
ollama pull qwen3:8b
```

Start Ollama, then run Forge:

```bash
npm run dev
```

Vite proxies `/ollama` to `http://127.0.0.1:11434`, so local development does not require a paid model API or browser CORS configuration.

To use another Ollama model, copy `.env.example` to `.env` and change:

```bash
VITE_OLLAMA_MODEL=qwen3:8b
```

## Tech Stack

- React 19
- Vite 7
- TypeScript 5.9
- Tailwind CSS 4
- React Context
- Ollama for local open-source model inference

## Status

Forge is moving from a deterministic product demo into a real reasoning system incrementally. The current implementation keeps the existing workflow intact while replacing simulated product analysis with structured model output first.
