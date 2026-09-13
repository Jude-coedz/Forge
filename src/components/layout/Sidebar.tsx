import { useState } from "react";
import { Check, MessageSquarePlus, MoreHorizontal, PanelLeft, Pencil, Settings, SquarePen, Trash2, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useForge } from "../../store/ForgeContext";
import { Button, ForgeMark } from "../ui/primitives";

export function Sidebar() {
  const f = useForge();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const recents = [...f.conversations]
    .filter((c) => c.messages.length > 0 || c.phase !== "idle")
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const beginRename = (id: string, title: string) => {
    setEditingId(id);
    setDraftTitle(title);
    setMenuId(null);
  };

  const saveRename = () => {
    if (editingId && draftTitle.trim()) f.renameConversation(editingId, draftTitle);
    setEditingId(null);
    setDraftTitle("");
  };

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
            <div className="mt-0.5 text-[10px] text-ink-4">AI builder copilot</div>
          </div>
        </div>

        <div className="px-2">
          <Button
            className={cn("w-full justify-start", f.sidebarCollapsed && "md:justify-center md:px-0")}
            onClick={() => {
              f.newProject();
              setMenuId(null);
            }}
          >
            <SquarePen className="size-4" />
            <span className={cn(f.sidebarCollapsed && "md:hidden")}>New project</span>
          </Button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 scrollbar-thin">
          <p className={cn("px-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-ink-4", f.sidebarCollapsed && "md:hidden")}>
            Projects
          </p>
          {recents.length === 0 && (
            <p className={cn("px-2 text-[12px] leading-5 text-ink-4", f.sidebarCollapsed && "md:hidden")}>
              Your projects will appear here after you start working.
            </p>
          )}
          <div className="space-y-0.5">
            {recents.map((c) => {
              const on = f.activeId === c.id && f.screen === "chat";
              const editing = editingId === c.id;
              return (
                <div key={c.id} className="group relative">
                  <div
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors",
                      on ? "bg-spark-soft text-ink" : "text-ink-3 hover:bg-inset hover:text-ink",
                      f.sidebarCollapsed && "md:justify-center",
                    )}
                  >
                    <MessageSquarePlus className="size-4 shrink-0 text-ink-4" />
                    {editing ? (
                      <form
                        className={cn("flex min-w-0 flex-1 items-center gap-1", f.sidebarCollapsed && "md:hidden")}
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveRename();
                        }}
                      >
                        <input
                          autoFocus
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="min-w-0 flex-1 rounded-md border border-line-strong bg-raised px-2 py-1 text-[12px] outline-none focus:border-spark/60"
                        />
                        <button type="submit" className="grid size-6 place-items-center rounded hover:bg-inset" aria-label="Save name"><Check className="size-3.5" /></button>
                        <button type="button" onClick={() => setEditingId(null)} className="grid size-6 place-items-center rounded hover:bg-inset" aria-label="Cancel rename"><X className="size-3.5" /></button>
                      </form>
                    ) : (
                      <button
                        className={cn("min-w-0 flex-1 truncate text-left", f.sidebarCollapsed && "md:hidden")}
                        onClick={() => {
                          f.openConversation(c.id);
                          setMenuId(null);
                        }}
                        title={c.title}
                      >
                        {c.title}
                      </button>
                    )}
                    {!editing && (
                      <button
                        onClick={() => setMenuId(menuId === c.id ? null : c.id)}
                        className={cn("grid size-7 shrink-0 place-items-center rounded-md text-ink-4 hover:bg-raised hover:text-ink", f.sidebarCollapsed ? "md:hidden" : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100")}
                        aria-label={`Project options for ${c.title}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    )}
                  </div>

                  {menuId === c.id && !editing && (
                    <div className="absolute right-1 top-9 z-50 w-40 rounded-xl border border-line bg-raised p-1.5 shadow-[var(--shadow-toast)]">
                      {confirmDeleteId === c.id ? (
                        <div className="p-1.5">
                          <p className="text-[11px] text-ink-3">Delete this project?</p>
                          <div className="mt-2 flex gap-1.5">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-md border border-line px-2 py-1 text-[11px] text-ink-3 hover:bg-inset">Cancel</button>
                            <button
                              onClick={() => {
                                f.deleteConversation(c.id);
                                setMenuId(null);
                                setConfirmDeleteId(null);
                              }}
                              className="flex-1 rounded-md bg-scorch px-2 py-1 text-[11px] text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => beginRename(c.id, c.title)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-ink-2 hover:bg-inset"><Pencil className="size-3.5" />Rename</button>
                          <button onClick={() => setConfirmDeleteId(c.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-scorch hover:bg-scorch-soft"><Trash2 className="size-3.5" />Delete</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
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
