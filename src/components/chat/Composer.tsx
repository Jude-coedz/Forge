import { ArrowUp } from "lucide-react";
import { type FormEvent, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn";
import { useForge } from "../../store/ForgeContext";

export function Composer({ autoFocus, large }: { autoFocus?: boolean; large?: boolean }) {
  const f = useForge();

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    f.sendChat();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      f.sendChat();
    }
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className={cn(
        "rounded-xl border border-line-strong bg-raised shadow-[var(--shadow-float)] transition-colors focus-within:border-ink-4/50",
        large && "rounded-2xl",
      )}>
        {!large && <p className="px-4 pt-3 text-[11px] font-medium text-ink-4">{composerLabel(f.conv?.phase)}</p>}
        <textarea
          autoFocus={autoFocus}
          rows={large ? 4 : 2}
          value={f.composer}
          onChange={(e) => f.setComposer(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={composerPlaceholder(f.conv?.phase, large)}
          className={cn(
            "w-full resize-none bg-transparent px-4 text-[14px] leading-6 outline-none focus:outline-none focus-visible:outline-none placeholder:text-ink-4",
            large ? "min-h-[96px] pt-3" : "min-h-[52px] pt-1.5",
          )}
        />
        <div className="flex items-center justify-between px-3 pb-2.5">
          <span className="text-[10px] text-ink-4">Enter to send · Shift+Enter for a new line</span>
          <button
            type="submit"
            disabled={!f.composer.trim() || f.generating}
            className="grid size-8 place-items-center rounded-lg bg-ink text-canvas outline-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-line-strong focus-visible:ring-offset-2 focus-visible:ring-offset-raised"
            aria-label="Send message"
            title={f.generating ? "Forge is still thinking" : "Send to Forge"}
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </form>
  );
}

function composerLabel(phase?: string) {
  if (phase === "position") return "Challenge the options or add your own direction";
  if (phase === "spec") return "Refine a requirement, risk, metric, or assumption";
  if (phase === "prototype") return "Give feedback on the workflow being tested";
  if (phase === "eval") return "Inspect a failed check or change the product decision";
  return "Add evidence, answer Forge, or correct the product model";
}

function composerPlaceholder(phase?: string, large?: boolean) {
  if (large) return "Describe the messy idea, paste notes, or explain what you are trying to build…";
  if (phase === "position") return "e.g. I think this should sit beside WhatsApp because…";
  if (phase === "spec") return "e.g. This requirement assumes photographers will change their workflow…";
  if (phase === "prototype") return "e.g. This step would never happen before the client confirms…";
  if (phase === "eval") return "e.g. Why did this requirement fail, and what should change?";
  return "Add evidence, correct an assumption, or ask Forge to challenge the model…";
}
