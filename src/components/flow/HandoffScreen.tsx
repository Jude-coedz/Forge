import { ArrowLeft, Check, ClipboardCopy, FileText, Plus } from "lucide-react";
import { builderPrompt } from "../../lib/format";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";
import { ScreenShell, SectionRule } from "./shared";

export function HandoffScreen() {
  const f = useForge();
  const conv = f.conv!;
  const spec = conv.spec;

  if (!spec) return null;

  const unresolved = spec.validationPlan.slice(0, 3);

  const copyBuilderPrompt = async () => {
    await navigator.clipboard.writeText(builderPrompt(spec));
    f.toast({
      title: "Builder prompt copied",
      body: "Paste it into the tool you use to implement or prototype the product.",
      tone: "success",
    });
  };

  return (
    <ScreenShell
      eyebrow="5 · Handoff"
      title="You know what you are building now"
      description="Forge is finished when the product decision is clear enough to hand to a builder without losing the reasoning behind it."
    >
      <div className="max-w-3xl">
        <div className="flex items-start gap-3 border-y border-line py-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-temper-soft text-temper">
            <Check className="size-5" />
          </span>
          <div>
            <p className="text-[16px] font-medium">Build brief complete</p>
            <p className="mt-1 text-[14px] leading-6 text-ink-3">
              The chosen direction, V1 scope, requirements, non-goals, risks, and validation work are preserved in this project.
            </p>
          </div>
        </div>

        <SectionRule title="Take it into your build workflow">
          <div className="divide-y divide-line border-y border-line">
            <ActionRow
              icon={<FileText className="size-5" />}
              title="Copy the full build brief"
              body="Use this when you want the reasoning, requirements, risks, and validation plan together."
              action="Copy brief"
              onClick={f.copySpec}
            />
            <ActionRow
              icon={<ClipboardCopy className="size-5" />}
              title="Copy a builder prompt"
              body="A shorter implementation handoff that keeps the V1 scope and acceptance criteria intact."
              action="Copy builder prompt"
              onClick={copyBuilderPrompt}
            />
          </div>
        </SectionRule>

        {unresolved.length > 0 && (
          <SectionRule title="Still unresolved">
            <p className="mb-3 text-[13px] leading-5 text-ink-4">
              These do not block the handoff, but they should not quietly become facts during implementation.
            </p>
            <ul className="space-y-2">
              {unresolved.map((item, index) => (
                <li key={item.risk + "-" + index} className="flex gap-2 text-[14px] leading-5 text-ink-2">
                  <span className="text-ink-4">•</span>
                  <span>{item.assumption}</span>
                </li>
              ))}
            </ul>
          </SectionRule>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button variant="ghost" onClick={() => f.setProjectStage("brief")}>
            <ArrowLeft className="size-3.5" />
            Back to brief
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
  icon: React.ReactNode;
  title: string;
  body: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="grid gap-4 py-5 sm:grid-cols-[28px_1fr_auto] sm:items-center">
      <div className="text-ink-4">{icon}</div>
      <div>
        <p className="text-[15px] font-medium">{title}</p>
        <p className="mt-1 max-w-xl text-[13px] leading-5 text-ink-4">{body}</p>
      </div>
      <Button size="sm" variant="secondary" onClick={onClick}>
        {action}
      </Button>
    </div>
  );
}
