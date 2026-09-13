import { ArrowRight, Check, FileText, Lightbulb, Sparkles } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";

const labels = ["Frame", "Validate", "Decide", "Spec", "Prototype"];

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

  return (
    <div className="shrink-0 border-b border-line bg-surface/95 px-4 py-2">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {labels.map((label, index) => (
              <div
                key={label}
                title={stageHint(index)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] ${index === active ? "bg-spark-soft font-medium text-ink" : index < active ? "text-ink-3" : "text-ink-4"}`}
              >
                <span className={`grid size-4 place-items-center rounded-full text-[9px] ${index < active ? "bg-temper text-white" : index === active ? "bg-spark text-white" : "bg-inset"}`}>
                  {index < active ? <Check className="size-2.5" /> : index + 1}
                </span>
                {label}
              </div>
            ))}
          </div>
          <p className="mt-1 truncate text-[11px] text-ink-4">{stageHelp(conv.phase, conv.readyForDirections)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {conv.phase === "interrogate" && conv.brief.length > 0 && (
            <Button size="sm" variant="secondary" onClick={() => f.openArtifact("brief")} title="Review what Forge knows, what is still an assumption, and what needs validation.">
              <FileText className="size-3.5" /> Brief
            </Button>
          )}
          {conv.phase === "interrogate" && conv.readyForDirections && (
            <Button size="sm" variant="temper" onClick={f.advanceToDirections} disabled={f.generating} title="You have enough context to compare product directions. You can still keep validating first if you want.">
              Compare directions <ArrowRight className="size-3.5" />
            </Button>
          )}
          {conv.phase === "position" && (
            <Button size="sm" variant="temper" onClick={() => f.openArtifact("thesis")} title="Compare Forge's recommendation, alternatives, tradeoffs, and your own direction.">
              <Lightbulb className="size-3.5" /> Directions
            </Button>
          )}
          {conv.phase === "spec" && (
            <Button size="sm" variant="temper" onClick={() => f.openArtifact("spec")} title="Review V1 requirements, risks, success signals, and validation work.">
              <FileText className="size-3.5" /> Spec
            </Button>
          )}
          {conv.phase === "prototype" && (
            <Button size="sm" variant="temper" onClick={() => f.openArtifact("prototype")} title="Open the clickable prototype built from the chosen product direction.">
              <Sparkles className="size-3.5" /> Prototype
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function stageHelp(phase: string, ready: boolean) {
  if (phase === "interrogate" && ready) return "Enough context to compare solutions. Continue validating or move forward when you are ready.";
  if (phase === "interrogate") return "Forge is pressure-testing the problem. Answer naturally, correct it, or open the Brief to inspect its assumptions.";
  if (phase === "position") return "Compare different product shapes before committing to one.";
  if (phase === "spec") return "Turn the chosen direction into requirements, risks, success measures, and validation work.";
  if (phase === "prototype") return "Use the prototype to test the riskiest workflow before building the full product.";
  return "Start with the messy idea. Forge will structure it as you work.";
}

function stageHint(index: number) {
  return [
    "Frame the user problem without jumping to a solution.",
    "Separate evidence from assumptions and pressure-test what matters.",
    "Compare different product directions and their tradeoffs.",
    "Create a build-ready product spec and validation plan.",
    "Test the key workflow with a clickable prototype.",
  ][index];
}
