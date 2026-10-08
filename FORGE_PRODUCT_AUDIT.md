# Forge — Product Audit and Rebuild Decision (October 2026)

## Core product decision

**Forge is a pre-build decision lab, not a chat assistant, market-report generator or generic UI builder.**

The precise job: **take an early product idea; expose the high-consequence assumptions behind it; define what evidence would disprove those assumptions; then make one selected mechanism tangible in an interactive prototype.**

The user may be a PM, solo builder, designer, or founder. They should not have to understand Forge's internal product model to get value.

## What failed in the previous versions

1. **Chatbot substitution.** A permanent chat pane and a canvas merely replicated general AI tools. The interface did not embody critique or an actual decision.
2. **Multiple compulsory screens without clear payoffs.** Frame/Challenge/Decide/Brief/Handoff was the architecture exposed to users, not a workflow matched to cognitive tasks.
3. **False validation.** Synthesizing user input and generating polished text is *reasoning*, not validation. Search can reveal alternatives and contradictions, but neither search results nor LLM confidence proves demand.
4. **Empty states with PM jargon.** Blank "Primary user" and scripted "more context" requests made the user manage the tool's internal structure.
5. **Meaningless cards and surface treatment.** Repeated dark boxes and miniature labels made separate tasks look identical. Styling changed without a unique product interaction.
6. **Incomplete product actions.** A broken directions call or a loading dead end blocked the entire path. Build-brief and prototype were unnecessarily separated by manual steps.
7. **Navigation and re-entry bugs.** Collapsing the sidebar was impossible, and a browser refresh reset the active project.
8. **Unnecessary simultaneous inputs.** Chat and artifact editing both demanded written instructions, competing for attention.

## Reference decisions

- **Strategyzer assumption mapping and Test Cards**: start from the assumption that matters; say how it could be disproved and what experiment would provide evidence. https://www.strategyzer.com/library/validate-your-ideas-with-the-test-card
- **Linear 2026 interface refresh**: do not compete for attention the task hasn't earned; dim navigation and unify predictable actions. https://linear.app/now/behind-the-latest-design-refresh
- **Details.so hero and SaaS/product references**: hero clarity should show the product's mechanism rather than fill a page with decorative UI. https://www.details.so/inspo/category/hero
- **Design Spells**: interaction motion should follow a user action, clarify context and express state. https://designspells.com/
- **Open-source AI artifact patterns (Vercel / shadcn)**: reuse clear loading, progressive rendering, error and preview idioms, but **reject** their generic chat-first information architecture for Forge. https://github.com/vercel/chatbot
- **Refero**: flow and screen library requested; the connected tool currently returns NO_SUBSCRIPTION, so full authenticated flows were not accessible. Do not claim its detailed flows were studied.

## New user-visible mental model

**One thought → one hypothesis → one adversarial stress test → one informed product choice → one working prototype.**

Internally this includes structured state and generated artifacts, but the person sees a purpose-built workbench.

### Entry
- Hero communicates a concrete differentiated use case, not a vague "type anything" invitation.
- One primary composer; context or dictation accepted.
- An *illustrative* stress-test snippet shows the exact kind of output. Never present example content as evidence.

### Hypothesis
- Large, readable statement of who, problem, current workaround and outcome.
- Explicit edit action; no hover-only pencil roulette.
- One dominant action: **Stress-test this idea**.
- Market check is optional and secondary; external results can inform the test but do not gate it.

### Adversarial stress test
- Three or four **ranked**, falsifiable assumptions. No invented percentages or confidence scores.
- User selects one pressure point; details explain why it matters, what would prove it false and the cheapest test.
- One explicit experiment with an observable success signal **and** a stopping signal.
- Recommendation is provisional: investigate, reframe or proceed to a real test.
- The outcome of this screen is a better decision, not the claim that the idea is validated.

### Directions
- Three mechanisms, not three feature lists.
- User selection is explicit.
- One action: generate brief + interactive prototype for selected mechanism.

### Prototype
- Sandboxed local-only working interaction, not a production deployment or fake external integration.
- Desktop and mobile modes. Export self-contained HTML and the build brief.
- Connect back to the first experiment; interacting with a demo is not market validation.

## Engineering invariants

- Conversation state belongs to the project even when chat is not primary navigation.
- A changed core hypothesis invalidates outdated research, stress tests, directions, brief and prototype.
- New research invalidates dependent reasoning.
- Each Gemini action has its **own structured schema**; unrelated fields cannot fail the entire action.
- Persist completed intermediate brief before starting prototype generation, so a second-call error does not erase work.
- Project and sidebar state survive refresh.
- No action depends on an unobservable background process. Loading/failed/retry states remain visible.
- Generated prototype executes in a CSP-constrained sandbox, with no external connections or submission.
- No proprietary fonts and no design motion that breaks reduced-motion preferences.

## Golden-path acceptance criteria

1. A new visitor can explain what Forge produces from the landing page and example alone.
2. They can enter a rough idea without supplying PM terminology.
3. A response creates a working hypothesis; if the API fails, input remains visible.
4. "Stress-test" produces specific ranked risks and an experiment; a failure shows Retry, never a blank panel.
5. Inspecting different risks changes the detail pane and preserves selected state while browsing.
6. "Directions" generates exactly three options; a backend failure offers Retry without losing the stress test.
7. Selecting one option and choosing Build creates a brief then a prototype, without an intervening wizard page.
8. Re-entry by project selection and browser refresh returns to useful work.
9. Sidebar collapse and expand work with pointer and keyboard.
10. On mobile, no critical CTA disappears or splits the screen into cramped chat/canvas panels.
11. Dictation transcript does not duplicate previous final segments.
12. No generated claim is styled or worded as independent validation unless its evidence is actually documented.

## Remaining product research

This rebuilt workflow is a **hypothesis about how the product should work**. It still needs usability testing with first-time PMs and builders. Test actual idea-to-experiment comprehension; don't infer UX quality from code compilation or aesthetic confidence. Research reliability and end-to-end Gemini execution require real runtime tests in a connected environment.

### Kill criteria

If users who have a real product question still cannot get a more falsifiable hypothesis, clearer decision or genuinely useful prototype than they could from ordinary chat with similar effort, **Forge has not established its right to exist**. Do not compensate for that with more animations or new branding.
