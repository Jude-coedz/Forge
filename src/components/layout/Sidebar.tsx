import { useState } from "react";
import { Check, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useForge } from "../../store/ForgeContext";
import { ForgeMark } from "../ui/primitives";
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
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] md:hidden"
          aria-label="Close projects"
          onClick={() => f.setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-canvas transition-transform duration-200 md:static md:z-0 md:translate-x-0",
          f.sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center px-4">
          <button
            type="button"
            onClick={f.newProject}
            className="flex items-center gap-2.5 rounded-lg text-left"
            aria-label="Forge home"
          >
            <ForgeMark className="size-7" />
            <span className="text-[15px] font-normal tracking-[-0.02em] text-ink">Forge</span>
          </button>
        </div>

        <div className="px-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              f.newProject();
              setMenuId(null);
            }}
            className="flex h-9 w-full items-center gap-2 rounded-full px-3 text-[14px] font-normal text-ink-2 transition hover:bg-inset hover:text-ink"
          >
            <Plus className="size-4" />
            New idea
          </button>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-2.5 scrollbar-thin">
          <p className="px-2.5 pb-2 text-[12px] font-medium text-ink-4">Projects</p>

          {projects.length === 0 && (
            <p className="px-2.5 text-[12px] leading-5 text-ink-4">
              Your product thinking will stay here as you work.
            </p>
          )}

          <div className="space-y-0.5">
            {projects.map((project) => {
              const active = f.activeId === project.id;
              const editing = editingId === project.id;

              return (
                <div key={project.id} className="group relative">
                  <div
                    className={cn(
                      "flex min-h-[40px] w-full items-center gap-2 rounded-lg px-3 text-left transition",
                      active ? "bg-inset text-ink" : "text-ink-3 hover:bg-inset/70 hover:text-ink",
                    )}
                  >
                    <span className={"size-1.5 shrink-0 rounded-full " + statusTone(project)} />

                    {editing ? (
                      <form
                        className="flex min-w-0 flex-1 items-center gap-1"
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
                          className="min-w-0 flex-1 rounded-md border border-line-strong bg-raised px-2 py-1 text-[12px] outline-none"
                        />
                        <button type="submit" className="grid size-7 place-items-center rounded-md hover:bg-raised" aria-label="Save name">
                          <Check className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="grid size-7 place-items-center rounded-md hover:bg-raised" aria-label="Cancel rename">
                          <X className="size-3.5" />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-[14px] font-medium"
                        onClick={() => {
                          f.openConversation(project.id);
                          setMenuId(null);
                        }}
                        title={project.title}
                      >
                        {project.title}
                      </button>
                    )}

                    {!editing && (
                      <button
                        type="button"
                        onClick={() => setMenuId(menuId === project.id ? null : project.id)}
                        className="grid size-7 shrink-0 place-items-center rounded-md text-ink-4 opacity-0 transition hover:bg-raised hover:text-ink group-hover:opacity-100 focus:opacity-100"
                        aria-label={"Project options for " + project.title}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    )}
                  </div>

                  {menuId === project.id && !editing && (
                    <div className="absolute right-1 top-10 z-50 w-44 rounded-xl border border-line bg-raised p-1.5 shadow-[var(--shadow-toast)]">
                      {confirmDeleteId === project.id ? (
                        <div className="p-2">
                          <p className="text-[12px] text-ink-3">Delete this project?</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="flex-1 rounded-md border border-line px-2 py-1.5 text-[11px] text-ink-3 hover:bg-inset"
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
                              className="flex-1 rounded-md bg-scorch px-2 py-1.5 text-[11px] text-white"
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

      </aside>
    </>
  );
}

function statusTone(project: Conversation) {
  if (project.prototype) return "bg-temper";
  if (project.spec) return "bg-spark";
  if (project.theses.length > 0) return "bg-molten";
  return "bg-ink-4";
}
