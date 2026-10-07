import { ArrowUp, CornerDownLeft } from "lucide-react";
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
      <div className="group overflow-hidden rounded-[22px] border border-line-strong bg-raised shadow-[var(--shadow-float)] transition-all duration-200 focus-within:border-spark/35 focus-within:shadow-[0_24px_70px_-42px_var(--spark)]">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Start with the messy version</span>
          <span className="text-[11px] text-ink-4">No template required</span>
        </div>
        <textarea
          autoFocus={autoFocus}
          rows={5}
          value={f.composer}
          onChange={(event) => f.setComposer(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe the idea, paste rough notes, customer feedback, or the solution already in your head…"
          className="min-h-[148px] w-full resize-none bg-transparent px-5 pb-3 pt-4 text-[16px] leading-7 text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-4 pb-3">
          <span className="hidden items-center gap-1.5 text-[11px] text-ink-4 sm:flex">
            <CornerDownLeft className="size-3" />
            Enter to shape · Shift + Enter for a new line
          </span>
          <button
            type="submit"
            disabled={!f.composer.trim() || f.generating}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl bg-ink px-3.5 text-[13px] font-medium text-canvas transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-md enabled:active:translate-y-0 disabled:opacity-30"
            aria-label="Start shaping this idea"
          >
            Shape this idea
            <ArrowUp className="size-3.5 transition-transform group-focus-within:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </form>
  );
}
