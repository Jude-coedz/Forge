import type { ReactNode } from "react";
import type { ProductRisk } from "../../types";
import { Pill } from "../ui/primitives";

export function ScreenShell({
  eyebrow,
  title,
  description,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className="forge-enter pb-14">
      <div className={wide ? "mb-9 max-w-3xl" : "mb-9 max-w-[680px]"}>
        <div className="flex items-center gap-2.5">
          <span className="h-px w-7 bg-spark" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-spark">{eyebrow}</p>
        </div>
        <h2 className="mt-3 max-w-[760px] font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[40px]">
          {title}
        </h2>
        <p className="mt-3 max-w-[680px] text-[16px] leading-7 text-ink-3">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function LoadingState({
  title,
  body,
  mode = "reasoning",
}: {
  title: string;
  body?: string;
  mode?: "reasoning" | "prototype";
}) {
  return (
    <div className="flex min-h-[480px] items-center justify-center">
      <div className="w-full max-w-md text-center">
        {mode === "prototype" ? (
          <div className="mx-auto w-[230px] rounded-2xl border border-line-strong bg-raised p-3 shadow-[var(--shadow-float)]" aria-hidden>
            <div className="flex items-center gap-1.5 border-b border-line pb-2">
              <span className="size-2 rounded-full bg-scorch/60" />
              <span className="size-2 rounded-full bg-molten/60" />
              <span className="size-2 rounded-full bg-temper/60" />
            </div>
            <div className="mt-3 space-y-2">
              <span className="forge-shimmer block h-3 w-3/5 rounded bg-inset" />
              <span className="forge-shimmer block h-16 w-full rounded-xl bg-inset [animation-delay:120ms]" />
              <div className="grid grid-cols-3 gap-2">
                <span className="forge-shimmer block h-8 rounded-lg bg-inset [animation-delay:180ms]" />
                <span className="forge-shimmer block h-8 rounded-lg bg-inset [animation-delay:240ms]" />
                <span className="forge-shimmer block h-8 rounded-lg bg-inset [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-48 items-center gap-2" aria-hidden>
            <span className="forge-process-line h-px flex-1 bg-line-strong" />
            <span className="grid size-10 place-items-center rounded-2xl border border-spark/20 bg-spark-soft">
              <span className="forge-core size-2.5 rounded-full bg-spark" />
            </span>
            <span className="forge-process-line h-px flex-1 bg-line-strong [animation-delay:160ms]" />
          </div>
        )}
        <p className="mt-6 text-[16px] font-medium text-ink-2">{title}</p>
        {body && <p className="mt-2 text-[14px] leading-6 text-ink-4">{body}</p>}
      </div>
    </div>
  );
}

export function RiskPill({ risk }: { risk: ProductRisk }) {
  const labels: Record<ProductRisk, string> = {
    value: "Value",
    usability: "Usability",
    feasibility: "Feasibility",
    viability: "Viability",
  };
  return <Pill>{labels[risk]}</Pill>;
}

export function SectionRule({
  title,
  children,
  accent = false,
}: {
  title: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center gap-2">
        {accent && <span className="size-1.5 rounded-full bg-spark" />}
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-4">{title}</p>
      </div>
      {children}
    </section>
  );
}
