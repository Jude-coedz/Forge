import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardCopy, FlaskConical, ShieldAlert } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button, SeverityBadge } from "../ui/primitives";
import { LoadingState, RiskPill, ScreenShell } from "./shared";

export function BuildBriefScreen({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;
  const spec = conv.spec;
  const [view, setView] = useState<"brief" | "details">("brief");

  if (f.generating && !spec) {
    return (
      <LoadingState
        title="Locking the V1 around your decision…"
        body="Forge is turning the chosen direction into a focused product commitment, not a giant PRD."
      />
    );
  }

  if (!spec) {
    return (
      <LoadingState
        title="The Build Brief is not ready yet."
        body="Return to Decide and commit to one product direction."
      />
    );
  }

  const mustHaves = spec.requirements.filter((item) => item.priority === "P0");
  const validationCount = spec.validationPlan.length + spec.questions.length;

  return (
    <ScreenShell
      eyebrow="4 · Build Brief"
      title="Turn the product decision into a buildable commitment"
      description="The brief keeps scope, reasoning, and uncertainty together. The default view is intentionally small enough to understand in one sitting."
      wide
    >
      <div className="max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-line bg-canvas p-1">
            <ViewTab label="Decision brief" active={view === "brief"} onClick={() => setView("brief")} />
            <ViewTab label="Implementation detail" active={view === "details"} onClick={() => setView("details")} />
          </div>

          <Button variant="secondary" size="sm" onClick={f.copySpec}>
            <ClipboardCopy className="size-3.5" />
            Copy brief
          </Button>
        </div>

        {view === "brief" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <article className="overflow-hidden rounded-[26px] border border-line-strong bg-raised shadow-[var(--shadow-float)]">
              <div className="border-b border-line bg-canvas/70 px-5 py-4 sm:px-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-spark">Locked product direction</p>
                <h3 className="mt-2 max-w-3xl text-[24px] font-semibold leading-8 tracking-[-0.03em] text-ink">
                  {spec.thesis}
                </h3>
              </div>

              <div className="px-5 py-6 sm:px-7">
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">What V1 is</p>
                  <p className="mt-3 max-w-3xl text-[16px] leading-7 text-ink-2">{spec.overview}</p>
                </section>

                <section className="mt-8 border-t border-line pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Must exist in V1</p>
                    <span className="font-mono text-[10px] text-ink-4">{mustHaves.length} P0</span>
                  </div>

                  <div className="mt-4 grid gap-2.5">
                    {mustHaves.map((requirement, index) => (
                      <div key={requirement.id} className="group grid gap-3 rounded-2xl border border-line bg-canvas/65 p-4 sm:grid-cols-[34px_1fr]">
                        <span className="grid size-8 place-items-center rounded-xl bg-raised font-mono text-[10px] text-ink-4 shadow-sm">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="text-[15px] font-medium text-ink">{requirement.name}</p>
                          <p className="mt-1 text-[14px] leading-6 text-ink-3">{requirement.story}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-8 border-t border-line pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Explicitly not V1</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {spec.nonGoals.length > 0 ? spec.nonGoals.map((item) => (
                      <span key={item} className="rounded-xl border border-line bg-inset/65 px-3 py-2 text-[13px] leading-5 text-ink-3">
                        {item}
                      </span>
                    )) : (
                      <p className="text-[14px] text-ink-4">No explicit non-goals yet.</p>
                    )}
                  </div>
                </section>
              </div>
            </article>

            <aside className="space-y-3">
              <BriefSignal
                label="Build surface"
                value={mustHaves.length + " must-have requirements"}
                detail={spec.requirements.length + " total requirements in the detailed brief"}
                tone="spark"
              />
              <BriefSignal
                label="Validation debt"
                value={validationCount + " unresolved items"}
                detail="These stay visible so implementation does not silently turn assumptions into facts."
                tone="molten"
              />
              <BriefSignal
                label="Success"
                value={spec.metrics.length + " product signals"}
                detail={spec.metrics[0]?.target || "Success signals are carried into the build."}
                tone="temper"
              />

              <button
                type="button"
                onClick={() => {
                  f.setComposer("Review this build brief. Point out the weakest requirement, unsupported assumption, or unnecessary scope. Be specific.");
                  onOpenCopilot();
                }}
                className="group w-full rounded-[20px] border border-line-strong bg-raised p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
              >
                <p className="text-[12px] font-semibold text-ink">Pressure-test the brief</p>
                <p className="mt-1 text-[13px] leading-5 text-ink-4">
                  Ask Forge to find the weakest scope decision before you generate the prototype.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-spark">
                  Review with Forge
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </aside>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <article className="rounded-[26px] border border-line-strong bg-raised px-5 py-2 shadow-[var(--shadow-float)] sm:px-7">
              {spec.requirements.map((requirement, index) => (
                <details key={requirement.id} className="group border-b border-line py-5 last:border-b-0">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 font-mono text-[10px] text-ink-4">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-medium text-ink">{requirement.name}</p>
                          <span className={
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                            (requirement.priority === "P0"
                              ? "bg-spark-soft text-spark"
                              : requirement.priority === "P1"
                                ? "bg-inset text-ink-3"
                                : "text-ink-4")
                          }>
                            {requirement.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-ink-4">{requirement.source}</p>
                      </div>
                    </div>
                    <span className="mt-1 grid size-7 place-items-center rounded-lg border border-line bg-canvas text-[16px] text-ink-4 transition-transform duration-200 group-open:rotate-45">+</span>
                  </summary>

                  <div className="ml-7 mt-4 rounded-2xl bg-canvas/70 p-4">
                    <p className="text-[14px] leading-6 text-ink-2">{requirement.story}</p>
                    <div className="mt-4 border-t border-line pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">Acceptance</p>
                      <ul className="mt-3 space-y-2.5">
                        {requirement.criteria.map((criterion) => (
                          <li key={criterion} className="flex gap-2.5 text-[13px] leading-5 text-ink-3">
                            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-temper-soft text-temper">
                              <Check className="size-2.5" />
                            </span>
                            <span>{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              ))}
            </article>

            <aside className="space-y-3">
              <DetailPanel
                icon={<ShieldAlert className="size-4" />}
                title="Failure modes"
                tone="scorch"
              >
                <div className="space-y-4">
                  {spec.failureModes.map((item) => (
                    <div key={item.id}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium leading-5 text-ink-2">{item.title}</p>
                        <SeverityBadge value={item.severity} />
                      </div>
                      <p className="mt-1 text-[12px] leading-5 text-ink-4">{item.containment}</p>
                    </div>
                  ))}
                </div>
              </DetailPanel>

              <DetailPanel
                icon={<FlaskConical className="size-4" />}
                title="Still needs proving"
                tone="molten"
              >
                <div className="space-y-4">
                  {spec.validationPlan.map((item, index) => (
                    <div key={item.risk + "-" + index}>
                      <RiskPill risk={item.risk} />
                      <p className="mt-2 text-[13px] leading-5 text-ink-2">{item.assumption}</p>
                      <p className="mt-1 text-[12px] leading-5 text-ink-4">Test: {item.test}</p>
                    </div>
                  ))}
                </div>
              </DetailPanel>
            </aside>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button variant="ghost" onClick={() => f.setProjectStage("decide")}>
            <ArrowLeft className="size-3.5" />
            Back to decision
          </Button>
          <Button
            variant="primary"
            disabled={f.generating}
            onClick={() => conv.prototype ? f.setProjectStage("prototype") : f.buildPrototype()}
          >
            {f.generating ? "Building prototype…" : conv.prototype ? "Open working prototype" : "Build working prototype"}
            {!f.generating && <ArrowRight className="size-3.5" />}
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}

function ViewTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg px-3 py-1.5 text-[12px] font-medium transition " +
        (active ? "bg-raised text-ink shadow-sm" : "text-ink-4 hover:text-ink")
      }
    >
      {label}
    </button>
  );
}

function BriefSignal({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "spark" | "molten" | "temper";
}) {
  const toneClass = tone === "spark"
    ? "bg-spark"
    : tone === "molten"
      ? "bg-molten"
      : "bg-temper";

  return (
    <div className="rounded-[20px] border border-line-strong bg-raised p-4">
      <div className="flex items-center gap-2">
        <span className={"size-1.5 rounded-full " + toneClass} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">{label}</p>
      </div>
      <p className="mt-3 text-[15px] font-medium text-ink">{value}</p>
      <p className="mt-1 text-[12px] leading-5 text-ink-4">{detail}</p>
    </div>
  );
}

function DetailPanel({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "scorch" | "molten";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-line-strong bg-raised p-4">
      <div className={"flex items-center gap-2 " + (tone === "scorch" ? "text-scorch" : "text-molten")}>
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">{title}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
