import { ArrowRight, Lightbulb, Target, UserRound } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";
import { LoadingState, RiskPill, ScreenShell } from "./shared";

export function FrameScreen({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;
  const model = conv.productModel;
  const hasFrame = Boolean(model.summary || model.primaryUser || model.opportunity);
  const assumptions = model.assumptions.filter((item) => item.status === "untested").slice(0, 3);

  if (!hasFrame && f.generating) {
    return (
      <LoadingState
        title="Turning the idea into a product frame…"
        body="Forge is separating what is happening today from the solution already in your head."
      />
    );
  }

  return (
    <ScreenShell
      eyebrow="1 · Frame"
      title="Make sure Forge is solving the problem you actually mean"
      description="This is the working interpretation, not a verdict. Correct anything that changes who the product is for, what is broken today, or what a better outcome means."
      wide
    >
      <div className="max-w-5xl">
        <div className="overflow-hidden rounded-[24px] border border-line-strong bg-raised shadow-[var(--shadow-float)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-canvas/70 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-spark-soft text-spark">
                <UserRound className="size-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Primary user</p>
                <p className="mt-0.5 text-[15px] font-medium text-ink">{model.primaryUser || "Not clear yet"}</p>
              </div>
            </div>
            <span className="rounded-full border border-line bg-raised px-3 py-1.5 text-[11px] font-medium text-ink-4">
              Working frame
            </span>
          </div>

          <div className="grid lg:grid-cols-[1fr_34px_1fr_34px_1fr]">
            <FrameBlock
              index="01"
              label="Current reality"
              title="What happens today"
              value={model.currentWorkaround}
              muted="No reliable workaround captured yet."
            />
            <FrameConnector />
            <FrameBlock
              index="02"
              label="Friction"
              title="What is actually wrong"
              value={model.opportunity}
              muted="The core problem is still unclear."
              emphasis
            />
            <FrameConnector />
            <FrameBlock
              index="03"
              label="Outcome"
              title="What better looks like"
              value={model.desiredOutcome}
              muted="The desired outcome is still unclear."
            />
          </div>
        </div>

        {assumptions.length > 0 && (
          <section className="mt-6 rounded-[22px] border border-molten/20 bg-molten-soft/35 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-molten-soft text-molten">
                <Lightbulb className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-molten">Not treated as fact</p>
                <div className="mt-4 divide-y divide-molten/10">
                  {assumptions.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <p className="max-w-3xl text-[14px] leading-6 text-ink-2">{item.claim}</p>
                      <RiskPill risk={item.risk} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={() => f.setProjectStage("challenge")}>
            This frame is right
            <ArrowRight className="size-3.5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              f.setComposer("The frame is wrong or incomplete. I want to correct this: ");
              onOpenCopilot();
            }}
          >
            Correct the frame
          </Button>
          <p className="ml-0 text-[12px] text-ink-4 sm:ml-2">
            Corrections can invalidate later decisions. Forge will clear stale outputs automatically.
          </p>
        </div>
      </div>
    </ScreenShell>
  );
}

function FrameBlock({
  index,
  label,
  title,
  value,
  muted,
  emphasis = false,
}: {
  index: string;
  label: string;
  title: string;
  value: string;
  muted: string;
  emphasis?: boolean;
}) {
  return (
    <article className={"min-h-[210px] p-5 sm:p-6 " + (emphasis ? "bg-spark-soft/45" : "")}>
      <div className="flex items-center justify-between gap-3">
        <p className={"text-[11px] font-semibold uppercase tracking-[0.14em] " + (emphasis ? "text-spark" : "text-ink-4")}>{label}</p>
        <span className="font-mono text-[10px] text-ink-4">{index}</span>
      </div>
      <h3 className="mt-8 text-[14px] font-medium text-ink-3">{title}</h3>
      <p className={value ? "mt-2 text-[16px] leading-7 text-ink" : "mt-2 text-[15px] leading-6 text-ink-4"}>
        {value || muted}
      </p>
      {emphasis && (
        <div className="mt-6 flex items-center gap-2 text-[11px] font-medium text-spark">
          <Target className="size-3.5" />
          Product decisions should trace back here
        </div>
      )}
    </article>
  );
}

function FrameConnector() {
  return (
    <div className="hidden items-center justify-center border-x border-line bg-canvas/50 lg:flex" aria-hidden>
      <ArrowRight className="size-4 text-ink-4" />
    </div>
  );
}
