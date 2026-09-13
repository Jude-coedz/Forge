import { ArrowRight, Check, Circle, FileText, Lightbulb, Sparkles } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";
import type { BriefItem } from "../../types";

const labels = ["Frame", "Validate", "Decide", "Spec", "Prototype"];

function currentStep(phase: string) {
  if (phase === "idle") return 0;
  if (phase === "interrogate") return 1;
  if (phase === "position") return 2;
  if (phase === "spec") return 3;
  return 4;
}

function matches(item: BriefItem, ids: string[], words: RegExp) {
  const known = item.body.trim().length > 0 && item.provenance !== "unknown";
  return known && (ids.includes(item.id) || words.test(item.label));
}

function readiness(brief: BriefItem[]) {
  return [
    { label: "User", done: brief.some((x) => matches(x, ["user", "targetUser"], /user|customer|who.*for/i)), hint: "Who experiences the problem." },
    { label: "Pain", done: brief.some((x) => matches(x, ["problem", "pain"], /problem|pain|failure/i)), hint: "The concrete failure or unmet need." },
    { label: "Today", done: brief.some((x) => matches(x, ["currentBehavior", "workaround"], /current|workaround|today|behavior/i)), hint: "What the user does today instead." },
    { label: "Stakes", done: brief.some((x) => matches(x, ["stakes", "outcome"], /stake|outcome|impact|cost|why.*matter/i)), hint: "Why solving it is worth changing behavior for." },
  ];
}

export function StageGuide() {
  const f = useForge();
  const conv = f.conv;
  if (!conv) return null;

  const active = currentStep(conv.phase);
  const checks = readiness(conv.brief);
  const complete = checks.filter((item) => item.done).length;

  return (
    <div className="shrink-0 border-b border-line bg-surface/95 px-4 py-2.5">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {labels.map((label, index) => (
            <div
              key={label}
              title={stageHint(index)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${index === active ? "bg-spark-soft font-medium text-ink" : index < active ? "text-ink-3" : "text-ink-4"}`}
            >
              <span className={`grid size-4 place-items-center rounded-full text-[9px] ${index < active ? "bg-temper text-white" : index === active ? "bg-spark text-white" : "bg-inset"}`}>
                {index < active ? <Check className="size-2.5" /> : index + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium">{stageTitle(conv.phase, conv.readyForDirections)}</p>
            {conv.phase === "interrogate" ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {checks.map((item) => (
                  <span key={item.label} title={item.hint} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${item.done ? "bg-temper-soft text-temper" : "bg-inset text-ink-4"}`}>
                    {item.done ? <Check className="size-2.5" /> : <Circle className="size-2.5" />}{item.label}
                  </span>
                ))}
                <span className="text-[10px] text-ink-4">{complete}/4 evidence inputs</span>
              </div>
            ) : (
              <p className="mt-0.5 truncate text-[10px] text-ink-4">{stageHelp(conv.phase)}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {conv.phase === "interrogate" && conv.brief.length > 0 && (
              <Button size="sm" variant="secondary" onClick={() => f.openArtifact("brief")} title="Review the problem frame, evidence, assumptions and validation gaps.">
                <FileText className="size-3.5" /> Brief
              </Button>
            )}
            {conv.phase === "interrogate" && conv.readyForDirections && (
              <Button size="sm" variant="temper" onClick={f.advanceToDirections} disabled={f.generating} title="Compare product directions based on the validated problem frame.">
                Decide <ArrowRight className="size-3.5" />
              </Button>
            )}
            {conv.phase === "position" && <Button size="sm" variant="temper" onClick={() => f.openArtifact("thesis")}><Lightbulb className="size-3.5" /> Directions</Button>}
            {conv.phase === "spec" && <Button size="sm" variant="temper" onClick={() => f.openArtifact("spec")}><FileText className="size-3.5" /> Spec</Button>}
            {conv.phase === "prototype" && <Button size="sm" variant="temper" onClick={() => f.openArtifact("prototype")}><Sparkles className="size-3.5" /> Prototype</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function stageTitle(phase: string, ready: boolean) {
  if (phase === "interrogate" && ready) return "Problem frame is strong enough to compare solutions.";
  if (phase === "interrogate") return "Validate only what could change the product decision.";
  if (phase === "position") return "Compare solution shapes and choose deliberately.";
  if (phase === "spec") return "Turn the chosen direction into requirements and validation risks.";
  if (phase === "prototype") return "Pressure-test the riskiest workflow.";
  return "Frame the messy idea.";
}

function stageHelp(phase: string) {
  if (phase === "position") return "Recommendation, alternatives, tradeoffs and your own direction.";
  if (phase === "spec") return "Requirements, failure modes, metrics and unresolved validation.";
  if (phase === "prototype") return "A clickable test of the actual chosen workflow.";
  return "Start with the problem as you currently understand it.";
}

function stageHint(index: number) {
  return [
    "Turn the messy idea into a clear problem frame.",
    "Separate evidence from assumptions and resolve the highest-risk gaps.",
    "Compare materially different solution directions before committing.",
    "Create requirements, success measures, risks, and validation needs.",
    "Prototype the riskiest workflow to learn before building.",
  ][index];
}
