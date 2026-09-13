import { FileText, Lightbulb, Search, Sparkles } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { ForgeMark } from "../ui/primitives";
import { Composer } from "./Composer";

const starters = [
  {
    icon: Lightbulb,
    title: "Shape a messy idea",
    body: "Start with the rough thought. Forge will find the product questions hiding inside it.",
    prompt: "I have a messy product idea. Here is what I have noticed: ",
  },
  {
    icon: Search,
    title: "Pressure-test an idea",
    body: "Bring a solution you already have in mind and challenge whether the problem justifies it.",
    prompt: "I am considering building this product, but I want you to challenge the idea before I commit: ",
  },
  {
    icon: FileText,
    title: "Turn context into a spec",
    body: "Paste research, notes, customer feedback, or requirements and turn them into product decisions.",
    prompt: "Here is the product context I have so far. Help me identify the gaps, make the decisions, and turn it into a focused V1: ",
  },
];

export function Welcome() {
  const f = useForge();

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto px-4 py-10 scrollbar-thin">
      <div className="mx-auto flex w-full max-w-3xl flex-col justify-center">
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center"><ForgeMark className="size-10" /></div>
          <h1 className="font-display text-3xl font-semibold text-balance sm:text-4xl">What are you trying to build?</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-pretty text-ink-3">
            Start with the unfinished version. Forge helps you frame the problem, challenge assumptions, choose a product direction, write the spec, and test it with a prototype.
          </p>
        </div>

        <Composer large autoFocus />

        <div className="mt-5 grid gap-2 md:grid-cols-3">
          {starters.map(({ icon: Icon, title, body, prompt }) => (
            <button
              key={title}
              onClick={() => f.setComposer(prompt)}
              className="group rounded-2xl border border-line bg-raised p-4 text-left transition hover:border-line-strong hover:bg-surface"
            >
              <div className="mb-3 grid size-8 place-items-center rounded-lg bg-spark-soft text-spark"><Icon className="size-4" /></div>
              <p className="text-[13px] font-medium">{title}</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-3">{body}</p>
            </button>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-ink-4">
          <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3" /> Problem framing</span>
          <span>Evidence & assumptions</span>
          <span>Product directions</span>
          <span>Requirements & validation</span>
          <span>Clickable prototype</span>
        </div>
      </div>
    </div>
  );
}
