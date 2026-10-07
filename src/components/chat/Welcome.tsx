import { FileText, Lightbulb, Search } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Composer } from "./Composer";

const starters = [
  {
    icon: Lightbulb,
    label: "I have a rough idea",
    prompt: "I have a rough product idea. Here is what I am thinking: ",
  },
  {
    icon: Search,
    label: "Challenge a solution",
    prompt: "I already have a solution in mind, but I want you to challenge whether it is the right product: ",
  },
  {
    icon: FileText,
    label: "Use notes or research",
    prompt: "I have context already. Help me turn it into a defensible product direction without inventing certainty: ",
  },
];

export function Welcome() {
  const f = useForge();

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto flex w-full max-w-[820px] flex-col justify-center px-5 py-12 sm:px-8 lg:py-16">
        <section className="forge-enter">
          <h1 className="max-w-[760px] text-[38px] font-medium leading-[1.08] tracking-[-0.04em] text-ink sm:text-[48px]">
            What are you thinking about building?
          </h1>
          <p className="mt-4 max-w-[680px] text-[16px] leading-7 text-ink-3">
            Describe it however it exists in your head. Forge will separate what you know from what you are assuming, challenge the weak parts, and help you decide what is worth building.
          </p>

          <div className="mt-8">
            <Composer autoFocus />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-2 gap-y-2">
            {starters.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => f.setComposer(prompt)}
                className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-ink-4 transition hover:bg-inset hover:text-ink-2"
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {f.conversations.length > 0 && (
            <p className="mt-10 text-[12px] leading-5 text-ink-4">
              Previous projects stay in the sidebar. Starting here always gives you a clean thinking surface.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
