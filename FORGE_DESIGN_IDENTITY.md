# Forge Visual Identity v2 — Soft Precision

Date: 2026-10-08

## Product framing
Forge helps someone **stress-test a product idea before building it**. The UI should move attention from hypothesis to the assumptions that could break it, then to an experiment and interactive prototype. Visual effects communicate that progression; they are not a substitute for it.

## Primary visual language
- Deep graphite canvas `#101116`, raised panel `#1b1e26`, insets `#242832`.
- Body foreground `#e0e1e6`, bright white for key headings and actions, quiet secondary `#a9aebc`.
- Restrained warm accent `#e5a17f` for Forge identity, selected analysis detail, and dictation. No orange outline around a whole input.
- Neutral hairline separators and rare visible borders. Use hierarchy and space before new cards.
- Soft component radii: 28px composer, 20–24px primary artifact panels, 12–16px small utilities, full pills for primary actions.
- One balanced type system, not tiny all-uppercase copy everywhere. Display text has moderate tracking and regular weight; body content stays comfortably 15–18px.
- Explicit keyboard focus on actions; composer uses a restrained high-contrast surface change rather than a highly saturated focus stroke.

## Motion
The project installs and locks **Motion for React**, imported from `motion/react`. Use shared layout animations only where selection changes meaning:
- Home's Idea → Pressure point → Experiment explainer, which demonstrates the value proposition.
- Main workbench view transitions, so the previous mental context is not abruptly discarded.
- Selection changing between pressure points and alternative mechanisms.
- Composer feedback, dictation state, and toast notifications.

Never animate entire pages simply to signal polish. Favor restrained opacity, transform and shared-selection movement. Respect `prefers-reduced-motion` through Motion's `useReducedMotion` hook and the CSS fallback.

## UI quality bar
A reviewer should be able to identify the current hypothesis, what action to take, and what artifact emerges without reading helper paragraphs or learning an internal PM framework. Distinguish actual evidence from the model's inferred assumptions. Maintain action-specific loading, failure and retry states.

## Non-negotiable engineering bar
The first Gemini analysis must complete on a real deployment, not only mocked tests. Preview lacks `Gemini_key` as observed in the deployment health check; production configuration must also be confirmed. Do not claim a working product merely because the Vite build passes.

## Reference intent
Borrowed patterns from high-quality SaaS: focused visual hierarchy, minimal irreversible choices, meaningful interaction state, human-legible output, and prototype previews. Do not clone an unrelated chatbot or reintroduce mandatory Frame → Challenge → Decide → Brief → Prototype wizards.
