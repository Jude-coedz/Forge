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
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-label="Close projects"
          onClick={() => f.setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-canvas transition-[width,transform] duration-200 md:static md:z-0 md:translate-x-0",
          f.sidebarCollapsed ? "md:w-[68px]" : "md:w-[256px]",
          f.sidebarOpen ? "w-[256px] translate-x-0" : "w-[256px] -translate-x-full md:translate-x-0",
        )}
      >
        <div className={cn("flex h-12 items-center gap-2 px-3", f.sidebarCollapsed && "md:justify-center")}>
          <button
            type="button"
            onClick={f.newProject}
            className="flex items-center gap-2 rounded-lg text-left focus-visible:outline-none"
            aria-label="Forge home"
          >
            <ForgeMark />
            <div className={cn("min-w-0", f.sidebarCollapsed && "md:hidden")}>
              <div className="font-display text-[16px] font-semibold leading-none">Forge</div>
              <div className="mt-1 text-[12px] text-ink-4">Pre-build product copilot</div>
            </div>
          </button>
        </div>

        <div className="px-2 pt-2">
          <Button
            className={cn("w-full justify-start", f.sidebarCollapsed && "md:justify-center md:px-0")}
            onClick={() => {
              f.newProject();
              setMenuId(null);
            }}
          >
            <Plus className="size-4" />
            <span className={cn(f.sidebarCollapsed && "md:hidden")}>New idea</span>
          </Button>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-2 scrollbar-thin">
          <p
            className={cn(
              "px-2 pb-2 text-[12px] font-medium text-ink-4",
              f.sidebarCollapsed && "md:hidden",
            )}
          >
            Projects
          </p>

          {projects.length === 0 && (
            <p className={cn("px-2 text-[13px] leading-5 text-ink-4", f.sidebarCollapsed && "md:hidden")}>
              Projects appear here after you start shaping an idea.
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
                      "flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] transition-colors",
                      active ? "bg-inset text-ink" : "text-ink-3 hover:bg-inset/70 hover:text-ink",
                      f.sidebarCollapsed && "md:justify-center",
                    )}
                  >
                    <FileText className="size-4 shrink-0 text-ink-4" />

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
                          className="min-w-0 flex-1 rounded-md border border-line-strong bg-raised px-2 py-1 text-[13px] outline-none"
                        />
                        <button type="submit" className="grid size-7 place-items-center rounded hover:bg-inset" aria-label="Save name">
                          <Check className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="grid size-7 place-items-center rounded hover:bg-inset" aria-label="Cancel rename">
                          <X className="size-3.5" />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className={cn("min-w-0 flex-1 truncate text-left", f.sidebarCollapsed && "md:hidden")}
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
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-md text-ink-4 hover:bg-raised hover:text-ink",
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
                    <div className="absolute right-1 top-9 z-50 w-44 rounded-xl border border-line bg-raised p-1.5 shadow-[var(--shadow-toast)]">
                      {confirmDeleteId === project.id ? (
                        <div className="p-2">
                          <p className="text-[13px] text-ink-3">Delete this project?</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="flex-1 rounded-md border border-line px-2 py-1.5 text-[12px] text-ink-3 hover:bg-inset"
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
                              className="flex-1 rounded-md bg-scorch px-2 py-1.5 text-[12px] text-white"
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
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-ink-2 hover:bg-inset"
                          >
                            <Pencil className="size-3.5" />
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(project.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-scorch hover:bg-scorch-soft"
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
            className="hidden w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-ink-3 hover:bg-inset hover:text-ink md:flex"
          >
            <PanelLeft className="size-4" />
            <span className={cn(f.sidebarCollapsed && "md:hidden")}>Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
