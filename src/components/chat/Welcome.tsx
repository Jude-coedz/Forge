import { useForge } from "../../store/ForgeContext";
import { ForgeMark } from "../ui/primitives";
import { Composer } from "./Composer";

export function Welcome() {
  const f = useForge();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center"><ForgeMark className="size-10" /></div>
        <h1 className="font-display text-3xl font-semibold text-balance sm:text-4xl">Turn a messy idea into a product decision.</h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-pretty text-ink-3">
          Start with what you observed. Forge will challenge the weak parts, ask the question you may have skipped, and help you decide what should actually be built.
        </p>
      </div>

      <Composer large autoFocus />

      <div className="mt-6 grid gap-2 md:grid-cols-3">
        <Guide title="1 · Describe" body="Tell Forge who has the problem, what happens today, and what goes wrong. Rough notes are fine." />
        <Guide title="2 · Clarify" body="Answer one high-leverage question at a time. Correct Forge whenever an inference is wrong." />
        <Guide title="3 · Decide" body="When there is enough signal, you choose when to compare product directions, then lock one before a spec exists." />
      </div>

      <button
        onClick={() => f.setComposer("I noticed a recurring problem: ")}
        className="mx-auto mt-5 text-[12px] text-spark hover:underline"
      >
        Give me a starting sentence
      </button>
    </div>
  );
}

function Guide({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-raised p-4 text-left">
      <p className="text-[13px] font-medium">{title}</p>
      <p className="mt-1 text-[12px] text-pretty text-ink-3">{body}</p>
    </div>
  );
}
