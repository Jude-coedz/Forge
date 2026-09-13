import { Menu, Moon, PanelRight, Sun } from "lucide-react";
import { cn } from "../../lib/cn";
import { useForge } from "../../store/ForgeContext";
import { ArtifactPane } from "../artifacts/ArtifactPane";
import { ChatView } from "../chat/ChatView";
import { SettingsView } from "../pages/SettingsView";
import { Button } from "../ui/primitives";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const f = useForge();

  return (
    <div className={f.theme === "dark" ? "dark" : ""}>
      <div className="relative flex h-dvh overflow-hidden bg-canvas text-ink">
        <div className="grain pointer-events-none absolute inset-0 opacity-50" />
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar />
          {f.screen === "settings" ? (
            <SettingsView />
          ) : (
            <div className="flex min-h-0 flex-1">
              <ChatView />
              <ArtifactPane />
            </div>
          )}
        </div>
        <Toasts />
      </div>
    </div>
  );
}

function TopBar() {
  const f = useForge();
  const title = f.screen === "settings" ? "Settings" : f.conv?.title ?? "Forge";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-2 sm:px-3">
      <Button size="icon" variant="ghost" className="md:hidden" onClick={() => f.setSidebarOpen(true)} aria-label="Open sidebar">
        <Menu className="size-4" />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{title}</p>
      </div>
      <Button size="icon" variant="ghost" onClick={f.toggleTheme} aria-label="Toggle theme">
        {f.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      {f.conv?.artifact && (
        <Button
          size="icon"
          variant="ghost"
          className={cn(f.artifactOpen && "bg-inset")}
          onClick={() => f.setArtifactOpen(!f.artifactOpen)}
          aria-label="Toggle artifact"
          title="Open the current product artifact"
        >
          <PanelRight className="size-4" />
        </Button>
      )}
    </header>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useForge();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100%-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={cn(
            "pointer-events-auto rounded-xl border bg-raised px-3 py-2 text-left shadow-[var(--shadow-toast)]",
            t.tone === "success" && "border-temper/40",
            t.tone === "warn" && "border-molten/40",
            t.tone === "danger" && "border-scorch/40",
            t.tone === "default" && "border-line",
          )}
        >
          <p className="text-[13px] font-medium">{t.title}</p>
          {t.body && <p className="text-[12px] text-ink-3">{t.body}</p>}
        </button>
      ))}
    </div>
  );
}
