import { useState } from "react";
import { Composer } from "./Composer";

type StartMode = "idea" | "problem" | "context";

const modes: Array<{
  id: StartMode;
  label: string;
  placeholder: string;
  helper: string;
}> = [
  {
    id: "idea",
    label: "Idea",
    placeholder: "Tell Forge the idea as it exists in your head. One sentence is enough…",
    helper: "No pitch required. Forge will help figure out who it is for, what problem it solves, and what is still assumed.",
  },
  {
    id: "problem",
    label: "Problem",
    placeholder: "Describe something frustrating, slow, expensive, confusing, or broken that you have noticed…",
    helper: "Start with what happened. Forge will help separate the problem from the solution.",
  },
  {
    id: "context",
    label: "Research or AI context",
    placeholder: "Paste notes, customer feedback, research, competitor observations, or a conversation from ChatGPT, Claude, Gemini, Notion, or Slack…",
    helper: "Paste it as-is. Forge will extract the useful evidence, assumptions, and unresolved decisions.",
  },
];

export function Welcome() {
  const [mode, setMode] = useState<StartMode>("idea");
  const active = modes.find((item) => item.id === mode) ?? modes[0];

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto flex w-full max-w-[860px] flex-col justify-center px-5 py-12 sm:px-8 lg:py-16">
        <section className="forge-enter">
          <div className="max-w-[760px]">
            <h1 className="text-[40px] font-medium leading-[1.06] tracking-[-0.045em] text-ink sm:text-[52px]">
              Turn an idea into something worth testing.
            </h1>
            <p className="mt-4 max-w-[700px] text-[16px] leading-7 text-ink-3">
              Forge helps you sharpen the problem, expose assumptions, compare product directions, and turn the strongest one into a working prototype.
            </p>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-inset/75 p-1 sm:w-fit">
              {modes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={
                    "shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition " +
                    (item.id === mode
                      ? "bg-raised text-ink shadow-sm"
                      : "text-ink-4 hover:text-ink-2")
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Composer
              autoFocus
              placeholder={active.placeholder}
              helper={active.helper}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
