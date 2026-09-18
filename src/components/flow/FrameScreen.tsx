import { ArrowRight, Lightbulb } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";
import { LoadingState, RiskPill, ScreenShell, SectionRule } from "./shared";

export function FrameScreen({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;
  const model = conv.productModel;
  const hasFrame = Boolean(model.summary || model.primaryUser || model.opportunity);
  const assumptions = model.assumptions.filter((item) => item.status === "untested").slice(0, 3);

  if (!hasFrame && f.generating) {
    return (
      <LoadingState
        title="Turning your idea into a product frame…"
        body="Forge is separating the problem from the solution you already have in mind."
      />
    );
  }

  return (
    <ScreenShell
      eyebrow="1 · Frame"
      title="Is this the problem you mean?"
      description="Forge should do the first pass. Your job is only to correct the interpretation if it is wrong."
    >
      <div className="max-w-3xl">
        <dl className="divide-y divide-line border-y border-line">
          <FrameRow label="Primary user" value={model.primaryUser} />
          <FrameRow label="Problem" value={model.opportunity} />
          <FrameRow label="What happens today" value={model.currentWorkaround} />
          <FrameRow label="Better outcome" value={model.desiredOutcome} />
        </dl>

        {assumptions.length > 0 && (
          <SectionRule title="What Forge is not treating as fact">
            <div className="space-y-3">
              {assumptions.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-2.5">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-molten" />
                    <p className="text-[14px] leading-5 text-ink-2">{item.claim}</p>
                  </div>
                  <RiskPill risk={item.risk} />
                </div>
              ))}
            </div>
          </SectionRule>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          <Button variant="temper" onClick={() => f.setProjectStage("challenge")}>
            Looks right
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
        </div>
      </div>
    </ScreenShell>
  );
}

function FrameRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 py-5 sm:grid-cols-[170px_1fr] sm:gap-8">
      <dt className="text-[13px] font-medium text-ink-4">{label}</dt>
      <dd className={value ? "text-[15px] leading-6 text-ink" : "text-[15px] text-ink-4"}>
        {value || "Not clear yet"}
      </dd>
    </div>
  );
}
