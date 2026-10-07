import { ArrowLeft, ArrowRight, Check, GitBranch, ShieldAlert, Sparkles } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button, Pill } from "../ui/primitives";
import { LoadingState, ScreenShell } from "./shared";

export function DecideScreen({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;

  if (f.generating && conv.theses.length === 0) {
    return (
      <LoadingState
        title="Comparing genuinely different products…"
        body="Forge is looking for different product mechanisms, not three versions of the same feature list."
      />
    );
  }

  if (conv.theses.length === 0) {
    return (
      <ScreenShell
        eyebrow="3 · Decide"
        title="Choose the product, not the feature list"
        description="Forge has not generated directions for this frame yet."
      >
        <div className="max-w-2xl rounded-[22px] border border-line-strong bg-raised p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-inset text-ink-4">
              <GitBranch className="size-4" />
            </span>
            <div>
              <p className="text-[16px] font-medium">No product directions yet.</p>
              <p className="mt-1 text-[14px] leading-6 text-ink-4">
                Go back if the frame still needs work, or compare directions from the context you already have.
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" onClick={() => f.setProjectStage("challenge")}>
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
            <Button variant="primary" onClick={f.advanceToDirections} disabled={f.generating}>
              Compare directions
            </Button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  const selectedOption = conv.theses.find((option) => option.id === conv.selectedThesis);

  return (
    <ScreenShell
      eyebrow="3 · Decide"
      title="Three products could exist here. Pick one."
      description="The point is not to combine the safest parts of every option. Choose the mechanism you believe deserves to exist, then Forge will lock the V1 around it."
      wide
    >
      <div className="max-w-6xl">
        <div className="grid gap-3 lg:grid-cols-3">
          {conv.theses.map((option) => {
            const selected = conv.selectedThesis === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => f.selectThesis(option.id)}
                className={
                  "group relative flex min-h-[390px] flex-col overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-200 " +
                  (selected
                    ? "border-spark/45 bg-raised shadow-[0_24px_65px_-42px_var(--spark)]"
                    : "border-line-strong bg-raised/70 hover:-translate-y-0.5 hover:border-line-strong hover:bg-raised hover:shadow-[var(--shadow-float)]")
                }
              >
                {selected && <span className="absolute inset-x-0 top-0 h-[3px] bg-spark" />}

                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                    <span className={
                      "grid size-6 place-items-center rounded-lg " +
                      (selected ? "bg-spark text-white" : "border border-line bg-canvas")
                    }>
                      {selected ? <Check className="size-3.5" /> : option.id}
                    </span>
                    Direction {option.id}
                  </span>
                  {option.recommended && (
                    <Pill tone="spark">
                      <Sparkles className="size-3" />
                      Forge pick
                    </Pill>
                  )}
                </div>

                <h3 className="mt-6 font-display text-[21px] font-semibold leading-7 tracking-[-0.025em]">{option.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-ink-3">{option.description}</p>

                <div className="mt-7 border-t border-line pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-temper">Why it could win</p>
                  <ul className="mt-3 space-y-2.5">
                    {option.pros.slice(0, 2).map((pro) => (
                      <li key={pro} className="flex gap-2.5 text-[13px] leading-5 text-ink-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-temper" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-scorch">
                    <ShieldAlert className="size-3.5" />
                    Biggest risk
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-ink-3">{option.risks[0] || "No major risk captured."}</p>
                </div>

                <div className="mt-auto pt-6">
                  <span className={
                    "inline-flex items-center gap-2 text-[12px] font-medium transition " +
                    (selected ? "text-spark" : "text-ink-4 group-hover:text-ink-2")
                  }>
                    {selected ? "Selected direction" : "Choose this direction"}
                    {!selected && <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedOption && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-line bg-canvas/70 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-4">Current decision</p>
              <p className="mt-1 text-[14px] font-medium">{selectedOption.title}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                f.setComposer("These product directions are not quite right. Here is what I think Forge is missing: ");
                onOpenCopilot();
              }}
            >
              These options are missing something
            </Button>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button variant="ghost" onClick={() => f.setProjectStage("challenge")}>
            <ArrowLeft className="size-3.5" />
            Back to challenge
          </Button>
          <Button variant="primary" onClick={f.lockThesis} disabled={f.generating}>
            {f.generating ? "Locking V1…" : "Commit to this direction"}
            {!f.generating && <ArrowRight className="size-3.5" />}
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}
