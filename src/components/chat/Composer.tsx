import { ArrowUp, Mic, Paperclip } from "lucide-react";
import { type FormEvent, type KeyboardEvent, type ReactNode } from "react";
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
      <div
        className={cn(
          "rounded-2xl border border-line-strong bg-raised shadow-[var(--shadow-float)]",
          large && "rounded-3xl",
        )}
      >
        <textarea
          autoFocus={autoFocus}
          rows={large ? 4 : 2}
          value={f.composer}
          onChange={(e) => f.setComposer(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Paste notes, a transcript, or a WhatsApp thread…"
          className={cn(
            "w-full resize-none bg-transparent px-4 pt-3 text-[15px] outline-none placeholder:text-ink-4",
            large ? "min-h-[96px]" : "min-h-[52px]",
          )}
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex gap-0.5">
            <IconHint
              label="Attach"
              onClick={() => f.later("File upload")}
            >
              <Paperclip className="size-4" />
            </IconHint>
            <IconHint label="Voice" onClick={() => f.later("Voice capture")}>
              <Mic className="size-4" />
            </IconHint>
          </div>
          <button
            type="submit"
            disabled={!f.composer.trim() || f.generating}
            className="grid size-8 place-items-center rounded-full bg-spark text-white disabled:opacity-30"
            aria-label="Send"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </form>
  );
}

function IconHint({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={`${label} — later`}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg text-ink-4 hover:bg-inset hover:text-ink"
    >
      {children}
    </button>
  );
}
