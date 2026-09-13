import { ArrowRight, FileText, Lightbulb, Route, Sparkles } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";

const labels = ["Describe", "Clarify", "Decide", "Spec", "Prototype"];

function currentStep(phase: string) {
  if (phase === "idle") return 0;
  if (phase === "interrogate") return 1;
  if (phase === "position") return 2;
  if (phase === "spec") return 3;
  return 4;
}

export function StageGuide() {
  const f = useForge();
  const conv = f.conv;
  if (!conv) return null;
  const active = currentStep(conv.phase);
  const unresolved = conv.questions.filter((q) => !q.answered).length;

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

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-medium">{title(conv.phase, conv.readyForDirections)}</p>
            <p className="mt-0.5 text-[11px] text-ink-4">{help(conv.phase, conv.readyForDirections, unresolved)}</p>
          </div>
          <div className="flex gap-1.5">
            {conv.phase === "interrogate" && conv.brief.length > 0 && (
              <Button size="sm" variant="secondary" onClick={() => f.openArtifact("brief")} title="See the current evidence, assumptions and unresolved decisions.">
                <FileText className="size-3.5" /> Decision brief
              </Button>
            )}
            {conv.phase === "interrogate" && conv.readyForDirections && (
              <Button size="sm" variant="temper" onClick={f.advanceToDirections} disabled={f.generating}>
                <Route className="size-3.5" /> Explore directions <ArrowRight className="size-3.5" />
              </Button>
            )}
            {conv.phase === "position" && (
              <Button size="sm" variant="temper" onClick={() => f.openArtifact("thesis")}><Lightbulb className="size-3.5" /> Compare directions</Button>
            )}
            {conv.phase === "spec" && (
              <Button size="sm" variant="temper" onClick={() => f.openArtifact("spec")}><FileText className="size-3.5" /> Review spec</Button>
            )}
            {conv.phase === "prototype" && (
              <Button size="sm" variant="temper" onClick={() => f.openArtifact("prototype")}><Sparkles className="size-3.5" /> Open prototype</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function title(phase: string, ready: boolean) {
  if (phase === "interrogate" && ready) return "You have enough signal to make the product decision.";
  if (phase === "interrogate") return "Clarify the problem before designing the solution.";
  if (phase === "position") return "Choose what kind of product should exist.";
  if (phase === "spec") return "Turn the decision into a focused V1.";
  if (phase === "prototype") return "Test the core workflow.";
  return "Describe the problem.";
}

function help(phase: string, ready: boolean, unresolved: number) {
  if (phase === "interrogate" && ready) return "Keep discussing if you want, or move explicitly to product directions.";
  if (phase === "interrogate") return unresolved ? `${unresolved} decision-changing question${unresolved === 1 ? "" : "s"} remain. Answer naturally in chat.` : "Forge will ask one decision-changing question at a time.";
  if (phase === "position") return "Compare Forge's recommendation, challenge it, or propose your own.";
  if (phase === "spec") return "Review requirements, failure modes and unresolved validation.";
  if (phase === "prototype") return "Use the prototype to pressure-test the chosen workflow.";
  return "Start with what you observed, who has the problem, and what goes wrong today.";
}

function stageHint(index: number) {
  return [
    "Describe the messy problem in your own words.",
    "Pressure-test evidence, stakes and assumptions.",
    "Compare product directions and tradeoffs.",
    "Create a decision-backed build plan.",
    "Test the actual workflow before adding scope.",
  ][index];
}
