import { Menu, Moon, PanelRight, Sun } from "lucide-react";
import { cn } from "../../lib/cn";
import { useForge } from "../../store/ForgeContext";
import { ArtifactDrawer } from "../artifacts/ArtifactDrawer";
import { Welcome } from "../chat/Welcome";
import { SettingsView } from "../pages/SettingsView";
import { Button } from "../ui/primitives";
import { CopilotPanel } from "../workspace/CopilotPanel";
import { ProductWorkspace } from "../workspace/ProductWorkspace";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const f = useForge();

  return (
    <div className={f.theme === "dark" ? "dark" : ""}>
      <div className="relative flex h-dvh overflow-hidden bg-canvas text-ink">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar />
          {f.screen === "settings" ? (
            <SettingsView />
          ) : !f.conv ? (
            <Welcome />
          ) : (
            <div className="flex min-h-0 flex-1">
              <ProductWorkspace />
              <CopilotPanel />
              <ArtifactDrawer />
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
  const title = f.screen === "settings" ? "Settings" : f.conv?.title;

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-canvas px-2.5 sm:px-3.5">
      <Button size="icon" variant="ghost" className="md:hidden" onClick={() => f.setSidebarOpen(true)} aria-label="Open sidebar">
        <Menu className="size-4" />
      </Button>
      <div className="min-w-0 flex-1">
        {title ? (
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-ink-4">
            <span>{f.screen === "settings" ? "Forge" : "Projects"}</span>
            <span>/</span>
            <span className="truncate text-ink-2">{title}</span>
          </div>
        ) : (
          <span className="text-[11px] text-ink-4">Forge</span>
        )}
      </div>
      <Button size="icon" variant="ghost" onClick={f.toggleTheme} aria-label="Toggle theme" title="Toggle appearance">
        {f.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      {f.conv?.artifact && (
        <Button
          size="icon"
          variant="ghost"
          className={cn(f.artifactOpen && "bg-inset")}
          onClick={() => f.setArtifactOpen(!f.artifactOpen)}
          aria-label="Toggle output"
          title="Open current build output"
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
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-80 max-w-[calc(100%-2rem)] flex-col gap-2">
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
