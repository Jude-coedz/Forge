import { useEffect, useMemo, useRef } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { clock } from "../../lib/id";
import type { ProjectStage } from "../../types";
import { Button } from "../ui/primitives";

const stageCopy: Record<ProjectStage, { title: string; subtitle: string }> = {
  frame: {
    title: "Work on the frame",
    subtitle: "Correct the interpretation or add missing evidence",
  },
  challenge: {
    title: "Pressure-test the product",
    subtitle: "Add context to a decision-changing uncertainty",
  },
  decide: {
    title: "Interrogate the directions",
    subtitle: "Challenge the recommendation before committing",
  },
  brief: {
    title: "Review the Build Brief",
    subtitle: "Cut scope or expose a weak requirement",
  },
  prototype: {
    title: "Review the prototype",
    subtitle: "Feed workflow problems back into the product decision",
  },
  handoff: {
    title: "Check the handoff",
    subtitle: "Make sure implementation will preserve the decision",
  },
};

const prompts: Record<ProjectStage, Array<{ label: string; prompt: string }>> = {
  frame: [
    {
      label: "Correct the frame",
      prompt: "The current frame is wrong or incomplete. Help me correct the user, problem, current workaround, or desired outcome without inventing evidence.",
    },
    {
      label: "What is assumed?",
      prompt: "Separate the strongest evidence in this frame from the assumptions that could materially change the product.",
    },
  ],
  challenge: [
    {
      label: "Challenge the biggest risk",
      prompt: "Which unresolved assumption or decision here is most likely to change what gets built, and why?",
    },
    {
      label: "What can stay unknown?",
      prompt: "Which uncertainty here can safely remain unresolved for now, and which one actually needs evidence before we commit?",
    },
  ],
  decide: [
    {
      label: "Why this direction?",
      prompt: "Explain why the currently recommended product direction wins against the other two using only the evidence and assumptions we actually have.",
    },
    {
      label: "Attack the recommendation",
      prompt: "Make the strongest case against the recommended direction. What would have to be true for another option to be better?",
    },
  ],
  brief: [
    {
      label: "Cut scope",
      prompt: "Review the Build Brief and identify the P0 requirement that is least essential to proving the chosen product mechanism.",
    },
    {
      label: "Find the weak spot",
      prompt: "Point out the weakest requirement, unsupported assumption, or hidden dependency in this Build Brief. Be specific.",
    },
  ],
  prototype: [
    {
      label: "Review the workflow",
      prompt: "Review the prototype against the locked Build Brief. What interaction or state most weakens the intended product mechanism?",
    },
    {
      label: "What is fake?",
      prompt: "Which parts of this prototype could create false confidence because they simulate something the Build Brief has not actually proven?",
    },
  ],
  handoff: [
    {
      label: "Check implementation risk",
      prompt: "What is the most likely way a builder could accidentally change the product decision while implementing this handoff?",
    },
    {
      label: "Summarize the decision",
      prompt: "Summarize the product decision, V1 boundaries, and unresolved assumptions in the smallest useful implementation note.",
    },
  ],
};

export function CopilotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const f = useForge();
  const bottom = useRef<HTMLDivElement>(null);
  const conv = f.conv;

  useEffect(() => {
    if (!open) return;
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conv?.messages, f.generating, open]);

  const copy = useMemo(() => conv ? stageCopy[conv.stage] : null, [conv]);
  const quickPrompts = useMemo(() => conv ? prompts[conv.stage] : [], [conv]);

  if (!open || !conv || !copy) return null;

  return (
    <>
      <button
        className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-[2px]"
        aria-label="Close Forge"
        onClick={onClose}
      />

      <aside className="forge-enter fixed inset-y-0 right-0 z-[70] flex w-full max-w-[460px] flex-col border-l border-line bg-surface shadow-[var(--shadow-float)]">
        <header className="shrink-0 border-b border-line bg-canvas/80 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-spark-soft text-spark">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-[14px] font-semibold">{copy.title}</p>
                <p className="mt-0.5 text-[12px] leading-5 text-ink-4">{copy.subtitle}</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close Forge" className="rounded-xl">
              <X className="size-4" />
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickPrompts.map((item) => (
              <QuickPrompt key={item.label} label={item.label} prompt={item.prompt} />
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
          {conv.messages.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-line-strong p-4">
              <p className="text-[13px] leading-6 text-ink-4">
                Forge is optional here. The workflow should stand on its own. Use this surface when something is wrong, uncertain, or worth challenging.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {conv.messages.map((message) => {
                const user = message.role === "user";
                return (
                  <div key={message.id} className={user ? "pl-10" : "pr-5"}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={"text-[11px] font-semibold uppercase tracking-[0.1em] " + (user ? "text-ink-4" : "text-spark")}>
                        {user ? "You" : "Forge"}
                      </span>
                      <span className="text-[10px] text-ink-4/70">{clock(message.createdAt)}</span>
                    </div>
                    <div className={user ? "rounded-[16px] bg-inset px-3.5 py-3" : ""}>
                      <p className={"whitespace-pre-wrap text-[14px] leading-6 " + (user ? "text-ink-2" : "text-ink")}>
                        {message.text}
                      </p>
                    </div>
                  </div>
                );
              })}

              {f.generating && (
                <div className="flex items-center gap-2 pr-5 text-[12px] text-ink-4">
                  <span className="forge-core size-2 rounded-full bg-spark" />
                  Forge is reasoning from the current product state…
                </div>
              )}
              <div ref={bottom} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-canvas/90 p-3 backdrop-blur-xl">
          <div className="rounded-[18px] border border-line-strong bg-raised p-2.5 shadow-sm transition focus-within:border-spark/35">
            <textarea
              value={f.composer}
              onChange={(event) => f.setComposer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  f.sendChat();
                }
              }}
              rows={3}
              placeholder="Add evidence, correct Forge, or challenge the current decision…"
              className="w-full resize-none bg-transparent px-1 text-[14px] leading-6 text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-ink-4">Shift + Enter for a new line</p>
              <button
                type="button"
                onClick={() => f.sendChat()}
                disabled={!f.composer.trim() || f.generating}
                className="grid size-8 place-items-center rounded-xl bg-ink text-canvas transition enabled:hover:-translate-y-0.5 disabled:opacity-30"
                aria-label="Send to Forge"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function QuickPrompt({ label, prompt }: { label: string; prompt: string }) {
  const f = useForge();

  return (
    <button
      type="button"
      onClick={() => f.setComposer(prompt)}
      className="rounded-xl border border-line bg-raised px-3 py-1.5 text-[11px] font-medium text-ink-3 transition hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
    >
      {label}
    </button>
  );
}
