import {
  ArrowRight,
  Check,
  CircleDot,
  FileText,
  FlaskConical,
  GitBranch,
  Lightbulb,
  ListChecks,
  Play,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button, Pill } from "../ui/primitives";
import type { Conversation } from "../../types";

const stages = ["Model", "Direction", "Spec", "Prototype", "Eval"];

function stageIndex(phase: Conversation["phase"]) {
  if (phase === "position") return 1;
  if (phase === "spec") return 2;
  if (phase === "prototype") return 3;
  if (phase === "eval") return 4;
  return 0;
}

export function ProductWorkspace() {
  const f = useForge();
  const conv = f.conv;
  if (!conv) return null;

  const model = conv.productModel;
  const active = stageIndex(conv.phase);
  const nextDecision = model.decisions.find((d) => d.status === "open");
  const openAssumptions = model.assumptions.filter((a) => a.status === "untested");
  const pendingTests = model.validationTasks.filter((v) => v.status === "todo");

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-4">Product workspace</p>
              <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight">{conv.title}</h1>
              <p className="mt-1 max-w-2xl text-[13px] leading-5 text-ink-3">
                {model.summary || "Forge is turning the initial context into a product model."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {conv.readyForDirections && conv.phase === "interrogate" && (
                <Button variant="temper" onClick={f.advanceToDirections} disabled={f.generating}>
                  Compare directions <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1 overflow-x-auto border-b border-line pb-3">
            {stages.map((stage, index) => (
              <div key={stage} className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${index === active ? "bg-inset font-medium text-ink" : index < active ? "text-ink-2" : "text-ink-4"}`}>
                <span className={`grid size-4 place-items-center rounded-full text-[9px] ${index < active ? "bg-temper text-white" : index === active ? "bg-ink text-canvas" : "border border-line-strong"}`}>
                  {index < active ? <Check className="size-2.5" /> : index + 1}
                </span>
                {stage}
              </div>
            ))}
          </div>
        </header>

        {nextDecision && (
          <section className="mb-5 rounded-xl border border-line-strong bg-raised p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-molten">
                  <GitBranch className="size-3.5" /> Next product decision
                </div>
                <h2 className="mt-2 text-[15px] font-medium text-ink">{nextDecision.question}</h2>
                {nextDecision.recommendation && <p className="mt-1.5 text-[13px] leading-5 text-ink-3">Forge currently leans: {nextDecision.recommendation}</p>}
                {nextDecision.rationale && <p className="mt-1 text-[12px] leading-5 text-ink-4">{nextDecision.rationale}</p>}
              </div>
              <Button variant="secondary" size="sm" onClick={() => f.setComposer(`Help me decide this: ${nextDecision.question}`)}>
                Think with Forge
              </Button>
            </div>
          </section>
        )}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <WorkspaceCard title="Problem frame" icon={<Target className="size-4" />}>
            <Field label="Primary user" value={model.primaryUser} icon={<UserRound className="size-3.5" />} />
            <Field label="Opportunity" value={model.opportunity} />
            <Field label="Current workaround" value={model.currentWorkaround} />
            <Field label="Desired outcome" value={model.desiredOutcome} />
          </WorkspaceCard>

          <WorkspaceCard title="Evidence" icon={<CircleDot className="size-4" />} count={model.evidence.length}>
            {model.evidence.length ? model.evidence.slice(0, 4).map((item) => (
              <div key={item.id} className="border-b border-line py-2.5 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] leading-5 text-ink-2">{item.claim}</p>
                  <Pill tone={item.strength === "strong" ? "temper" : undefined}>{item.strength}</Pill>
                </div>
                <p className="mt-1 text-[10px] text-ink-4">{item.source}</p>
              </div>
            )) : <EmptyLine text="No grounded evidence yet." />}
          </WorkspaceCard>

          <WorkspaceCard title="Assumptions" icon={<Lightbulb className="size-4" />} count={openAssumptions.length}>
            {openAssumptions.length ? openAssumptions.slice(0, 4).map((item) => (
              <div key={item.id} className="border-b border-line py-2.5 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] leading-5 text-ink-2">{item.claim}</p>
                  <Pill>{item.risk}</Pill>
                </div>
              </div>
            )) : <EmptyLine text="No untested assumption is blocking the model." />}
          </WorkspaceCard>

          <WorkspaceCard title="Decisions" icon={<GitBranch className="size-4" />} count={model.decisions.length}>
            {model.decisions.length ? model.decisions.slice(0, 4).map((item) => (
              <div key={item.id} className="border-b border-line py-2.5 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] leading-5 text-ink-2">{item.question}</p>
                  <Pill tone={item.status === "decided" ? "temper" : undefined}>{item.status}</Pill>
                </div>
                {item.status === "decided" && item.decision && <p className="mt-1 text-[11px] text-ink-4">{item.decision}</p>}
              </div>
            )) : <EmptyLine text="Forge has not surfaced a decision fork yet." />}
          </WorkspaceCard>

          <WorkspaceCard title="Validation queue" icon={<FlaskConical className="size-4" />} count={pendingTests.length}>
            {pendingTests.length ? pendingTests.slice(0, 4).map((item) => (
              <div key={item.id} className="border-b border-line py-2.5 last:border-b-0">
                <p className="text-[12px] leading-5 text-ink-2">{item.test}</p>
                <p className="mt-1 text-[10px] text-ink-4">Success: {item.successSignal}</p>
              </div>
            )) : <EmptyLine text="No validation task is queued." />}
          </WorkspaceCard>

          <WorkspaceCard title="What Forge needs" icon={<Sparkles className="size-4" />}>
            {conv.readyForDirections ? (
              <div className="py-2">
                <p className="text-[13px] font-medium">Enough signal to compare product directions.</p>
                <p className="mt-1 text-[12px] leading-5 text-ink-4">You can move forward now. Unknowns remain visible as assumptions or validation work instead of blocking you.</p>
                {conv.phase === "interrogate" && <Button size="sm" variant="temper" className="mt-3" onClick={f.advanceToDirections} disabled={f.generating}>Compare directions</Button>}
              </div>
            ) : (
              <div className="py-2">
                <p className="text-[13px] font-medium">{conv.questions.find((q) => !q.answered)?.question || "Forge is updating the product model."}</p>
                <p className="mt-1 text-[12px] leading-5 text-ink-4">If you do not know the answer, say so. Forge should turn the unknown into validation work instead of making you guess.</p>
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => f.setComposer("I don't know this yet. Turn it into a validation task and tell me what we can decide without it.")}>I don't know yet</Button>
              </div>
            )}
          </WorkspaceCard>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold">Build outputs</h2>
              <p className="mt-0.5 text-[12px] text-ink-4">Each output inherits the decisions and assumptions that produced it.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <OutputCard label="Product brief" icon={<FileText className="size-4" />} ready={conv.brief.length > 0} onOpen={() => f.openArtifact("brief")} />
            <OutputCard label="Directions" icon={<GitBranch className="size-4" />} ready={conv.theses.length > 0} onOpen={() => f.openArtifact("thesis")} />
            <OutputCard label="V1 spec" icon={<ListChecks className="size-4" />} ready={!!conv.spec} onOpen={() => f.openArtifact("spec")} />
            <OutputCard label="Prototype" icon={<Play className="size-4" />} ready={!!conv.prototype} onOpen={() => f.openArtifact("prototype")} />
            <OutputCard label="Eval report" icon={<FlaskConical className="size-4" />} ready={!!conv.evalReport} onOpen={() => f.openArtifact("eval")} action={!conv.evalReport && !!conv.prototype ? "Run eval" : undefined} onAction={f.runEval} />
          </div>
        </section>
      </div>
    </main>
  );
}

function WorkspaceCard({ title, icon, count, children }: { title: string; icon: React.ReactNode; count?: number; children: React.ReactNode }) {
  return (
    <section className="min-h-[210px] rounded-xl border border-line bg-raised p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] font-medium text-ink-2">{icon}{title}</div>
        {typeof count === "number" && <span className="text-[11px] tabular-nums text-ink-4">{count}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="border-b border-line py-2.5 last:border-b-0">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-4">{icon}{label}</div>
      <p className={`mt-1 text-[12px] leading-5 ${value ? "text-ink-2" : "text-ink-4"}`}>{value || "Not clear yet"}</p>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="py-3 text-[12px] leading-5 text-ink-4">{text}</p>;
}

function OutputCard({ label, icon, ready, onOpen, action, onAction }: { label: string; icon: React.ReactNode; ready: boolean; onOpen: () => void; action?: string; onAction?: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-raised p-3">
      <div className="flex items-center justify-between gap-2">
        <span className={ready ? "text-ink-2" : "text-ink-4"}>{icon}</span>
        <span className={`size-2 rounded-full ${ready ? "bg-temper" : "bg-line-strong"}`} />
      </div>
      <p className="mt-3 text-[12px] font-medium">{label}</p>
      <p className="mt-0.5 text-[10px] text-ink-4">{ready ? "Ready" : "Not created yet"}</p>
      {ready ? (
        <button onClick={onOpen} className="mt-3 text-[11px] font-medium text-spark hover:underline">Open</button>
      ) : action && onAction ? (
        <button onClick={onAction} className="mt-3 text-[11px] font-medium text-spark hover:underline">{action}</button>
      ) : null}
    </div>
  );
}
