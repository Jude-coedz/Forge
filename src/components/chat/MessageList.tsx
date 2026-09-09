import { AppWindow, FileText, Lock, PanelsTopLeft } from "lucide-react";
import { cn } from "../../lib/cn";
import { clock } from "../../lib/id";
import { useForge } from "../../store/ForgeContext";
import { Prose } from "../ui/primitives";
import type { ArtifactKind, ChatMessage } from "../../types";

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
      {messages.map((m) => (
        <Message key={m.id} message={m} />
      ))}
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const f = useForge();
  const isUser = message.role === "user";

  return (
    <article className="flex gap-3">
      <div
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
          isUser ? "bg-inset text-ink-2" : "bg-spark-soft text-spark",
        )}
      >
        {isUser ? "Y" : "F"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-[13px] font-medium">{isUser ? "You" : "Forge"}</span>
          <span className="text-[11px] text-ink-4">{clock(message.createdAt)}</span>
        </div>
        {isUser ? (
          <p className="whitespace-pre-wrap text-pretty text-[15px] leading-7 text-ink">{message.text}</p>
        ) : message.streaming && !message.text ? (
          <p className="text-[13px] text-ink-4">Reading the source…</p>
        ) : (
          <Prose text={message.text} />
        )}
        {message.artifact && !message.streaming && (
          <button
            onClick={() => f.openArtifact(message.artifact as ArtifactKind)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-[12px] text-ink-2 hover:bg-surface"
          >
            {message.artifact === "brief" && <FileText className="size-3.5 text-spark" />}
            {message.artifact === "thesis" && <Lock className="size-3.5 text-molten" />}
            {message.artifact === "spec" && <PanelsTopLeft className="size-3.5 text-temper" />}
            {message.artifact === "prototype" && <AppWindow className="size-3.5 text-temper" />}
            Open {message.artifact === "thesis" ? "positioning" : message.artifact === "prototype" ? "prototype preview" : message.artifact}
          </button>
        )}
        {f.generating && message.streaming && (
          <span className="mt-2 inline-block h-3 w-1.5 animate-pulse bg-spark" />
        )}
      </div>
    </article>
  );
}
