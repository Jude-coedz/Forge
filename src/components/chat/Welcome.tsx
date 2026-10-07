import { ArrowRight, FileText, GitBranch, Lightbulb, Search, Sparkles } from "lucide-react";
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
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.75fr)] lg:px-10 lg:py-16">
        <section className="forge-enter">
          <div className="flex items-center gap-3">
            <ForgeMark className="size-9" />
            <div>
              <p className="font-display text-[16px] font-semibold leading-none">Forge</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-4">Pre-build product copilot</p>
            </div>
          </div>

          <h1 className="mt-8 max-w-[760px] font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] text-balance sm:text-[58px]">
            Figure out what to build before you start building.
          </h1>
          <p className="mt-5 max-w-[680px] text-[17px] leading-7 text-ink-3">
            Bring the unfinished version. Forge separates the problem from the solution, challenges the risky parts, helps you choose a direction, then turns the decision into a build brief and a working prototype.
          </p>

          <div className="mt-8">
            <Composer autoFocus />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {starters.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => f.setComposer(prompt)}
                className="group inline-flex items-center gap-2 rounded-xl border border-line bg-raised/70 px-3 py-2 text-[13px] text-ink-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-raised hover:text-ink"
              >
                <Icon className="size-3.5 transition-transform duration-200 group-hover:scale-110" />
                {label}
              </button>
            ))}
          </div>

          {f.conversations.length > 0 && (
            <p className="mt-8 text-[13px] leading-5 text-ink-4">
              Your saved product decisions remain in the sidebar. Forge always opens on a clean starting surface.
            </p>
          )}
        </section>

        <ProductTransformation />
      </div>
    </div>
  );
}

function ProductTransformation() {
  return (
    <aside className="forge-enter hidden lg:block [animation-delay:80ms]">
      <div className="relative overflow-hidden rounded-[28px] border border-line-strong bg-raised p-5 shadow-[var(--shadow-float)]">
        <div className="absolute -right-20 -top-24 size-56 rounded-full bg-spark-soft blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-4">What Forge changes</p>
              <p className="mt-1 text-[15px] font-medium">One idea, progressively clarified</p>
            </div>
            <span className="grid size-9 place-items-center rounded-2xl bg-spark-soft text-spark">
              <Sparkles className="size-4" />
            </span>
          </div>

          <div className="mt-6 space-y-2.5">
            <TransformStep
              index="01"
              title="Messy input"
              body="“I want to build an AI tool that helps teams stop losing context…”"
              tone="quiet"
            />
            <Connector />
            <TransformStep
              index="02"
              title="Product frame"
              body="Who has the problem, what happens today, and what better outcome matters."
            />
            <Connector />
            <TransformStep
              index="03"
              title="Competing directions"
              body="Three meaningfully different product mechanisms, compared instead of blended."
              icon={<GitBranch className="size-3.5" />}
            />
            <Connector />
            <TransformStep
              index="04"
              title="Working prototype"
              body="The locked V1 becomes something interactive enough to inspect before engineering starts."
              tone="accent"
              icon={<ArrowRight className="size-3.5" />}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

function TransformStep({
  index,
  title,
  body,
  tone = "default",
  icon,
}: {
  index: string;
  title: string;
  body: string;
  tone?: "quiet" | "default" | "accent";
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={
        "rounded-2xl border p-4 " +
        (tone === "accent"
          ? "border-spark/25 bg-spark-soft"
          : tone === "quiet"
            ? "border-dashed border-line bg-canvas/60"
            : "border-line bg-canvas/80")
      }
    >
      <div className="flex items-start gap-3">
        <span className="font-mono text-[10px] font-medium text-ink-4">{index}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold">{title}</p>
            {icon && <span className={tone === "accent" ? "text-spark" : "text-ink-4"}>{icon}</span>}
          </div>
          <p className="mt-1 text-[12px] leading-5 text-ink-4">{body}</p>
        </div>
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex h-4 items-center pl-[19px]" aria-hidden>
      <span className="h-full w-px bg-gradient-to-b from-line-strong to-spark/30" />
    </div>
  );
}
