import { ArrowUpRight, CircleDot, FlaskConical } from "lucide-react";
import { Composer } from "./Composer";

export function Welcome() {
  return (
    <main className="relative min-h-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto grid w-full max-w-[1370px] items-center gap-14 px-6 py-14 sm:px-10 lg:min-h-full lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,.82fr)] lg:gap-20 lg:px-16 xl:px-24">
        <section className="forge-enter max-w-[790px]">
          <div className="flex items-center gap-3 text-ink-4">
            <span className="size-1.5 rounded-full bg-spark" />
            <p className="forge-eyebrow">Forge / Pre-build intelligence</p>
          </div>

          <h1 className="forge-display mt-8 text-[48px] leading-[1.02] text-white sm:text-[68px] xl:text-[78px]">
            Find the flaw
            <span className="block text-ink-3">before you build.</span>
          </h1>

          <p className="mt-7 max-w-[590px] text-[18px] leading-8 text-ink-2">
            Most tools help you ship an idea. Forge helps you challenge it first.
            Find the assumptions that could make it fail, design a real test,
            then prototype what is worth pursuing.
          </p>

          <div className="mt-10 max-w-[680px]">
            <Composer
              autoFocus
              placeholder="What are you thinking about building?"
            />
          </div>
          <p className="mt-4 text-[13px] leading-6 text-ink-4">
            A rough sentence, observation, voice note, or pasted context is enough.
          </p>
        </section>

        <aside className="forge-enter lg:pl-3" aria-label="Illustrative Forge output">
          <div className="relative overflow-hidden rounded-lg border border-line-strong bg-[#131416] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="forge-eyebrow text-ink-4">Inside a Forge stress test</span>
              <FlaskConical className="size-4 text-ink-4" />
            </div>

            <div className="mt-9 border-b border-line pb-8">
              <span className="text-[12px] text-ink-4">Example idea</span>
              <p className="forge-display mt-3 text-[26px] leading-[1.2] text-white sm:text-[31px]">
                A tool that helps freelancers chase overdue invoices.
              </p>
            </div>

            <div className="pt-7">
              <div className="flex items-center gap-2">
                <CircleDot className="size-4 text-spark" />
                <span className="forge-eyebrow text-ink-4">The question that matters</span>
              </div>
              <p className="mt-4 text-[19px] leading-8 text-white">
                Will freelancers move invoice data into another tool, or keep using their current workflow?
              </p>
              <p className="mt-4 text-[14px] leading-7 text-ink-3">
                If switching is too much work, better reminders won't make this product useful.
              </p>
            </div>

            <div className="mt-7 border-t border-line pt-6">
              <span className="forge-eyebrow text-ink-4">Test it before building</span>
              <p className="mt-3 text-[14px] leading-7 text-ink-2">
                Test a simple invoice-import flow with freelancers before investing in an automated follow-up system.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
              <span className="text-[12px] text-ink-4">Illustrative example, not market evidence</span>
              <ArrowUpRight className="size-4 text-ink-3" />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
