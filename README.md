# Forge

Forge is a product-engineering copilot for turning rough product ideas into something you can actually build.

Instead of immediately generating a specification, Forge first forces the user to clarify the problem and make a product decision. It then generates a structured specification, identifies potential failure modes, and produces an interactive prototype.

## The Problem

A lot of product ideas start as a collection of:

* notes
* conversations
* feature requests
* assumptions
* half-formed ideas

The temptation is to immediately start building.

Forge is designed to slow down that first step and make the product decision explicit before implementation begins.

## How It Works

```text
Messy idea
    ↓
Problem framing
    ↓
Product decision
    ↓
Structured specification
    ↓
Failure-mode analysis
    ↓
Interactive prototype
```

## Architecture

The application is built with Next.js, React, and TypeScript.

```text
UI
│
├── Conversation interface
├── Product framing
├── Specification view
└── Prototype viewer
        │
        ↓
Forge Context
        │
        ↓
Product Engine
        │
        ├── Problem analysis
        ├── Product decision
        ├── Specification generation
        └── Failure-mode analysis
        │
        ↓
Prototype Generator
        │
        ↓
Interactive HTML prototype
```

### Core modules

* `src/lib/engine.ts` — core product reasoning and transformation logic
* `src/lib/prototype.ts` — generates the interactive prototype
* `src/types.ts` — shared application types
* `ForgeContext.tsx` — application state and conversation flow
* `components/` — UI components

## Engineering Decisions

### Product framing before specification

Forge does not allow a specification to be generated before the product category and framing decision are established.

This prevents the system from turning an unclear idea into a detailed specification for the wrong product.

### Failure modes

Specifications include potential failure cases rather than only describing the ideal workflow.

### Local-first demo

The public demo currently uses a deterministic local engine rather than requiring a live model or API key.

This keeps the demo reproducible and makes the core product logic easy to inspect.

## Running Locally

```bash
npm install
npm run dev
```

Then open the local development URL shown by Next.js.

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Zustand
