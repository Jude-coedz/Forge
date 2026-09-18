import { ArrowLeft, ArrowRight, Check, CircleHelp } from "lucide-react";
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
      why: "Forge does not have evidence for this yet.",
      risk: item.risk,
    }));

  const challenges = [...openDecisions, ...assumptions];

  return (
    <ScreenShell
      eyebrow="2 · Challenge"
      title="What could change what you build?"
      description="Only decision-changing uncertainty belongs here. Unknown is allowed; you do not need to invent an answer to keep moving."
    >
      <div className="max-w-3xl">
        {challenges.length > 0 ? (
          <div className="divide-y divide-line border-y border-line">
            {challenges.map((item, index) => (
              <section key={item.id} className="py-5">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-inset text-[12px] font-medium text-ink-3">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-medium uppercase tracking-wide text-ink-4">{item.kind}</span>
                      {item.risk && <RiskPill risk={item.risk} />}
                    </div>
                    <h3 className="mt-2 text-[16px] font-medium leading-6 text-ink">{item.title}</h3>
                    <p className="mt-1 text-[13px] leading-5 text-ink-4">{item.why}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          f.setComposer("I can answer this: " + item.title + "\n\nMy answer: ");
                          onOpenCopilot();
                        }}
                      >
                        Add what I know
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => f.toast({
                          title: "Kept unresolved",
                          body: "Forge will carry this uncertainty into the product directions instead of making you guess.",
                          tone: "default",
                        })}
                      >
                        Leave unresolved
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-3 border-y border-line py-5">
            <Check className="mt-0.5 size-5 text-temper" />
            <div>
              <p className="text-[15px] font-medium">No major challenge is blocking a useful comparison.</p>
              <p className="mt-1 text-[13px] text-ink-4">Forge can still carry smaller assumptions forward as risks.</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => f.setProjectStage("frame")}>
            <ArrowLeft className="size-3.5" />
            Back
          </Button>

          <Button variant="temper" disabled={f.generating} onClick={f.advanceToDirections}>
            {f.generating ? (
              <>
                <CircleHelp className="size-3.5 animate-pulse" />
                Comparing directions…
              </>
            ) : (
              <>
                Compare directions
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}
