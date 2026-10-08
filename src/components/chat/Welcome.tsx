import { useState } from "react";
import { ArrowUpRight, CircleDot, FlaskConical } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Composer } from "./Composer";

const example = [
  {
    eyebrow: "The idea",
    heading: "Help freelancers follow up on overdue invoices.",
    detail: "A straightforward idea that seems useful. But usefulness alone doesn't tell us whether anyone will adopt another tool.",
    footer: "First, understand what would have to be true.",
  },
  {
    eyebrow: "The breaking point",
    heading: "Will they actually move their invoices into a new tool?",
    detail: "If importing invoices is more effort than sending a reminder manually, better reminders won't solve the adoption problem.",
    footer: "Forge challenges the assumption, not the person.",
  },
  {
    eyebrow: "The experiment",
    heading: "Test invoice import before building automation.",
    detail: "Show a small set of freelancers an interactive import flow. Observe whether they complete it using their own sample data without being guided.",
    footer: "Make the highest-risk interaction tangible.",
  },
] as const;

export function Welcome() {
  const [exampleStep, setExampleStep] = useState(1);
  const reducedMotion = useReducedMotion();
  return (
    <main className="forge-home-glow relative min-h-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto grid w-full max-w-[1430px] items-center gap-12 px-6 py-12 sm:px-12 lg:min-h-full lg:grid-cols-[minmax(0,1.13fr)_minmax(350px,.87fr)] lg:gap-16 xl:px-20">
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[780px]"
        >
          <div className="flex items-center gap-3">
            <span className="size-1.5 rounded-full bg-spark" />
            <p className="forge-eyebrow text-ink-4">Forge / The decision lab</p>
          </div>
          <h1 className="forge-display mt-8 text-[48px] leading-[1.06] tracking-[-.045em] text-white sm:text-[66px] xl:text-[76px]">
            Find the flaw
            <span className="block text-ink-3">before you build.</span>
          </h1>
          <p className="mt-7 max-w-[570px] text-[18px] leading-[1.75] text-ink-2">
            Bring an idea. Forge uncovers the assumptions that could break it,
            helps you test what matters, and prototypes the smallest thing worth building.
          </p>
          <div className="mt-10 max-w-[690px]">
            <Composer autoFocus placeholder="What's the product idea? Start anywhere…" />
          </div>
        </motion.section>

        <motion.aside
          initial={reducedMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[28px] border border-white/[.08] bg-[#1b1e26]/85 p-6 shadow-[0_30px_95px_rgba(0,0,0,.22)] sm:p-8"
          aria-label="Interactive example of a Forge stress test"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="forge-eyebrow text-ink-4">See how Forge thinks</p>
            <FlaskConical className="size-4 text-ink-4" />
          </div>
          <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label="Example stages">
            {["Idea", "Pressure point", "Experiment"].map((label, index) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={exampleStep === index}
                onClick={() => setExampleStep(index)}
                className={
                  "rounded-full px-3.5 py-2 text-[12px] transition-colors duration-200 " +
                  (exampleStep === index
                    ? "bg-white text-black"
                    : "bg-white/[.055] text-ink-3 hover:bg-white/[.09] hover:text-white")
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8 min-h-[265px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={exampleStep}
                role="tabpanel"
                initial={reducedMotion ? false : { opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8, filter: "blur(3px)" }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <span className="inline-flex items-center gap-2 text-[12px] text-spark">
                  <CircleDot className="size-3.5" /> {example[exampleStep].eyebrow}
                </span>
                <h2 className="forge-display mt-5 text-[27px] leading-[1.25] text-white sm:text-[31px]">
                  {example[exampleStep].heading}
                </h2>
                <p className="mt-5 max-w-[470px] text-[15px] leading-7 text-ink-3">
                  {example[exampleStep].detail}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[.075] pt-5">
            <p className="text-[12px] leading-5 text-ink-4">{example[exampleStep].footer}</p>
            <button
              type="button"
              onClick={() => setExampleStep((current) => (current + 1) % example.length)}
              aria-label="Next example step"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[.09] text-white transition hover:bg-white/[.17]"
            >
              <ArrowUpRight className="size-4" />
            </button>
          </div>
          <p className="mt-4 text-[11px] text-ink-4">Illustrative scenario, not customer research.</p>
        </motion.aside>
      </div>
    </main>
  );
}
