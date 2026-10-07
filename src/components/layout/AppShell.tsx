import { useEffect } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Welcome } from "../chat/Welcome";
import { ForgeWorkspace } from "../workspace/ForgeWorkspace";
import { Button } from "../ui/primitives";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const f = useForge();

  useEffect(() => {
    f.newProject();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) f.newProject();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [f.newProject]);

  return (
    <div className={f.theme === "dark" ? "dark" : ""}>
      <div className="relative flex h-dvh overflow-hidden bg-canvas text-ink">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar />
          {!f.conv ? <Welcome /> : <ForgeWorkspace />}
        </div>
        <Toasts />
      </div>
    </div>
  );
}

function TopBar() {
  const f = useForge();

  return (
    <header className="relative z-20 flex h-[52px] shrink-0 items-center gap-2 border-b border-line bg-canvas/92 px-3 backdrop-blur-xl sm:px-4">
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
          <span className="block truncate text-[14px] font-medium text-ink-2">{f.conv.title}</span>
        ) : (
          <span className="text-[14px] text-ink-4">New idea</span>
        )}
      </div>

      {f.generating && (
        <span className="hidden items-center gap-2 text-[12px] text-ink-4 sm:flex">
          <span className="forge-thinking-dot size-1.5 rounded-full bg-spark" />
          Thinking
        </span>
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
            "forge-enter pointer-events-auto rounded-[14px] border bg-raised px-4 py-3 text-left shadow-[var(--shadow-toast)] " +
            (toast.tone === "success"
              ? "border-temper/30"
              : toast.tone === "warn"
                ? "border-molten/30"
                : toast.tone === "danger"
                  ? "border-scorch/30"
                  : "border-line")
          }
        >
          <p className="text-[13px] font-medium">{toast.title}</p>
          {toast.body && <p className="mt-1 text-[12px] leading-5 text-ink-3">{toast.body}</p>}
        </button>
      ))}
    </div>
  );
}
