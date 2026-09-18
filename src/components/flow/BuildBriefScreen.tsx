import { useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCopy, FlaskConical, ShieldAlert } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button, SeverityBadge } from "../ui/primitives";
import { LoadingState, RiskPill, ScreenShell, SectionRule } from "./shared";

export function BuildBriefScreen({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;
  const spec = conv.spec;
  const [view, setView] = useState<"brief" | "details">("brief");

  if (f.generating && !spec) {
    return (
      <LoadingState
        title="Creating the build brief…"
        body="Forge is turning the chosen direction into a focused V1, not a giant PRD."
      />
    );
  }

  if (!spec) {
    return (
      <LoadingState
        title="The build brief is not ready yet."
        body="Return to Decide and choose a product direction."
      />
    );
  }

  const mustHaves = spec.requirements.filter((item) => item.priority === "P0");

  return (
    <ScreenShell
      eyebrow="4 · Build Brief"
      title="The product you are actually committing to"
      description="The default view stays short. Open the details only when you need acceptance criteria, validation work, or failure modes."
    >
      <div className="max-w-4xl">
        <div className="mb-6 flex gap-1 border-b border-line">
          <button
            type="button"
            onClick={() => setView("brief")}
            className={
              "border-b-2 px-3 py-2 text-[14px] transition " +
              (view === "brief" ? "border-ink font-medium text-ink" : "border-transparent text-ink-4 hover:text-ink")
            }
          >
            Brief
          </button>
          <button
            type="button"
            onClick={() => setView("details")}
            className={
              "border-b-2 px-3 py-2 text-[14px] transition " +
              (view === "details" ? "border-ink font-medium text-ink" : "border-transparent text-ink-4 hover:text-ink")
            }
          >
            Details
          </button>
        </div>

        {view === "brief" ? (
          <div>
            <SectionRule title="Chosen direction">
              <p className="font-display text-[22px] font-semibold leading-7">{spec.thesis}</p>
            </SectionRule>

            <SectionRule title="What V1 is">
              <p className="max-w-3xl text-[15px] leading-6 text-ink-2">{spec.overview}</p>
            </SectionRule>

            <SectionRule title={"Must-have requirements · " + mustHaves.length}>
              <div className="divide-y divide-line">
                {mustHaves.map((requirement, index) => (
                  <div key={requirement.id} className="grid gap-2 py-4 sm:grid-cols-[32px_1fr]">
                    <span className="text-[13px] tabular-nums text-ink-4">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-[15px] font-medium">{requirement.name}</p>
                      <p className="mt-1 text-[13px] leading-5 text-ink-3">{requirement.story}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionRule>

            <SectionRule title="Not in V1">
              {spec.nonGoals.length > 0 ? (
                <ul className="space-y-2">
                  {spec.nonGoals.map((item) => (
                    <li key={item} className="flex gap-2 text-[14px] leading-5 text-ink-2">
                      <span className="text-ink-4">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-ink-4">No explicit non-goals yet.</p>
              )}
            </SectionRule>

            {spec.metrics.length > 0 && (
              <SectionRule title="How you will know it is working">
                <div className="space-y-3">
                  {spec.metrics.slice(0, 4).map((metric) => (
                    <div key={metric.name} className="grid gap-1 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                      <span className="text-[14px] font-medium text-ink-2">{metric.name}</span>
                      <span className="text-[13px] leading-5 text-ink-4">{metric.target}</span>
                    </div>
                  ))}
                </div>
              </SectionRule>
            )}
          </div>
        ) : (
          <div>
            <SectionRule title="Requirements and acceptance criteria">
              <div className="divide-y divide-line">
                {spec.requirements.map((requirement) => (
                  <details key={requirement.id} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <div>
                        <p className="text-[15px] font-medium">{requirement.name}</p>
                        <p className="mt-1 text-[13px] text-ink-4">
                          {requirement.priority} · {requirement.source}
                        </p>
                      </div>
                      <span className="text-[13px] text-ink-4 group-open:rotate-45">+</span>
                    </summary>
                    <div className="mt-4 pl-0 sm:pl-4">
                      <p className="text-[14px] leading-6 text-ink-2">{requirement.story}</p>
                      <ul className="mt-3 space-y-2">
                        {requirement.criteria.map((criterion) => (
                          <li key={criterion} className="flex gap-2 text-[13px] leading-5 text-ink-3">
                            <span>•</span>
                            <span>{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ))}
              </div>
            </SectionRule>

            <SectionRule title="Failure modes">
              <div className="space-y-4">
                {spec.failureModes.map((item) => (
                  <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:gap-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="size-4 text-scorch" />
                        <p className="text-[14px] font-medium">{item.title}</p>
                      </div>
                      <p className="mt-1 pl-6 text-[13px] leading-5 text-ink-4">{item.containment}</p>
                    </div>
                    <SeverityBadge value={item.severity} />
                  </div>
                ))}
              </div>
            </SectionRule>

            <SectionRule title="What still needs proving">
              <div className="space-y-5">
                {spec.validationPlan.map((item, index) => (
                  <div key={item.risk + "-" + index}>
                    <div className="flex items-center gap-2">
                      <FlaskConical className="size-4 text-molten" />
                      <RiskPill risk={item.risk} />
                    </div>
                    <p className="mt-2 text-[14px] leading-5 text-ink-2">{item.assumption}</p>
                    <p className="mt-1 text-[13px] leading-5 text-ink-4">Test: {item.test}</p>
                    <p className="mt-1 text-[13px] leading-5 text-ink-4">Signal: {item.successSignal}</p>
                  </div>
                ))}
              </div>
            </SectionRule>

            {spec.questions.length > 0 && (
              <SectionRule title="Open questions">
                <ul className="space-y-2">
                  {spec.questions.map((question) => (
                    <li key={question} className="flex gap-2 text-[14px] leading-5 text-ink-2">
                      <span className="text-ink-4">•</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </SectionRule>
            )}
          </div>
        )}

        <div className="mt-7 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={f.copySpec}>
            <ClipboardCopy className="size-3.5" />
            Copy brief
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              f.setComposer("Review this build brief. Point out the weakest requirement, unsupported assumption, or unnecessary scope. Be specific.");
              onOpenCopilot();
            }}
          >
            Review with Forge
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button variant="ghost" onClick={() => f.setProjectStage("decide")}>
            <ArrowLeft className="size-3.5" />
            Back
          </Button>
          <Button variant="temper" onClick={() => f.setProjectStage("handoff")}>
            Prepare handoff
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}
