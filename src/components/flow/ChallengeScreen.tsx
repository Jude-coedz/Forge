import { ArrowLeft, ArrowRight, Check, CircleHelp, Lightbulb, Scale } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import type { ProductRisk } from "../../types";
import { Button } from "../ui/primitives";
import { RiskPill, ScreenShell } from "./shared";

type Challenge = {
  id: string;
  kind: "Decision" | "Assumption";
  title: string;
  why: string;
  risk: ProductRisk | null;
};

export function ChallengeScreen({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;
  const model = conv.productModel;

  const openDecisions: Challenge[] = model.decisions
    .filter((item) => item.status === "open")
    .slice(0, 2)
    .map((item) => ({
      id: item.id,
      kind: "Decision",
      title: item.question,
      why: item.rationale || "This choice could materially change the product direction.",
      risk: null,
    }));

  const remaining = Math.max(0, 3 - openDecisions.length);
  const assumptions: Challenge[] = model.assumptions
    .filter((item) => item.status === "untested")
    .slice(0, remaining)
    .map((item) => ({
      id: item.id,
      kind: "Assumption",
      title: item.claim,
      why: "Forge does not have evidence for this yet. It will travel forward as a risk unless you add context.",
      risk: item.risk,
    }));

  const challenges = [...openDecisions, ...assumptions];

  return (
    <ScreenShell
      eyebrow="2 · Challenge"
      title="Put pressure on the parts that could change the product"
      description="Forge only raises uncertainty that could materially alter what gets built. You do not need to guess. Anything unanswered stays visibly unresolved."
      wide
    >
      <div className="max-w-5xl">
        {challenges.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {challenges.map((item, index) => {
              const Icon = item.kind === "Decision" ? Scale : Lightbulb;
              return (
                <section
                  key={item.id}
                  className="group flex min-h-[300px] flex-col rounded-[22px] border border-line-strong bg-raised p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={
                      "grid size-9 place-items-center rounded-xl " +
                      (item.kind === "Decision" ? "bg-spark-soft text-spark" : "bg-molten-soft text-molten")
                    }>
                      <Icon className="size-4" />
                    </span>
                    <span className="font-mono text-[10px] text-ink-4">{String(index + 1).padStart(2, "0")}</span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">{item.kind}</span>
                    {item.risk && <RiskPill risk={item.risk} />}
                  </div>

                  <h3 className="mt-3 text-[17px] font-medium leading-6 tracking-[-0.01em] text-ink">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-ink-4">{item.why}</p>

                  <div className="mt-auto pt-6">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        f.setComposer("I can add context to this: " + item.title + "\n\nWhat I know: ");
                        onOpenCopilot();
                      }}
                    >
                      Add what I know
                    </Button>
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-temper/25 bg-temper-soft/50 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-temper text-white">
                <Check className="size-4.5" />
              </span>
              <div>
                <p className="text-[16px] font-medium">Nothing major is blocking a useful comparison.</p>
                <p className="mt-1 text-[14px] leading-6 text-ink-4">Smaller assumptions can still travel forward as explicit product risks.</p>
              </div>
            </div>
          </div>
        )}

        {challenges.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl px-1 text-[12px] leading-5 text-ink-4">
            <CircleHelp className="mt-0.5 size-3.5 shrink-0" />
            <span>Do not know an answer? Leave it alone. Forge keeps unresolved items visible instead of forcing certainty.</span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button variant="ghost" onClick={() => f.setProjectStage("frame")}>
            <ArrowLeft className="size-3.5" />
            Back to frame
          </Button>

          <Button variant="primary" disabled={f.generating} onClick={f.advanceToDirections}>
            {f.generating ? (
              <>
                <CircleHelp className="size-3.5 animate-pulse" />
                Comparing directions…
              </>
            ) : (
              <>
                Compare product directions
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}
