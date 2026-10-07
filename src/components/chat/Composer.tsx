import { ArrowUp } from "lucide-react";
import { type FormEvent, type KeyboardEvent } from "react";
import { useForge } from "../../store/ForgeContext";

export function Composer({ autoFocus }: { autoFocus?: boolean }) {
  const f = useForge();

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    f.sendChat();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      f.sendChat();
    }
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="group rounded-[18px] border border-line-strong bg-raised p-2.5 shadow-[var(--shadow-soft)] transition focus-within:border-spark/35 focus-within:shadow-[var(--shadow-focus)]">
        <textarea
          autoFocus={autoFocus}
          rows={5}
          value={f.composer}
          onChange={(event) => f.setComposer(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe the idea, paste notes, customer feedback, or context from another AI conversation…"
          className="min-h-[138px] w-full resize-none bg-transparent px-2.5 py-2 text-[16px] leading-7 text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
          <span className="text-[11px] text-ink-4">Enter to send · Shift + Enter for a new line</span>
          <button
            type="submit"
            disabled={!f.composer.trim() || f.generating}
            className="grid size-9 place-items-center rounded-xl bg-ink text-canvas transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-sm disabled:opacity-30"
            aria-label="Send to Forge"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
