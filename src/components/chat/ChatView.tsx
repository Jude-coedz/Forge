import { useEffect, useRef } from "react";
import { useForge } from "../../store/ForgeContext";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { StageGuide } from "./StageGuide";
import { Welcome } from "./Welcome";

export function ChatView() {
  const f = useForge();
  const bottom = useRef<HTMLDivElement>(null);
  const empty = !f.conv || f.conv.messages.length === 0;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [f.conv?.messages, f.generating]);

  if (empty) return <Welcome />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StageGuide />
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <MessageList messages={f.conv!.messages} />
        <div ref={bottom} />
      </div>
      <div className="border-t border-line bg-canvas/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-2xl">
          <Composer />
          <p className="mt-2 text-center text-[11px] text-ink-4">
            Answer naturally. Forge updates the decision brief and tells you when there is enough signal to move forward.
          </p>
        </div>
      </div>
    </div>
  );
}
