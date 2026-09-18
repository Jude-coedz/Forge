import { Check } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import type { ProjectStage } from "../../types";
import { BuildBriefScreen } from "./BuildBriefScreen";
import { ChallengeScreen } from "./ChallengeScreen";
import { DecideScreen } from "./DecideScreen";
import { FrameScreen } from "./FrameScreen";
import { HandoffScreen } from "./HandoffScreen";

const steps: Array<{ id: ProjectStage; label: string }> = [
  { id: "frame", label: "Frame" },
  { id: "challenge", label: "Challenge" },
  { id: "decide", label: "Decide" },
  { id: "brief", label: "Build brief" },
  { id: "handoff", label: "Handoff" },
];

export function GuidedProject({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv;
  if (!conv) return null;

  const currentIndex = steps.findIndex((item) => item.id === conv.stage);

  const available = (stage: ProjectStage) => {
    if (stage === "frame" || stage === "challenge") return true;
    if (stage === "decide") return conv.theses.length > 0;
    return Boolean(conv.spec);
  };

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto w-full max-w-[1040px] px-5 py-7 sm:px-8 lg:px-12 lg:py-9">
        <header className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-ink-4">Project</p>
              <h1 className="mt-1 truncate font-display text-[24px] font-semibold tracking-tight sm:text-[28px]">
                {conv.title}
              </h1>
            </div>
            <p className="pt-1 text-[13px] text-ink-4">
              {conv.spec ? "Build brief ready" : "Shaping product"}
            </p>
          </div>

          <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line pb-3" aria-label="Product workflow">
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
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition " +
                    (isActive
                      ? "bg-inset font-medium text-ink"
                      : canOpen
                        ? "text-ink-3 hover:bg-inset/70 hover:text-ink"
                        : "cursor-default text-ink-4/40")
                  }
                >
                  <span
                    className={
                      "grid size-5 place-items-center rounded-full text-[10px] " +
                      (completed
                        ? "bg-temper text-white"
                        : isActive
                          ? "bg-ink text-canvas"
                          : "border border-current/30")
                    }
                  >
                    {completed ? <Check className="size-3" /> : index + 1}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        {conv.stage === "frame" && <FrameScreen onOpenCopilot={onOpenCopilot} />}
        {conv.stage === "challenge" && <ChallengeScreen onOpenCopilot={onOpenCopilot} />}
        {conv.stage === "decide" && <DecideScreen onOpenCopilot={onOpenCopilot} />}
        {conv.stage === "brief" && <BuildBriefScreen onOpenCopilot={onOpenCopilot} />}
        {conv.stage === "handoff" && <HandoffScreen />}
      </div>
    </main>
  );
}
