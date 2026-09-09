import { MessageSquarePlus, PanelLeft, Settings, SquarePen } from "lucide-react";
import { cn } from "../../lib/cn";
import { useForge } from "../../store/ForgeContext";
import { Button, ForgeMark } from "../ui/primitives";

export function Sidebar() {
  const f = useForge();
  const recents = f.conversations.filter((c) => c.messages.length > 0 || c.phase !== "idle");

  return (
    <>
      {f.sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Close sidebar"
          onClick={() => f.setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-canvas/95 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-[width,transform] duration-200 ease-out md:static md:z-0 md:translate-x-0",
          f.sidebarCollapsed ? "md:w-[72px]" : "md:w-[272px]",
          f.sidebarOpen ? "w-[272px] translate-x-0" : "w-[272px] -translate-x-full md:translate-x-0",
        )}
      >
        <div className={cn("flex items-center gap-2 px-3 pb-3 pt-1", f.sidebarCollapsed && "md:justify-center")}>
          <ForgeMark />
          <div className={cn("min-w-0", f.sidebarCollapsed && "md:hidden")}>
            <div className="font-display text-[16px] font-bold leading-none">Forge</div>
            <div className="mt-0.5 text-[10px] text-ink-4">For solo builders</div>
          </div>
        </div>

        <div className="px-2">
          <Button
            className={cn("w-full justify-start", f.sidebarCollapsed && "md:justify-center md:px-0")}
            onClick={f.newProject}
          >
            <SquarePen className="size-4" />
            <span className={cn(f.sidebarCollapsed && "md:hidden")}>New project</span>
          </Button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 scrollbar-thin">
          <p className={cn("px-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-ink-4", f.sidebarCollapsed && "md:hidden")}>
            Recents
          </p>
          {recents.length === 0 && (
            <p className={cn("px-2 text-[12px] text-ink-4", f.sidebarCollapsed && "md:hidden")}>
              Projects you start will land here.
            </p>
          )}
          <div className="space-y-0.5">
            {recents.map((c) => {
              const on = f.activeId === c.id && f.screen === "chat";
              return (
                <button
                  key={c.id}
                  onClick={() => f.openConversation(c.id)}
                  title={c.title}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] transition-colors",
                    on ? "bg-spark-soft text-ink" : "text-ink-3 hover:bg-inset hover:text-ink",
                    f.sidebarCollapsed && "md:justify-center",
                  )}
                >
                  <MessageSquarePlus className="size-4 shrink-0 text-ink-4" />
                  <span className={cn("truncate", f.sidebarCollapsed && "md:hidden")}>{c.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-0.5 px-2">
          <button
            onClick={() => f.setSidebarCollapsed(!f.sidebarCollapsed)}
            className="hidden w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-ink-3 hover:bg-inset hover:text-ink md:flex"
          >
            <PanelLeft className="size-4" />
            <span className={cn(f.sidebarCollapsed && "md:hidden")}>Collapse</span>
          </button>
          <button
            onClick={() => f.setScreen("settings")}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] hover:bg-inset",
              f.screen === "settings" ? "bg-spark-soft text-ink" : "text-ink-3 hover:text-ink",
              f.sidebarCollapsed && "md:justify-center",
            )}
          >
            <Settings className="size-4" />
            <span className={cn(f.sidebarCollapsed && "md:hidden")}>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
