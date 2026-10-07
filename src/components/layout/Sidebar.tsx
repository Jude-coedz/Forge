import { useState } from "react";
import {
  Check,
  FileText,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { useForge } from "../../store/ForgeContext";
import { Button, ForgeMark } from "../ui/primitives";
import type { Conversation } from "../../types";

export function Sidebar() {
  const f = useForge();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const projects = [...f.conversations].sort((a, b) => b.updatedAt - a.updatedAt);

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
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] md:hidden"
          aria-label="Close projects"
          onClick={() => f.setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-canvas transition-[width,transform] duration-200 md:static md:z-0 md:translate-x-0",
          f.sidebarCollapsed ? "md:w-[72px]" : "md:w-[268px]",
          f.sidebarOpen ? "w-[268px] translate-x-0" : "w-[268px] -translate-x-full md:translate-x-0",
        )}
      >
        <div className={cn("flex h-[54px] items-center gap-2 px-3", f.sidebarCollapsed && "md:justify-center")}>
          <button
            type="button"
            onClick={f.newProject}
            className="flex items-center gap-2.5 rounded-xl text-left focus-visible:outline-none"
            aria-label="Forge home"
          >
            <ForgeMark className="size-8" />
            <div className={cn("min-w-0", f.sidebarCollapsed && "md:hidden")}>
              <div className="font-display text-[15px] font-semibold leading-none tracking-[-0.02em]">Forge</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-4">Product decisions</div>
            </div>
          </button>
        </div>

        <div className="px-2 pt-2">
          <Button
            className={cn("w-full justify-start rounded-xl", f.sidebarCollapsed && "md:justify-center md:px-0")}
            onClick={() => {
              f.newProject();
              setMenuId(null);
            }}
          >
            <Plus className="size-4" />
            <span className={cn(f.sidebarCollapsed && "md:hidden")}>New product idea</span>
          </Button>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-2 scrollbar-thin">
          <div className={cn("mb-2 flex items-center justify-between px-2", f.sidebarCollapsed && "md:hidden")}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4">Projects</p>
            {projects.length > 0 && <span className="font-mono text-[10px] text-ink-4">{projects.length}</span>}
          </div>

          {projects.length === 0 && (
            <div className={cn("mx-1 rounded-xl border border-dashed border-line-strong p-3", f.sidebarCollapsed && "md:hidden")}>
              <p className="text-[12px] leading-5 text-ink-4">
                Saved decisions will appear here after you start shaping an idea.
              </p>
            </div>
          )}

          <div className="space-y-1">
            {projects.map((project) => {
              const active = f.activeId === project.id;
              const editing = editingId === project.id;

              return (
                <div key={project.id} className="group relative">
                  <div
                    className={cn(
                      "flex min-h-[44px] w-full items-center gap-2 rounded-xl border px-2 text-left text-[13px] transition-all duration-150",
                      active
                        ? "border-line-strong bg-raised text-ink shadow-sm"
                        : "border-transparent text-ink-3 hover:border-line hover:bg-raised/70 hover:text-ink",
                      f.sidebarCollapsed && "md:justify-center",
                    )}
                  >
                    <span className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-lg",
                      active ? "bg-spark-soft text-spark" : "bg-inset text-ink-4",
                    )}>
                      <FileText className="size-3.5" />
                    </span>

                    {editing ? (
                      <form
                        className={cn("flex min-w-0 flex-1 items-center gap-1", f.sidebarCollapsed && "md:hidden")}
                        onSubmit={(event) => {
                          event.preventDefault();
                          saveRename();
                        }}
                      >
                        <input
                          autoFocus
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setEditingId(null);
                          }}
                          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-canvas px-2 py-1 text-[12px] outline-none"
                        />
                        <button type="submit" className="grid size-7 place-items-center rounded-lg hover:bg-inset" aria-label="Save name">
                          <Check className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="grid size-7 place-items-center rounded-lg hover:bg-inset" aria-label="Cancel rename">
                          <X className="size-3.5" />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className={cn("min-w-0 flex-1 text-left", f.sidebarCollapsed && "md:hidden")}
                        onClick={() => {
                          f.openConversation(project.id);
                          setMenuId(null);
                        }}
                        title={project.title}
                      >
                        <span className="block truncate text-[12px] font-medium">{project.title}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-4">
                          <span className={"size-1.5 rounded-full " + statusTone(project)} />
                          {statusLabel(project)}
                        </span>
                      </button>
                    )}

                    {!editing && (
                      <button
                        type="button"
                        onClick={() => setMenuId(menuId === project.id ? null : project.id)}
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-lg text-ink-4 transition hover:bg-inset hover:text-ink",
                          f.sidebarCollapsed
                            ? "md:hidden"
                            : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100",
                        )}
                        aria-label={"Project options for " + project.title}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    )}
                  </div>

                  {menuId === project.id && !editing && (
                    <div className="absolute right-1 top-11 z-50 w-44 rounded-[14px] border border-line bg-raised p-1.5 shadow-[var(--shadow-toast)]">
                      {confirmDeleteId === project.id ? (
                        <div className="p-2">
                          <p className="text-[12px] text-ink-3">Delete this product decision?</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="flex-1 rounded-lg border border-line px-2 py-1.5 text-[11px] text-ink-3 hover:bg-inset"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                f.deleteConversation(project.id);
                                setMenuId(null);
                                setConfirmDeleteId(null);
                              }}
                              className="flex-1 rounded-lg bg-scorch px-2 py-1.5 text-[11px] text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => beginRename(project.id, project.title)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[12px] text-ink-2 hover:bg-inset"
                          >
                            <Pencil className="size-3.5" />
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(project.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[12px] text-scorch hover:bg-scorch-soft"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={() => f.setSidebarCollapsed(!f.sidebarCollapsed)}
            className="hidden w-full items-center gap-2 rounded-xl px-2 py-2 text-[12px] text-ink-4 transition hover:bg-inset hover:text-ink md:flex"
          >
            <PanelLeft className="size-4" />
            <span className={cn(f.sidebarCollapsed && "md:hidden")}>Collapse sidebar</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function statusLabel(project: Conversation) {
  if (project.prototype) return "Prototype ready";
  if (project.spec) return "V1 locked";
  if (project.theses.length > 0) return "Choosing direction";
  if (project.productModel.summary || project.productModel.opportunity) return "Framing";
  return "Started";
}

function statusTone(project: Conversation) {
  if (project.prototype) return "bg-temper";
  if (project.spec) return "bg-spark";
  if (project.theses.length > 0) return "bg-molten";
  return "bg-ink-4";
}
