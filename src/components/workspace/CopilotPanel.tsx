import { useEffect, useRef } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { clock } from "../../lib/id";

export function CopilotPanel() {
  const f = useForge();
  const bottom = useRef<HTMLDivElement>(null);
  const conv = f.conv;
  if (!conv) return null;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conv.messages, f.generating]);

  return (
    <aside className="hidden min-h-0 w-[390px] shrink-0 flex-col border-l border-line bg-canvas lg:flex">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-spark-soft text-spark"><Sparkles className="size-3.5" /></span>
          <div>
            <p className="text-[12px] font-medium">Forge Copilot</p>
            <p className="text-[10px] text-ink-4">Updates the product model as you work</p>
          </div>
        </div>
        {f.generating && <span className="text-[10px] text-ink-4">Reasoning…</span>}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        <div className="space-y-5">
          {conv.messages.map((message) => {
            const user = message.role === "user";
            return (
              <div key={message.id} className={user ? "pl-6" : "pr-4"}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-medium text-ink-4">{user ? "You" : "Forge"}</span>
                  <span className="text-[9px] text-ink-4/70">{clock(message.createdAt)}</span>
                </div>
                <div className={user ? "rounded-xl bg-inset px-3 py-2.5" : ""}>
                  {message.streaming && !message.text ? (
                    <div className="flex items-center gap-1.5 py-2 text-[12px] text-ink-4">
                      <span className="size-1.5 animate-pulse rounded-full bg-spark" />
                      <span className="size-1.5 animate-pulse rounded-full bg-spark [animation-delay:120ms]" />
                      <span className="size-1.5 animate-pulse rounded-full bg-spark [animation-delay:240ms]" />
                    </div>
                  ) : (
                    <p className={`whitespace-pre-wrap text-[12.5px] leading-5 ${user ? "text-ink-2" : "text-ink"}`}>{message.text}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottom} />
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-canvas p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <QuickPrompt label="Challenge the model" prompt="Challenge the current product model. What assumption or decision is most likely to be wrong, and why?" />
          <QuickPrompt label="What should I validate?" prompt="What is the highest-risk assumption right now? If I cannot answer it directly, turn it into a practical validation task." />
        </div>
        <div className="rounded-xl border border-line-strong bg-raised p-2 focus-within:border-spark/40">
          <textarea
            value={f.composer}
            onChange={(e) => f.setComposer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                f.sendChat();
              }
            }}
            rows={3}
            placeholder="Ask Forge, add evidence, or correct the model…"
            className="w-full resize-none bg-transparent px-1 text-[12.5px] leading-5 text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none"
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-[9px] text-ink-4">Shift + Enter for a new line</p>
            <button
              onClick={() => f.sendChat()}
              disabled={!f.composer.trim() || f.generating}
              className="grid size-7 place-items-center rounded-lg bg-ink text-canvas disabled:opacity-30"
              aria-label="Send"
            >
              <ArrowUp className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function QuickPrompt({ label, prompt }: { label: string; prompt: string }) {
  const f = useForge();
  return (
    <button
      type="button"
      onClick={() => f.setComposer(prompt)}
      className="rounded-md border border-line bg-raised px-2 py-1 text-[10px] text-ink-3 hover:border-line-strong hover:text-ink"
    >
      {label}
    </button>
  );
}
