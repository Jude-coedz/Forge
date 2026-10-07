import type { ReactNode } from "react";
import { ArrowLeft, Check, ClipboardCopy, Code2, FileText, Plus } from "lucide-react";
import { builderPrompt } from "../../lib/format";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";
import { ScreenShell, SectionRule } from "./shared";

export function HandoffScreen() {
  const f = useForge();
  const conv = f.conv!;
  const spec = conv.spec;
  const prototype = conv.prototype;

  if (!spec || !prototype) return null;

  const unresolved = spec.validationPlan.slice(0, 3);

  const copyBuilderPrompt = async () => {
    await navigator.clipboard.writeText(builderPrompt(spec));
    f.toast({
      title: "Builder prompt copied",
      body: "The locked V1 and acceptance criteria are ready for your implementation tool.",
      tone: "success",
    });
  };

  return (
    <ScreenShell
      eyebrow="6 · Handoff"
      title="The decision is ready to leave Forge"
      description="The product direction, build scope, working prototype, and unresolved assumptions now travel together. Engineering gets the decision, not just a feature list."
    >
      <div className="max-w-4xl">
        <div className="rounded-[24px] border border-temper/25 bg-temper-soft/60 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-temper text-white">
              <Check className="size-5" />
            </span>
            <div>
              <p className="text-[18px] font-semibold tracking-tight">Decision package complete</p>
              <p className="mt-1 max-w-2xl text-[14px] leading-6 text-ink-3">
                {spec.productName} now has a locked direction, focused V1 brief, interactive prototype, and explicit validation work.
              </p>
            </div>
          </div>
        </div>

        <SectionRule title="Take it into your build workflow" accent>
          <div className="divide-y divide-line rounded-[20px] border border-line bg-raised px-5">
            <ActionRow
              icon={<FileText className="size-5" />}
              title="Full Build Brief"
              body="Reasoning, V1 scope, requirements, non-goals, failure modes, and validation work."
              action="Copy brief"
              onClick={f.copySpec}
            />
            <ActionRow
              icon={<Code2 className="size-5" />}
              title="Working prototype"
              body="A self-contained interactive HTML prototype generated from this exact brief."
              action="Copy HTML"
              onClick={f.copyPrototype}
            />
            <ActionRow
              icon={<ClipboardCopy className="size-5" />}
              title="Builder prompt"
              body="A compact handoff for a coding agent that preserves the product decisions and acceptance criteria."
              action="Copy prompt"
              onClick={copyBuilderPrompt}
            />
          </div>
        </SectionRule>

        {unresolved.length > 0 && (
          <SectionRule title="Carry these uncertainties forward">
            <div className="rounded-[20px] border border-molten/20 bg-molten-soft/40 p-5">
              <p className="mb-4 text-[14px] leading-6 text-ink-3">
                These do not block implementation, but the builder should not silently turn them into facts.
              </p>
              <ul className="space-y-3">
                {unresolved.map((item, index) => (
                  <li key={item.risk + "-" + index} className="flex gap-3 text-[14px] leading-6 text-ink-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-molten" />
                    <span>{item.assumption}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionRule>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button variant="ghost" onClick={() => f.setProjectStage("prototype")}>
            <ArrowLeft className="size-3.5" />
            Back to prototype
          </Button>
          <Button variant="secondary" onClick={f.newProject}>
            <Plus className="size-3.5" />
            Start another idea
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}

function ActionRow({
  icon,
  title,
  body,
  action,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="grid gap-4 py-5 sm:grid-cols-[36px_1fr_auto] sm:items-center">
      <div className="grid size-9 place-items-center rounded-xl bg-inset text-ink-3">{icon}</div>
      <div>
        <p className="text-[15px] font-medium">{title}</p>
        <p className="mt-1 max-w-xl text-[14px] leading-5 text-ink-4">{body}</p>
      </div>
      <Button size="sm" variant="secondary" onClick={onClick}>
        {action}
      </Button>
    </div>
  );
}
