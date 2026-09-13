import { ArrowRight, Check, Circle, FileText, Lightbulb, Route, Sparkles } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";
import type { BriefItem } from "../../types";

const labels = ["Describe", "Clarify", "Decide", "Spec", "Prototype"];

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
    {
      label: "User",
      done: brief.some((item) => matches(item, ["user", "targetUser"], /user|who.*for|customer/i)),
      hint: "Who actually experiences the problem. Without this, Forge cannot judge whose behavior must change.",
    },
    {
      label: "Concrete pain",
      done: brief.some((item) => matches(item, ["problem", "pain"], /problem|pain|failure/i)),
      hint: "A specific failure or unmet need, not a market category such as 'lead generation'.",
    },
    {
      label: "Current behavior",
      done: brief.some((item) => matches(item, ["currentBehavior", "workaround"], /current|workaround|today|behavior/i)),
      hint: "What people do today. Strong product decisions account for the existing alternative and switching cost.",
    },
    {
      label: "Stakes",
      done: brief.some((item) => matches(item, ["stakes", "outcome"], /stake|outcome|impact|cost|why.*matter/i)),
      hint: "Why the problem matters enough to change behavior, spend time, or pay.",
    },
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
    <div className="border-b border-line bg-surface/95 px-4 py-3">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2">
          {labels.map((label, index) => (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-2" title={stageHint(index)}>
              <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${index < active ? "bg-temper text-white" : index === active ? "bg-spark text-white" : "bg-inset text-ink-4"}`}>
                {index + 1}
              </span>
              <span className={`hidden text-[11px] sm:block ${index === active ? "font-medium text-ink" : "text-ink-4"}`}>{label}</span>
            </div>
          ))}
        </div>

        {conv.phase === "interrogate" && (
          <div className="mt-3 rounded-xl border border-line bg-raised px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[12px] font-medium">Clarify enough to choose a product direction</p>
                <p className="mt-0.5 text-[11px] text-ink-4">{complete}/4 decision inputs are clear. Hover each item to see why it matters.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => f.openArtifact("brief")} title="Open the decision brief: what Forge knows, what it is inferring, and what remains uncertain.">
                <FileText className="size-3.5" /> Decision brief
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {checks.map((item) => (
                <div key={item.label} title={item.hint} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] ${item.done ? "border-temper/30 bg-temper/10 text-ink-2" : "border-line bg-canvas text-ink-4"}`}>
                  {item.done ? <Check className="size-3.5 text-temper" /> : <Circle className="size-3.5" />}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-medium">{title(conv.phase, conv.readyForDirections)}</p>
            <p className="mt-0.5 text-[11px] text-ink-4">{help(conv.phase, conv.readyForDirections, complete)}</p>
          </div>
          <div className="flex gap-1.5">
            {conv.phase === "interrogate" && conv.readyForDirections && (
              <Button size="sm" variant="temper" onClick={f.advanceToDirections} disabled={f.generating} title="Compare three materially different product shapes based on the evidence gathered so far.">
                <Route className="size-3.5" /> Move to Decide <ArrowRight className="size-3.5" />
              </Button>
            )}
            {conv.phase === "position" && (
              <Button size="sm" variant="temper" onClick={() => f.openArtifact("thesis")} title="Compare the recommended direction, alternatives, tradeoffs, and your own option."><Lightbulb className="size-3.5" /> Compare directions</Button>
            )}
            {conv.phase === "spec" && (
              <Button size="sm" variant="temper" onClick={() => f.openArtifact("spec")} title="Review the V1 requirements, risks, metrics, and unresolved questions."><FileText className="size-3.5" /> Review spec</Button>
            )}
            {conv.phase === "prototype" && (
              <Button size="sm" variant="temper" onClick={() => f.openArtifact("prototype")} title="Test the chosen workflow before adding more scope."><Sparkles className="size-3.5" /> Open prototype</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function title(phase: string, ready: boolean) {
  if (phase === "interrogate" && ready) return "You have enough signal to compare product directions.";
  if (phase === "interrogate") return "Keep clarifying only what can change the product decision.";
  if (phase === "position") return "Choose what kind of product should exist.";
  if (phase === "spec") return "Turn the decision into a focused V1.";
  if (phase === "prototype") return "Test the core workflow.";
  return "Describe the problem.";
}

function help(phase: string, ready: boolean, complete: number) {
  if (phase === "interrogate" && ready) return "The next step is explicit: move to Decide, or keep talking if you want stronger evidence first.";
  if (phase === "interrogate") return `${4 - complete} key input${4 - complete === 1 ? "" : "s"} still need clarification. Forge should ask only about those.`;
  if (phase === "position") return "Compare Forge's recommendation, challenge it, or propose your own.";
  if (phase === "spec") return "Review requirements, failure modes, metrics, and what still needs validation.";
  if (phase === "prototype") return "Use the prototype to pressure-test the chosen workflow.";
  return "Start with what you observed, who has the problem, and what goes wrong today.";
}

function stageHint(index: number) {
  return [
    "Describe what you observed without worrying about perfect product language.",
    "Clarify the user, concrete pain, current behavior, and stakes. Only decision-changing questions belong here.",
    "Compare materially different product directions and their risks.",
    "Turn the chosen direction into a focused, evidence-backed V1 plan.",
    "Test the riskiest workflow before adding more scope.",
  ][index];
}
