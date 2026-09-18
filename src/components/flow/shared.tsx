import type { ReactNode } from "react";
import type { ProductRisk } from "../../types";
import { Pill } from "../ui/primitives";

export function ScreenShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="pb-12">
      <div className="mb-8 max-w-2xl">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-4">{eyebrow}</p>
        <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight tracking-tight text-balance sm:text-[34px]">
          {title}
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-ink-3">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function LoadingState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex w-fit gap-1.5" aria-hidden>
          <span className="size-2 animate-pulse rounded-full bg-ink-4" />
          <span className="size-2 animate-pulse rounded-full bg-ink-4 [animation-delay:120ms]" />
          <span className="size-2 animate-pulse rounded-full bg-ink-4 [animation-delay:240ms]" />
        </div>
        <p className="mt-4 text-[15px] font-medium text-ink-2">{title}</p>
        {body && <p className="mt-1 text-[13px] leading-5 text-ink-4">{body}</p>}
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

export function SectionRule({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <p className="mb-3 text-[13px] font-medium text-ink-3">{title}</p>
      {children}
    </section>
  );
}
