import { useEffect, useRef } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { clock } from "../../lib/id";
import { Button } from "../ui/primitives";

export function CopilotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const f = useForge();
  const bottom = useRef<HTMLDivElement>(null);
  const conv = f.conv;

  useEffect(() => {
    if (!open) return;
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conv?.messages, f.generating, open]);

  if (!open || !conv) return null;

  return (
    <>
      <button
        className="fixed inset-0 z-[60] bg-black/25"
        aria-label="Close Forge"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[440px] flex-col border-l border-line bg-canvas shadow-[var(--shadow-float)]">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-inset text-ink-2">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-[14px] font-medium">Ask Forge</p>
              <p className="text-[12px] text-ink-4">Correct, challenge, or add context</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {f.generating && <span className="mr-2 text-[12px] text-ink-4">Thinking…</span>}
            <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close Forge">
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
          {conv.messages.length === 0 ? (
            <p className="text-[14px] leading-6 text-ink-4">
              Use this when Forge has misunderstood something or you want to add evidence. You do not need to chat to complete the workflow.
            </p>
          ) : (
            <div className="space-y-6">
              {conv.messages.map((message) => {
                const user = message.role === "user";
                return (
                  <div key={message.id} className={user ? "pl-8" : "pr-4"}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-[12px] font-medium text-ink-4">{user ? "You" : "Forge"}</span>
                      <span className="text-[11px] text-ink-4/70">{clock(message.createdAt)}</span>
                    </div>
                    <div className={user ? "rounded-xl bg-inset px-3.5 py-3" : ""}>
                      <p className={"whitespace-pre-wrap text-[14px] leading-6 " + (user ? "text-ink-2" : "text-ink")}>
                        {message.text}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottom} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-canvas p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            <QuickPrompt
              label="Challenge this"
              prompt="Challenge the current product thinking. What is most likely to be wrong, and what would materially change the product if it is?"
            />
            <QuickPrompt
              label="What am I assuming?"
              prompt="What important assumption am I currently treating too confidently? Only raise it if it could change what gets built."
            />
          </div>

          <div className="rounded-xl border border-line-strong bg-raised p-2.5 focus-within:border-ink-4">
            <textarea
              value={f.composer}
              onChange={(event) => f.setComposer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  f.sendChat();
                }
              }}
              rows={3}
              placeholder="Correct Forge, add evidence, or ask a product question…"
              className="w-full resize-none bg-transparent px-1 text-[14px] leading-6 text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[12px] text-ink-4">Shift + Enter for a new line</p>
              <button
                type="button"
                onClick={() => f.sendChat()}
                disabled={!f.composer.trim() || f.generating}
                className="grid size-8 place-items-center rounded-lg bg-ink text-canvas disabled:opacity-30"
                aria-label="Send to Forge"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function QuickPrompt({ label, prompt }: { label: string; prompt: string }) {
  const f = useForge();

  return (
    <button
      type="button"
      onClick={() => f.setComposer(prompt)}
      className="rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[12px] text-ink-3 hover:border-line-strong hover:text-ink"
    >
      {label}
    </button>
  );
}
