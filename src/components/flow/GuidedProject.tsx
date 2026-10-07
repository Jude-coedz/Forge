import { Check } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import type { ProjectStage } from "../../types";
import { BuildBriefScreen } from "./BuildBriefScreen";
import { ChallengeScreen } from "./ChallengeScreen";
import { DecideScreen } from "./DecideScreen";
import { FrameScreen } from "./FrameScreen";
import { HandoffScreen } from "./HandoffScreen";
import { PrototypeScreen } from "./PrototypeScreen";

const steps: Array<{ id: ProjectStage; label: string; short: string }> = [
  { id: "frame", label: "Frame", short: "Understand" },
  { id: "challenge", label: "Challenge", short: "Pressure-test" },
  { id: "decide", label: "Decide", short: "Choose" },
  { id: "brief", label: "Build brief", short: "Commit" },
  { id: "prototype", label: "Prototype", short: "Use it" },
  { id: "handoff", label: "Handoff", short: "Build" },
];

export function GuidedProject({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv;
  if (!conv) return null;

  const currentIndex = steps.findIndex((item) => item.id === conv.stage);

  const available = (stage: ProjectStage) => {
    if (stage === "frame" || stage === "challenge") return true;
    if (stage === "decide") return conv.theses.length > 0;
    if (stage === "brief" || stage === "prototype") return Boolean(conv.spec);
    return Boolean(conv.prototype);
  };

  const status = conv.prototype
    ? "Prototype ready"
    : conv.spec
      ? "V1 locked"
      : conv.theses.length
        ? "Directions ready"
        : "Shaping product";

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto w-full max-w-[1220px] px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
        <header className="mb-10 rounded-[24px] border border-line bg-raised/70 p-4 shadow-[0_1px_0_rgba(255,255,255,.5)_inset] backdrop-blur sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Product decision</p>
              <h1 className="mt-1 truncate font-display text-[22px] font-semibold tracking-[-0.025em] sm:text-[25px]">
                {conv.title}
              </h1>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-[12px] font-medium text-ink-3">
              <span className={"size-1.5 rounded-full " + (conv.prototype ? "bg-temper" : conv.spec ? "bg-spark" : "bg-molten")} />
              {status}
            </span>
          </div>

          <nav className="mt-5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6" aria-label="Product workflow">
            {steps.map((item, index) => {
              const isActive = item.id === conv.stage;
              const canOpen = available(item.id);
              const completed = index < currentIndex && canOpen;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!canOpen}
                  onClick={() => f.setProjectStage(item.id)}
                  className={
                    "group relative flex min-h-[58px] items-center gap-2.5 rounded-xl border px-3 text-left transition-all duration-200 " +
                    (isActive
                      ? "border-spark/25 bg-spark-soft text-ink shadow-[0_8px_28px_-22px_var(--spark)]"
                      : canOpen
                        ? "border-transparent bg-canvas/70 text-ink-3 hover:border-line hover:bg-canvas hover:text-ink"
                        : "cursor-default border-transparent bg-transparent text-ink-4/40")
                  }
                >
                  <span
                    className={
                      "grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-semibold transition " +
                      (completed
                        ? "bg-temper-soft text-temper"
                        : isActive
                          ? "bg-spark text-white"
                          : "border border-line bg-raised text-ink-4")
                    }
                  >
                    {completed ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{item.label}</span>
                    <span className="mt-0.5 hidden text-[11px] text-ink-4 xl:block">{item.short}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </header>

        {conv.stage === "frame" && <FrameScreen onOpenCopilot={onOpenCopilot} />}
        {conv.stage === "challenge" && <ChallengeScreen onOpenCopilot={onOpenCopilot} />}
        {conv.stage === "decide" && <DecideScreen onOpenCopilot={onOpenCopilot} />}
        {conv.stage === "brief" && <BuildBriefScreen onOpenCopilot={onOpenCopilot} />}
        {conv.stage === "prototype" && <PrototypeScreen />}
        {conv.stage === "handoff" && <HandoffScreen />}
      </div>
    </main>
  );
}
