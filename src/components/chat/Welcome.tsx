import { useForge } from "../../store/ForgeContext";
import { ForgeMark } from "../ui/primitives";
import { Composer } from "./Composer";

export function Welcome() {
  const f = useForge();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">
      <div className="mb-7 text-center">
        <div className="mb-4 flex justify-center"><ForgeMark className="size-10" /></div>
        <h1 className="font-display text-3xl font-semibold text-balance sm:text-4xl">Turn a messy idea into something worth building.</h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-pretty text-ink-3">
          Give Forge the rough version. It will turn it into a problem frame, separate evidence from assumptions, compare product directions, produce requirements and validation risks, then prototype the riskiest workflow.
        </p>
      </div>

      <Composer large autoFocus />

      <div className="mt-6 grid gap-2 sm:grid-cols-5">
        <Guide title="Frame" body="What is actually happening?" />
        <Guide title="Validate" body="What do we know vs assume?" />
        <Guide title="Decide" body="Which product shape wins?" />
        <Guide title="Spec" body="What must V1 do and prove?" />
        <Guide title="Prototype" body="Test the riskiest workflow." />
      </div>

      <button
        onClick={() => f.setComposer("I have a messy product idea. Here is what I have noticed: ")}
        className="mx-auto mt-5 text-[12px] text-spark hover:underline"
      >
        Give me a starting sentence
      </button>
    </div>
  );
}

function Guide({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-line bg-raised p-3 text-left">
      <p className="text-[12px] font-medium">{title}</p>
      <p className="mt-1 text-[11px] text-pretty text-ink-3">{body}</p>
    </div>
  );
}
