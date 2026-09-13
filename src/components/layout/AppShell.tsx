import { useEffect, useState } from "react";
import { Menu, Moon, Sparkles, Sun } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Welcome } from "../chat/Welcome";
import { GuidedProject } from "../flow/GuidedProject";
import { SettingsView } from "../pages/SettingsView";
import { Button } from "../ui/primitives";
import { CopilotPanel } from "../workspace/CopilotPanel";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const f = useForge();
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    // A fresh visit should always feel like opening Forge, not reopening stale work.
    // Saved projects stay in the sidebar and are restored only when the user chooses one.
    localStorage.removeItem("forge-active-v2");
    localStorage.removeItem("forge-active");
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
          {f.screen === "settings" ? (
            <SettingsView />
          ) : !f.conv ? (
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
  const title = f.screen === "settings" ? "Settings" : f.conv?.title;

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-canvas px-2.5 sm:px-3.5">
      <Button size="icon" variant="ghost" className="md:hidden" onClick={() => f.setSidebarOpen(true)} aria-label="Open sidebar">
        <Menu className="size-4" />
      </Button>
      <div className="min-w-0 flex-1">
        {title ? (
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-ink-4">
            <button type="button" onClick={f.newProject} className="hover:text-ink">Forge</button>
            <span>/</span>
            <span className="truncate text-ink-2">{title}</span>
          </div>
        ) : (
          <span className="text-[11px] font-medium text-ink-3">Forge</span>
        )}
      </div>
      {f.conv && f.screen !== "settings" && (
        <Button variant="secondary" size="sm" onClick={onOpenCopilot} title="Open Forge Copilot">
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline">Ask Forge</span>
        </Button>
      )}
      <Button size="icon" variant="ghost" onClick={f.toggleTheme} aria-label="Toggle theme" title="Toggle appearance">
        {f.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useForge();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-80 max-w-[calc(100%-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={`pointer-events-auto rounded-xl border bg-raised px-3 py-2 text-left shadow-[var(--shadow-toast)] ${
            t.tone === "success" ? "border-temper/40" : t.tone === "warn" ? "border-molten/40" : t.tone === "danger" ? "border-scorch/40" : "border-line"
          }`}
        >
          <p className="text-[13px] font-medium">{t.title}</p>
          {t.body && <p className="text-[12px] text-ink-3">{t.body}</p>}
        </button>
      ))}
    </div>
  );
}
