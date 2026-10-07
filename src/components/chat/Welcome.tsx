import { FileText, Lightbulb, Search } from "lucide-react";
import { useState } from "react";
import { Composer } from "./Composer";

type StartMode = "idea" | "problem" | "context";

const modes: Array<{
  id: StartMode;
  icon: typeof Lightbulb;
  label: string;
  description: string;
  heading: string;
  placeholder: string;
  helper: string;
}> = [
  {
    id: "idea",
    icon: Lightbulb,
    label: "I have an idea",
    description: "You know roughly what you want to build.",
    heading: "What are you thinking about building?",
    placeholder: "For example: I keep seeing small teams lose the reasoning behind decisions once the person who made them leaves…",
    helper: "A sentence is enough. It does not need to sound like a product pitch.",
  },
  {
    id: "problem",
    icon: Search,
    label: "I noticed a problem",
    description: "Start from something frustrating or inefficient.",
    heading: "What happened that made you think something should exist?",
    placeholder: "Describe the situation in your own words: who was involved, what they were trying to do, and what felt broken…",
    helper: "Start with what happened. Forge will help separate the problem from the solution.",
  },
  {
    id: "context",
    icon: FileText,
    label: "I already have context",
    description: "Bring notes, research, feedback, or an AI conversation.",
    heading: "Already did some thinking somewhere else?",
    placeholder: "Paste the notes, interview excerpts, competitor research, or context from ChatGPT, Claude, Gemini, Notion, Slack, or a document…",
    helper: "Paste it as-is. Forge will pull out evidence, assumptions, and unresolved decisions.",
  },
];

export function Welcome() {
  const [mode, setMode] = useState<StartMode>("idea");
  const active = modes.find((item) => item.id === mode) ?? modes[0];

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto flex w-full max-w-[920px] flex-col justify-center px-5 py-12 sm:px-8 lg:py-16">
        <section className="forge-enter">
          <div className="max-w-[760px]">
            <p className="text-[13px] font-medium text-spark">Validate before you build</p>
            <h1 className="mt-3 text-[40px] font-medium leading-[1.06] tracking-[-0.045em] text-ink sm:text-[52px]">
              {active.heading}
            </h1>
            <p className="mt-4 max-w-[700px] text-[16px] leading-7 text-ink-3">
              Forge helps turn an early thought into a defensible product direction, then into something you can actually test.
            </p>
          </div>

          <div className="mt-7 grid gap-2 sm:grid-cols-3">
            {modes.map(({ id, icon: Icon, label, description }) => {
              const selected = id === mode;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={
                    "group rounded-[14px] border px-4 py-3.5 text-left transition-all duration-150 " +
                    (selected
                      ? "border-line-strong bg-raised shadow-[var(--shadow-soft)]"
                      : "border-transparent bg-transparent hover:border-line hover:bg-raised/60")
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className={
                      "grid size-7 place-items-center rounded-lg " +
                      (selected ? "bg-spark-soft text-spark" : "bg-inset text-ink-4 group-hover:text-ink-2")
                    }>
                      <Icon className="size-3.5" />
                    </span>
                    <span className="text-[13px] font-medium text-ink">{label}</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-ink-4">{description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <Composer
              autoFocus
              placeholder={active.placeholder}
              helper={active.helper}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-4">
            <span>Forge will not make you fill out a PM template.</span>
            <span className="hidden sm:inline">•</span>
            <span>Unknowns stay explicit instead of becoming fake certainty.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
