import { useEffect, useState } from "react";
import { Menu, Moon, Sparkles, Sun } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import type { ProjectStage } from "../../types";
import { Welcome } from "../chat/Welcome";
import { GuidedProject } from "../flow/GuidedProject";
import { Button } from "../ui/primitives";
import { CopilotPanel } from "../workspace/CopilotPanel";
import { Sidebar } from "./Sidebar";

const stageLabels: Record<ProjectStage, string> = {
  frame: "Framing",
  challenge: "Challenging",
  decide: "Deciding",
  brief: "Build brief",
  prototype: "Prototype",
  handoff: "Handoff",
};

export function AppShell() {
  const f = useForge();
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    f.newProject();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      f.newProject();
      setCopilotOpen(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [f.newProject]);

  useEffect(() => {
    setCopilotOpen(false);
  }, [f.activeId]);

  return (
    <div className={f.theme === "dark" ? "dark" : ""}>
      <div className="relative flex h-dvh overflow-hidden bg-canvas text-ink">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar onOpenCopilot={() => setCopilotOpen(true)} />
          {!f.conv ? (
            <Welcome />
          ) : (
            <GuidedProject onOpenCopilot={() => setCopilotOpen(true)} />
          )}
        </div>
        <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
        <Toasts />
      </div>
    </div>
  );
}

function TopBar({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const stage = f.conv ? stageLabels[f.conv.stage] : null;

  return (
    <header className="relative z-20 flex h-[54px] shrink-0 items-center gap-2 border-b border-line bg-canvas/90 px-3 backdrop-blur-xl sm:px-4">
      <Button
        size="icon"
        variant="ghost"
        className="md:hidden"
        onClick={() => f.setSidebarOpen(true)}
        aria-label="Open projects"
      >
        <Menu className="size-4" />
      </Button>

      <div className="min-w-0 flex flex-1 items-center gap-2">
        {f.conv ? (
          <>
            <button
              type="button"
              onClick={f.newProject}
              className="shrink-0 rounded-lg px-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-4 transition hover:text-ink"
            >
              Forge
            </button>
            <span className="text-ink-4/50">/</span>
            <span className="min-w-0 truncate text-[13px] font-medium text-ink-2">{f.conv.title}</span>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-spark" />
              {stage}
            </span>
          </>
        ) : (
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-4">New product decision</span>
        )}
      </div>

      {f.conv && (
        <Button variant="secondary" size="sm" onClick={onOpenCopilot} className="rounded-xl">
          <Sparkles className="size-3.5 text-spark" />
          <span className="hidden sm:inline">Work with Forge</span>
        </Button>
      )}

      <Button size="icon" variant="ghost" onClick={f.toggleTheme} aria-label="Toggle appearance" className="rounded-xl">
        {f.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useForge();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[380px] max-w-[calc(100%-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className={
            "forge-enter pointer-events-auto rounded-[16px] border bg-raised px-4 py-3 text-left shadow-[var(--shadow-toast)] " +
            (toast.tone === "success"
              ? "border-temper/30"
              : toast.tone === "warn"
                ? "border-molten/30"
                : toast.tone === "danger"
                  ? "border-scorch/30"
                  : "border-line")
          }
        >
          <div className="flex items-start gap-3">
            <span className={
              "mt-1.5 size-1.5 shrink-0 rounded-full " +
              (toast.tone === "success"
                ? "bg-temper"
                : toast.tone === "warn"
                  ? "bg-molten"
                  : toast.tone === "danger"
                    ? "bg-scorch"
                    : "bg-spark")
            } />
            <div>
              <p className="text-[13px] font-medium">{toast.title}</p>
              {toast.body && <p className="mt-0.5 text-[12px] leading-5 text-ink-3">{toast.body}</p>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
