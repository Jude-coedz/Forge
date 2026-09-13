import { FileText, Lightbulb, Search } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { ForgeMark } from "../ui/primitives";
import { Composer } from "./Composer";

const starters = [
  {
    icon: Lightbulb,
    title: "Shape a messy idea",
    body: "Start before you know what the product is.",
    prompt: "I have a rough product idea. Here is what I have noticed: ",
  },
  {
    icon: Search,
    title: "Pressure-test an idea",
    body: "Challenge a solution before you commit to it.",
    prompt: "I think I want to build this, but I want Forge to challenge the idea before I commit: ",
  },
  {
    icon: FileText,
    title: "Turn context into a build brief",
    body: "Bring research, notes or customer feedback.",
    prompt: "Here is the product context I already have. Help me turn it into a clear product direction and build brief: ",
  },
];

export function Welcome() {
  const f = useForge();

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-surface px-4 py-10 scrollbar-thin sm:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col justify-center">
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center"><ForgeMark className="size-9" /></div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-[38px]">Turn a messy idea into something worth building.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-pretty text-ink-3">
            Forge helps you frame the problem, challenge the assumptions that matter, choose a product direction, and leave with a build-ready brief.
          </p>
        </div>

        <Composer large autoFocus />

        <div className="mt-5 grid gap-2 md:grid-cols-3">
          {starters.map(({ icon: Icon, title, body, prompt }) => (
            <button
              key={title}
              type="button"
              onClick={() => f.setComposer(prompt)}
              className="group rounded-xl border border-line bg-raised p-4 text-left transition hover:border-line-strong hover:bg-canvas"
            >
              <div className="mb-3 grid size-7 place-items-center rounded-md bg-inset text-ink-3"><Icon className="size-3.5" /></div>
              <p className="text-[12px] font-medium">{title}</p>
              <p className="mt-1 text-[11px] leading-4 text-ink-4">{body}</p>
            </button>
          ))}
        </div>

        <p className="mt-7 text-center text-[10px] text-ink-4">Forge starts fresh every time you open it. Saved projects stay in the sidebar until you choose one.</p>
      </div>
    </div>
  );
}
