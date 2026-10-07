import { Composer } from "./Composer";

export function Welcome() {
  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto flex w-full max-w-[900px] flex-col justify-center px-6 py-14 sm:px-10 lg:py-20">
        <section className="forge-enter">
          <div className="max-w-[760px]">
            <h1 className="text-[44px] font-[480] leading-[1.04] tracking-[-0.045em] text-ink sm:text-[58px]">
              Validate the idea before you build it.
            </h1>
            <p className="mt-5 max-w-[700px] text-[18px] leading-8 text-ink-3">
              Start with an idea, a problem you noticed, notes, or context from another AI. Forge challenges the assumptions, checks the market, helps you choose a direction, and turns it into a working prototype.
            </p>
          </div>

          <div className="mt-9">
            <Composer
              autoFocus
              placeholder="Describe the idea, the problem, or paste whatever context you already have…"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
