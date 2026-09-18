import { FileText, Lightbulb, Search } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { ForgeMark } from "../ui/primitives";
import { Composer } from "./Composer";

const starters = [
  {
    icon: Lightbulb,
    label: "Shape a rough idea",
    prompt: "I have a rough product idea. Here is what I have noticed: ",
  },
  {
    icon: Search,
    label: "Pressure-test a solution",
    prompt: "I think I want to build this, but I want Forge to challenge whether it is the right product before I commit: ",
  },
  {
    icon: FileText,
    label: "Use research or notes",
    prompt: "Here is the product context I already have. Help me turn it into a clear product direction and build brief: ",
  },
];

export function Welcome() {
  const f = useForge();

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-surface px-4 py-12 scrollbar-thin sm:py-16">
      <div className="mx-auto flex w-full max-w-[760px] flex-col justify-center">
        <div className="mb-8">
          <ForgeMark className="size-10" />
          <h1 className="mt-5 max-w-2xl font-display text-[36px] font-semibold leading-[1.08] tracking-tight text-balance sm:text-[48px]">
            Figure out what to build before you start building.
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-ink-3">
            Bring the unfinished version. Forge frames the problem, challenges what matters, compares product directions, and leaves you with a focused build brief.
          </p>
        </div>

        <Composer autoFocus />

        <div className="mt-5 flex flex-wrap gap-2">
          {starters.map(({ icon: Icon, label, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => f.setComposer(prompt)}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-raised px-3 py-2 text-[13px] text-ink-3 transition hover:border-line-strong hover:text-ink"
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {f.conversations.length > 0 && (
          <p className="mt-8 text-[13px] leading-5 text-ink-4">
            Saved projects are in the sidebar. Forge always opens here so old work never looks like the current session.
          </p>
        )}
      </div>
    </div>
  );
}
