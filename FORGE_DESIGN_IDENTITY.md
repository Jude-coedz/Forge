# Forge Visual Identity — v1

Source: user-provided `DESIGN-x.ai.md` (inspired interpretation of xAI visual language).

## Identity
**Engineered clarity.** An AI product validation workspace that presents complex thinking with unusual restraint. The aesthetic should feel precise, research-grade and quiet, not like a template dashboard.

## Design contract
- Dark-only application canvas: `#0a0a0a`.
- Surface layers: `#191919` for rare contained objects, `#1a1c20` for inputs/hover, hairline `#212327`; no routine elevation shadows.
- Foreground: `#fff` for key headings/actions, `#dadbdf` for body, `#a2a5aa` for secondary, `#7d8187` for disabled/quiet metadata.
- Brand color is monochrome first. Sunset `#ff7a17` is a controlled signature reserved for the Forge symbol, listening/processing and select illustrative moments; never paint whole card backgrounds with it.
- Display sans: open-source Inter/Geist or system sans fallback, **400 weight**, negative tracking. Do not bundle proprietary Universal Sans.
- Tracked monospace labels (12–14px, approximately .12em tracking) only when a technical label has semantic value.
- Buttons: pill silhouettes; the primary action is white on near-black, secondary actions are translucent outlined pills.
- Cards: when necessary, 8px radius, hairline border, little to no shadow. Prefer whitespace and separators to nests of cards.
- Base spacing: 4px scale; align horizontal and vertical rhythm across all major surfaces.
- Hero: large regular-weight title and one strong action. Do not add arbitrary gradients, ornaments, or busy marketing component grids.
- Focus indicators must remain perceivable to keyboard users; restraint must not remove accessibility.
- Animation should communicate state and feel physically light. Prefer quick subtle opacity/translation and purposeful listening/processing feedback. Respect reduced-motion settings.
- Prototype preview is visually distinct from Forge’s chrome because it represents **the user’s product**, not Forge’s own interface.

## Non-goals of this pass
This identity deliberately does not redefine Forge's user journey, validation claims, research behavior, AI prompting, or prototype generation. Those require separate UX and system-design work.

## Future visual QA
For every new screen, check: Is the hierarchy legible at 100% zoom? Is any color decorative rather than informative? Is a card replacing whitespace without purpose? Are controls consistent with the pill shape grammar? Does the layout remain clear at mobile width? Is the interaction discoverable without a tutorial?
