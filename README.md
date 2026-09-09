# Forge

Forge is a product copilot for solo builders. You paste messy source material — notes, a voice-memo transcript, a customer thread — and it walks you from that mess to a spec you can actually build from, then a clickable prototype.

It exists because most solo builders skip from “I have an idea” to “let me prompt v0 / Lovable,” and they **build the wrong thing well**. Forge forces one decision in the middle: **what category of product is this?** No spec until that is locked. No prototype until the spec exists.

The UI is a chat on purpose. It should feel like Claude, niched for people who are trying to make a product, not a seven-stage dashboard.

## The product loop

1. **Capture** — paste the messy version. Forge extracts a brief: problem, who it’s for, workaround, constraints, what’s still an assumption.
2. **Category** — three options (usually: assistant vs. system of record vs. CRM). You have to lock one. Asking for a spec early is refused.
3. **Spec** — requirements plus **failure modes** (the part people leave out).
4. **Prototype** — a clickable HTML preview generated from that spec. Irreversible actions (send, mark paid, “do it automatically”) stay human verbs.

The sample path is **KoraFlow**: WhatsApp-native operations for small Lagos merchants. Chat is how work *arrives*. It is not the name of the product, and it is not the product category.

Other pastes get a coined working title (for example **Rollcall** for a gym attendance idea). Channel names like WhatsApp are never used as the product name.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Try **Try the KoraFlow example** → confirm the brief → lock a category → **Build clickable prototype**. In the preview, try Mark paid or Send — they should stop you.

Projects persist in this browser (`localStorage`).

## What is real vs later

**In this demo**

- The full loop above, driven by a local engine (no API key, no live model)
- Clickable prototype in an iframe
- Copy spec as markdown / copy prototype HTML
- Theme, recents, settings

**Later — not faked**

- Live language model
- Voice transcription and file upload
- Web research
- Eval against a real shipped build
- Accounts, sharing, and publishing to Lovable / v0 / Cursor as a hosted app

The prototype is a constrained preview in the browser, not a deployed Lovable project.

---

## How the code works

This is a Vite + React + TypeScript app (Tailwind v4). There is no backend. All “AI” behaviour is a deterministic engine in `src/lib`.

```
src/
  App.tsx                 Provider + shell
  types.ts                Shared types (phase, spec, prototype, conversation)
  data/sample.ts          KoraFlow canned brief / theses / spec
  lib/engine.ts           Capture → category → spec (the product brain)
  lib/prototype.ts        Spec → clickable HTML preview
  store/ForgeContext.tsx  Conversations, streaming replies, localStorage
  components/
    layout/               Sidebar, top bar, phase steps
    chat/                 Welcome, messages, composer
    artifacts/            Brief, category lock, spec, prototype iframe
    pages/SettingsView.tsx
    ui/primitives.tsx
```

### 1. Chat is the product surface

`AppShell` is a Claude-style layout: sidebar of recents, main thread, right-hand **artifact** pane.

Empty state is `Welcome`. Sending a message creates or continues a `Conversation` in `ForgeContext`. Replies stream in on a timer so it feels like a product, not a form wizard.

### 2. Turns go through `applyTurn`

`sendChat` appends the user message, then calls `applyTurn(conversation, text)` in `src/lib/engine.ts`. That function is the whole product:

| Current phase | What happens |
| --- | --- |
| `idle` / more source in `brief` | `extractFromSource` builds a brief + three theses |
| `brief` | Continue → category. Asking for a spec is refused |
| `position` | Pick / challenge / **lock**. Spec is written only after lock |
| `spec` / `prototype` | “Build a prototype” generates HTML. “Auto-send” is refused |

There is no model. Extraction is heuristics (pain language, who it’s for, constraints) plus a high-quality canned path when the paste looks like the KoraFlow sample (`looksLikeKoraflow` in `data/sample.ts`).

Product names come from `inventName`. PascalCase channel names (WhatsApp, Telegram, …) are ignored so the prototype is never titled after the input channel.

### 3. The gate is the product

`lockThesis` / locking Option A, B, or C is the differentiator. Option B is usually “system of record.” The spec (`buildSpec`) encodes that choice into requirements and failure modes. KoraFlow + Option B uses the canned spec in `sample.ts` so a reviewer sees a serious artifact, not lorem ipsum.

### 4. Prototype is generated HTML, not Lovable

`generatePrototype` in `src/lib/prototype.ts` returns a full HTML document.

- KoraFlow → a small merchant app: Today / Order / Follow-up / Activity. Payment stays pending; Send is draft-by-default.
- Anything else → a generic queue + review + record app named from the spec (**Rollcall**, **Tillbook**, …).

The artifact pane loads it in a sandboxed iframe (`srcDoc`). Rebuild / copy HTML / open in a new tab are real. Hosted export is the honest later.

If you ask the chat to auto-send or auto-mark paid, `wantsUnsafeAutomation` catches it and Forge refuses. That is intentional: Lovable would often just do it.

### 5. State

`ForgeProvider` holds an array of conversations. Active id and the list are saved under `forge-conversations-v1` and `forge-active-v1`. Theme is `forge-theme`.

On load, names that were mistakenly saved as “WhatsApp” are rewritten to the coined product name.

### 6. UI pieces

- `ArtifactPane` — tabs for Brief / Category / Spec / Prototype
- `Sidebar` — new project + recents
- `SettingsView` — what the demo does vs later

Types live in `src/types.ts` (`Phase`, `Conversation`, `SpecDoc`, `PrototypeDoc`).

## Suggested review path

1. New project → **How Forge works** (explains the gate)
2. **Try the KoraFlow example** → confirm brief → lock Option B → read failure modes
3. Build prototype → try **Mark paid** and **Send**
4. Type “just send it automatically” and watch it refuse
5. Optional: **A messy gym idea** to see a non-KoraFlow name (**Rollcall**)
