import { useState } from "react";
import {
  Check, FileText, MoreHorizontal,
  PanelLeftClose, PanelLeftOpen, Pencil, Plus, Trash2, X,
} from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { ForgeMark } from "../ui/primitives";

export function Sidebar() {
  const f = useForge();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const collapsed = f.sidebarCollapsed;
  const projects = [...f.conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const beginRename = (id: string, title: string) => {
    setEditingId(id);
    setDraft(title);
    setMenuId(null);
  };

  const saveRename = () => {
    if (editingId && draft.trim()) f.renameConversation(editingId, draft);
    setEditingId(null);
    setDraft("");
  };

  return (
    <>
      {f.sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[4px] md:hidden"
          type="button"
          aria-label="Close projects"
          onClick={() => f.setSidebarOpen(false)}
        />
      )}

      <aside
        aria-label="Projects"
        className={
          "fixed inset-y-0 left-0 z-40 flex w-[270px] shrink-0 flex-col overflow-visible border-r border-line bg-canvas transition-[width,transform] duration-200 md:static md:z-0 md:translate-x-0 " +
          (f.sidebarOpen ? "translate-x-0 " : "-translate-x-full ") +
          (collapsed ? "md:w-[70px]" : "md:w-[250px]")
        }
      >
        <header className={"flex h-[58px] shrink-0 items-center " + (collapsed ? "justify-between px-3.5 md:justify-center md:px-2" : "justify-between px-4")}>
          <button
            type="button"
            onClick={f.newProject}
            aria-label="Forge home"
            title="Forge home"
            className="flex items-center gap-3 rounded-xl text-left focus-visible:outline-offset-4"
          >
            <ForgeMark className="size-8 shrink-0" />
            <span className={"text-[16px] font-normal tracking-[-0.02em] text-white " + (collapsed ? "md:hidden" : "")}>Forge</span>
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-inset hover:text-white md:hidden"
            onClick={() => f.setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="px-2 pt-4">
          <button
            type="button"
            onClick={() => { f.newProject(); setMenuId(null); }}
            title="New idea"
            aria-label="New idea"
            className={"flex h-10 w-full items-center rounded-full border border-line-strong text-[13px] text-ink-2 transition hover:border-ink-3 hover:bg-inset hover:text-white " +
              (collapsed ? "justify-center px-2" : "gap-3 px-4")}
          >
            <Plus className="size-4 shrink-0" />
            <span className={collapsed ? "md:hidden" : ""}>New idea</span>
          </button>
        </div>

        <div className="mt-8 min-h-0 flex-1 overflow-y-auto px-2 scrollbar-thin">
          <p className={"forge-eyebrow px-3 pb-3 text-ink-4 " + (collapsed ? "md:sr-only" : "")}>Projects</p>
          {projects.length === 0 && (
            <p className={"px-3 text-[12px] leading-6 text-ink-4 " + (collapsed ? "md:hidden" : "")}>
              The ideas you've tested will appear here.
            </p>
          )}

          <div className="space-y-1">
            {projects.map((project) => {
              const active = f.activeId === project.id;
              const editing = editingId === project.id;
              return (
                <div key={project.id} className="group relative">
                  <div
                    className={
                      "flex min-h-[42px] items-center gap-2 rounded-lg transition-colors " +
                      (active ? "bg-inset text-white" : "text-ink-3 hover:bg-inset/70 hover:text-white")
                    }
                  >
                    {editing ? (
                      <form className="flex min-w-0 flex-1 items-center gap-1 px-2" onSubmit={(event) => { event.preventDefault(); saveRename(); }}>
                        <input
                          autoFocus
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => { if (event.key === "Escape") setEditingId(null); }}
                          className="min-w-0 flex-1 rounded-xl border border-line-strong bg-raised px-2 py-1.5 text-[13px]"
                        />
                        <button type="submit" aria-label="Save name"><Check className="size-4" /></button>
                        <button type="button" aria-label="Cancel" onClick={() => setEditingId(null)}><X className="size-4" /></button>
                      </form>
                    ) : (
                      <>
                        <button
                          type="button"
                          title={project.title}
                          aria-label={"Open " + project.title}
                          onClick={() => { f.openConversation(project.id); setMenuId(null); }}
                          className={"flex min-w-0 flex-1 items-center gap-3 py-2 text-left text-[13px] " + (collapsed ? "justify-center px-2" : "px-3")}
                        >
                          <FileText className={"size-4 shrink-0 " + (active ? "text-white" : "text-ink-4")} />
                          <span className={"truncate " + (collapsed ? "md:hidden" : "")}>{project.title}</span>
                        </button>
                        <button
                          type="button"
                          aria-label={"Options for " + project.title}
                          onClick={() => setMenuId(menuId === project.id ? null : project.id)}
                          className={"mr-1 grid size-7 shrink-0 place-items-center rounded-lg text-ink-4 opacity-0 transition hover:bg-raised hover:text-white group-hover:opacity-100 focus:opacity-100 " + (collapsed ? "md:hidden" : "")}
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {menuId === project.id && !editing && (
                    <div className="absolute right-1 top-11 z-50 w-52 rounded-2xl border border-line-strong bg-[#222630] p-2 shadow-[0_18px_54px_rgba(0,0,0,.48)]">
                      {confirmId === project.id ? (
                        <div className="p-2">
                          <p className="text-[13px] text-ink-2">Delete this idea and all saved work?</p>
                          <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => setConfirmId(null)} className="rounded-full border border-line-strong px-3 py-1.5 text-[12px] text-ink-2">Cancel</button>
                            <button type="button" onClick={() => { f.deleteConversation(project.id); setMenuId(null); setConfirmId(null); }} className="rounded-full bg-white px-3 py-1.5 text-[12px] text-black">Delete</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button type="button" onClick={() => beginRename(project.id, project.title)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] text-ink-2 hover:bg-inset"><Pencil className="size-3.5" /> Rename</button>
                          <button type="button" onClick={() => setConfirmId(project.id)} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[13px] text-scorch hover:bg-inset"><Trash2 className="size-3.5" /> Delete</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-line p-2">
          <button
            type="button"
            onClick={() => f.setSidebarCollapsed(!collapsed)}
            className={"hidden h-10 w-full items-center rounded-full text-[13px] text-ink-3 transition hover:bg-inset hover:text-white md:flex " +
              (collapsed ? "justify-center" : "gap-3 px-3")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
