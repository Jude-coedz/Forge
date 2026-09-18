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
      <div className="rounded-2xl border border-line-strong bg-raised shadow-[var(--shadow-float)] transition-colors focus-within:border-ink-4/60">
        <textarea
          autoFocus={autoFocus}
          rows={5}
          value={f.composer}
          onChange={(event) => f.setComposer(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe the rough idea in your own words. You can paste notes, customer feedback, or the solution you already have in mind…"
          className="min-h-[132px] w-full resize-none bg-transparent px-5 pt-4 text-[15px] leading-6 outline-none placeholder:text-ink-4 focus-visible:outline-none"
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-[12px] text-ink-4">Enter to start · Shift + Enter for a new line</span>
          <button
            type="submit"
            disabled={!f.composer.trim() || f.generating}
            className="grid size-9 place-items-center rounded-lg bg-ink text-canvas outline-none disabled:opacity-30"
            aria-label="Start shaping this idea"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
