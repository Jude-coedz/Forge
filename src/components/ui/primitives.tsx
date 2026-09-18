import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { Severity } from "../../types";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "temper";
  size?: "sm" | "md" | "lg" | "icon";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-[transform,background-color,color,border-color,opacity] duration-150 ease-out enabled:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-9 px-3.5 text-[14px]",
        size === "lg" && "h-10 px-4 text-[14px]",
        size === "icon" && "size-9 p-0",
        variant === "primary" && "bg-ink text-canvas hover:opacity-90",
        variant === "temper" && "bg-temper text-white dark:text-canvas hover:brightness-105",
        variant === "secondary" && "border border-line-strong bg-raised text-ink hover:bg-inset",
        variant === "ghost" && "text-ink-2 hover:bg-inset hover:text-ink",
        variant === "danger" && "bg-scorch-soft text-scorch hover:bg-scorch hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function Pill({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "spark" | "temper" | "molten" | "scorch";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium tabular-nums",
        tone === "default" && "bg-inset text-ink-2",
        tone === "spark" && "bg-spark-soft text-spark",
        tone === "temper" && "bg-temper-soft text-temper",
        tone === "molten" && "bg-molten-soft text-molten",
        tone === "scorch" && "bg-scorch-soft text-scorch",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ value }: { value: Severity }) {
  const map: Record<Severity, { tone: "scorch" | "molten" | "default"; label: string }> = {
    critical: { tone: "scorch", label: "Critical" },
    high: { tone: "scorch", label: "High" },
    medium: { tone: "molten", label: "Medium" },
    low: { tone: "default", label: "Low" },
  };
  const item = map[value];
  return <Pill tone={item.tone}>{item.label}</Pill>;
}

export function ForgeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-raised stroke-line-strong" strokeWidth="1" />
      <path
        d="M8 21.5c3.2-1.2 5.4-3.8 6.4-7.6.4 2.8 1.8 5 4.1 6.4 1.6.9 3.4 1.3 5.5 1.2"
        className="stroke-spark"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 7.5v3.2M19.4 8.8l-1.6 2.2M12.6 8.8l1.6 2.2"
        className="stroke-molten"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
