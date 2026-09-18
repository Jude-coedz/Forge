import { useEffect, useState } from "react";
import { Menu, Moon, Sparkles, Sun } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Welcome } from "../chat/Welcome";
import { GuidedProject } from "../flow/GuidedProject";
import { Button } from "../ui/primitives";
import { CopilotPanel } from "../workspace/CopilotPanel";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const f = useForge();
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    // Opening Forge should always start from Home. Saved projects remain available,
    // but restoring one is an explicit user action.
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

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-canvas px-3 sm:px-4">
      <Button
        size="icon"
        variant="ghost"
        className="md:hidden"
        onClick={() => f.setSidebarOpen(true)}
        aria-label="Open projects"
      >
        <Menu className="size-4" />
      </Button>

      <div className="min-w-0 flex-1">
        {f.conv ? (
          <div className="flex min-w-0 items-center gap-2 text-[13px] text-ink-4">
            <button type="button" onClick={f.newProject} className="transition hover:text-ink">
              Forge
            </button>
            <span>/</span>
            <span className="truncate font-medium text-ink-2">{f.conv.title}</span>
          </div>
        ) : (
          <span className="text-[13px] font-medium text-ink-2">Forge</span>
        )}
      </div>

      {f.conv && (
        <Button variant="secondary" size="sm" onClick={onOpenCopilot}>
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline">Ask Forge</span>
        </Button>
      )}

      <Button size="icon" variant="ghost" onClick={f.toggleTheme} aria-label="Toggle appearance">
        {f.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useForge();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[360px] max-w-[calc(100%-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className={
            "pointer-events-auto rounded-xl border bg-raised px-4 py-3 text-left shadow-[var(--shadow-toast)] " +
            (toast.tone === "success"
              ? "border-temper/40"
              : toast.tone === "warn"
                ? "border-molten/40"
                : toast.tone === "danger"
                  ? "border-scorch/40"
                  : "border-line")
          }
        >
          <p className="text-[14px] font-medium">{toast.title}</p>
          {toast.body && <p className="mt-0.5 text-[13px] leading-5 text-ink-3">{toast.body}</p>}
        </button>
      ))}
    </div>
  );
}
