import { Menu } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Welcome } from "../chat/Welcome";
import { DecisionWorkbench } from "../workbench/DecisionWorkbench";
import { Button } from "../ui/primitives";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const f = useForge();


  return (
    <div className="dark">
      <div className="relative flex h-dvh overflow-hidden bg-canvas text-ink">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar />
          {!f.conv ? <Welcome /> : <DecisionWorkbench />}
        </div>
        <Toasts />
      </div>
    </div>
  );
}

function TopBar() {
  const f = useForge();

  return (
    <header className="relative z-20 flex h-[58px] shrink-0 items-center gap-2 border-b border-line bg-canvas px-3 sm:px-6">
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
          <span className="block truncate text-[14px] font-normal text-ink-2">{f.conv.title}</span>
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
