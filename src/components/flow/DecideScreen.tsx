import { ArrowLeft, ArrowRight, GitBranch } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button, Pill } from "../ui/primitives";
import { LoadingState, ScreenShell } from "./shared";

export function DecideScreen({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;

  if (f.generating && conv.theses.length === 0) {
    return (
      <LoadingState
        title="Comparing different products…"
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
        <div className="max-w-2xl border-y border-line py-6">
          <div className="flex items-start gap-3">
            <GitBranch className="mt-0.5 size-5 text-ink-4" />
            <div>
              <p className="text-[15px] font-medium">No product directions yet.</p>
              <p className="mt-1 text-[13px] leading-5 text-ink-4">
                Go back if the frame still needs work, or compare directions from the context you already have.
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" onClick={() => f.setProjectStage("challenge")}>
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
            <Button variant="temper" onClick={f.advanceToDirections} disabled={f.generating}>
              Compare directions
            </Button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      eyebrow="3 · Decide"
      title="Which product should exist?"
      description="These are different approaches to the same opportunity. Forge recommends one; you make the decision."
    >
      <div className="grid max-w-5xl gap-3 lg:grid-cols-3">
        {conv.theses.map((option) => {
          const selected = conv.selectedThesis === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => f.selectThesis(option.id)}
              className={
                "flex min-h-[300px] flex-col rounded-2xl border p-5 text-left transition " +
                (selected
                  ? "border-ink bg-raised shadow-sm"
                  : "border-line bg-canvas hover:border-line-strong hover:bg-raised")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-ink-4">Option {option.id}</span>
                {option.recommended && <Pill tone="temper">Forge recommends</Pill>}
              </div>

              <h3 className="mt-4 font-display text-[19px] font-semibold leading-6">{option.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-ink-3">{option.description}</p>

              <div className="mt-auto pt-6">
                <div className="border-t border-line pt-4">
                  <p className="text-[12px] font-medium text-temper">Why it could work</p>
                  <p className="mt-1 text-[13px] leading-5 text-ink-3">{option.pros[0] || "—"}</p>
                </div>
                <div className="mt-4">
                  <p className="text-[12px] font-medium text-scorch">Biggest risk</p>
                  <p className="mt-1 text-[13px] leading-5 text-ink-3">{option.risks[0] || "—"}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <Button
          variant="ghost"
          onClick={() => {
            f.setComposer("These product directions are not quite right. Here is what I think Forge is missing: ");
            onOpenCopilot();
          }}
        >
          These options are missing something
        </Button>
      </div>

      <div className="mt-8 flex max-w-5xl flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={() => f.setProjectStage("challenge")}>
          <ArrowLeft className="size-3.5" />
          Back
        </Button>
        <Button variant="temper" onClick={f.lockThesis} disabled={f.generating}>
          {f.generating ? "Creating build brief…" : "Choose this direction"}
          {!f.generating && <ArrowRight className="size-3.5" />}
        </Button>
      </div>
    </ScreenShell>
  );
}
