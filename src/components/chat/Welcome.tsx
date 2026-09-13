import { FileText, Lightbulb, Search, Sparkles } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { ForgeMark } from "../ui/primitives";
import { Composer } from "./Composer";

const starters = [
  {
    icon: Lightbulb,
    title: "Shape a messy idea",
    body: "Start with the rough thought. Forge will build a product model from it instead of rushing to features.",
    prompt: "I have a messy product idea. Here is what I have noticed: ",
  },
  {
    icon: Search,
    title: "Pressure-test a direction",
    body: "Bring the solution you already have in mind and make Forge challenge the assumptions behind it.",
    prompt: "I am considering building this product, but I want to pressure-test the direction before I commit: ",
  },
  {
    icon: FileText,
    title: "Turn context into a build plan",
    body: "Paste research, notes, feedback, or requirements. Forge will trace decisions into a spec and prototype.",
    prompt: "Here is the product context I have so far. Build a product model, surface the decisions, and help me turn it into a focused V1: ",
  },
];

export function Welcome() {
  const f = useForge();

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-surface px-4 py-10 scrollbar-thin">
      <div className="mx-auto flex w-full max-w-[860px] flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center"><ForgeMark className="size-9" /></div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-[40px] sm:leading-[1.08]">From messy idea to a build you can defend.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-pretty text-ink-3">
            Forge keeps the reasoning between your idea and the build: evidence, assumptions, product decisions, requirements, prototype, and evals.
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <Composer large autoFocus />
        </div>

        <div className="mt-6 grid gap-2 md:grid-cols-3">
          {starters.map(({ icon: Icon, title, body, prompt }) => (
            <button
              key={title}
              onClick={() => f.setComposer(prompt)}
              className="group rounded-xl border border-line bg-raised p-4 text-left transition-colors hover:border-line-strong hover:bg-canvas"
            >
              <div className="mb-3 grid size-7 place-items-center rounded-md bg-inset text-ink-2"><Icon className="size-3.5" /></div>
              <p className="text-[12px] font-medium">{title}</p>
              <p className="mt-1 text-[11px] leading-5 text-ink-4">{body}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 overflow-x-auto text-[10px] font-medium uppercase tracking-[0.08em] text-ink-4">
          <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3" />Model</span><span>→</span>
          <span>Direction</span><span>→</span><span>Spec</span><span>→</span><span>Prototype</span><span>→</span><span>Eval</span>
        </div>
      </div>
    </div>
  );
}
