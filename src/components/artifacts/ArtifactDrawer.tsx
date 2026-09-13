import { AppWindow, Copy, ExternalLink, FlaskConical, X } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button, Pill, SeverityBadge } from "../ui/primitives";
import type { ArtifactKind } from "../../types";

const titles: Record<ArtifactKind, string> = {
  brief: "Product model",
  thesis: "Product directions",
  spec: "Decision-backed spec",
  prototype: "Prototype",
  eval: "Eval report",
};

export function ArtifactDrawer() {
  const f = useForge();
  const conv = f.conv;
  if (!conv || !conv.artifact || !f.artifactOpen) return null;

  return (
    <>
      <button className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]" aria-label="Close output" onClick={() => f.setArtifactOpen(false)} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[680px] flex-col border-l border-line bg-surface shadow-[var(--shadow-float)] sm:w-[min(680px,88vw)]">
        <header className="flex h-14 items-center justify-between border-b border-line px-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-4">Build output</p>
            <h2 className="font-display text-[15px] font-semibold">{titles[conv.artifact]}</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={() => f.setArtifactOpen(false)} aria-label="Close"><X className="size-4" /></Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
          <Tab id="brief" label="Model" disabled={!conv.productModel.summary && conv.brief.length === 0} />
          <Tab id="thesis" label="Directions" disabled={conv.theses.length === 0} />
          <Tab id="spec" label="Spec" disabled={!conv.spec} />
          <Tab id="prototype" label="Prototype" disabled={!conv.prototype} />
          <Tab id="eval" label="Eval" disabled={!conv.evalReport} />
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-thin">
          {conv.artifact === "brief" && <ModelView />}
          {conv.artifact === "thesis" && <DirectionsView />}
          {conv.artifact === "spec" && <SpecView />}
          {conv.artifact === "prototype" && <PrototypeView />}
          {conv.artifact === "eval" && <EvalView />}
        </div>
      </aside>
    </>
  );
}

function Tab({ id, label, disabled }: { id: ArtifactKind; label: string; disabled: boolean }) {
  const f = useForge();
  return <button disabled={disabled} onClick={() => f.openArtifact(id)} className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] disabled:opacity-25 ${f.conv?.artifact === id ? "bg-inset font-medium text-ink" : "text-ink-3 hover:bg-inset"}`}>{label}</button>;
}

function ModelView() {
  const f = useForge();
  const model = f.conv!.productModel;
  return <div className="space-y-6">
    <section>
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-4">Current frame</p>
      <p className="mt-2 text-[15px] leading-6 text-ink">{model.summary || "Forge is still forming the product model."}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Field label="Primary user" value={model.primaryUser} />
        <Field label="Opportunity" value={model.opportunity} />
        <Field label="Current workaround" value={model.currentWorkaround} />
        <Field label="Desired outcome" value={model.desiredOutcome} />
      </div>
    </section>
    <ListSection title="Evidence" empty="No grounded evidence yet." items={model.evidence.map((x) => ({ id: x.id, text: x.claim, meta: `${x.strength} · ${x.source}` }))} />
    <ListSection title="Assumptions" empty="No active assumptions." items={model.assumptions.map((x) => ({ id: x.id, text: x.claim, meta: `${x.risk} · ${x.status}` }))} />
    <ListSection title="Product decisions" empty="No explicit decision recorded yet." items={model.decisions.map((x) => ({ id: x.id, text: x.question, meta: x.status === "decided" ? `Decided: ${x.decision}` : `Open · ${x.recommendation || "No recommendation yet"}` }))} />
    <ListSection title="Validation queue" empty="Unknowns that need external evidence will appear here." items={model.validationTasks.map((x) => ({ id: x.id, text: x.test, meta: `Success: ${x.successSignal}` }))} />
  </div>;
}

function DirectionsView() {
  const f = useForge();
  const conv = f.conv!;
  return <div className="space-y-3">
    <p className="text-[12px] leading-5 text-ink-3">These are competing product bets. Forge recommends one; you make the decision.</p>
    {conv.theses.map((t) => {
      const selected = conv.selectedThesis === t.id;
      return <button key={t.id} onClick={() => f.selectThesis(t.id)} className={`w-full rounded-xl border p-4 text-left ${selected ? "border-spark/50 bg-spark-soft" : "border-line bg-raised hover:border-line-strong"}`}>
        <div className="flex items-center justify-between gap-2"><span className="text-[10px] uppercase tracking-wide text-ink-4">Option {t.id}</span>{t.recommended && <Pill tone="temper">Recommended</Pill>}</div>
        <p className="mt-1.5 font-display text-[14px] font-semibold">{t.title}</p>
        <p className="mt-1 text-[12px] leading-5 text-ink-3">{t.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]"><div><p className="font-medium text-temper">Could win because</p><p className="mt-0.5 text-ink-3">{t.pros[0] || "—"}</p></div><div><p className="font-medium text-scorch">Largest risk</p><p className="mt-0.5 text-ink-3">{t.risks[0] || "—"}</p></div></div>
      </button>;
    })}
    <Button variant="temper" className="w-full" onClick={f.lockThesis} disabled={f.generating}>Choose selected direction</Button>
  </div>;
}

function SpecView() {
  const f = useForge();
  const spec = f.conv?.spec;
  if (!spec) return <Empty text="No spec yet." />;
  const p0 = spec.requirements.filter((r) => r.priority === "P0");
  return <div className="space-y-6">
    <div><p className="text-[10px] uppercase tracking-wide text-ink-4">Chosen direction</p><p className="mt-1 text-[14px] font-medium">{spec.thesis}</p><p className="mt-2 text-[12px] leading-5 text-ink-3">{spec.overview}</p></div>
    <section><div className="flex items-center justify-between"><h3 className="text-[12px] font-medium">V1 requirements</h3><Pill>{p0.length} P0</Pill></div><div className="mt-2 space-y-2">{p0.map((r) => <div key={r.id} className="rounded-lg border border-line bg-raised p-3"><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-medium">{r.name}</p><SeverityBadge value={r.risk} /></div><p className="mt-1 text-[11px] leading-5 text-ink-3">{r.story}</p><p className="mt-2 text-[10px] text-ink-4">Trace: {r.source}</p></div>)}</div></section>
    <section><h3 className="text-[12px] font-medium">Validation plan</h3><div className="mt-2 space-y-2">{(spec.validationPlan ?? []).map((item, i) => <div key={i} className="rounded-lg border border-line bg-raised p-3"><Pill>{item.risk}</Pill><p className="mt-2 text-[12px] text-ink-2">{item.assumption}</p><p className="mt-2 text-[11px] text-ink-3"><strong>Test:</strong> {item.test}</p><p className="mt-1 text-[11px] text-ink-3"><strong>Signal:</strong> {item.successSignal}</p></div>)}</div></section>
    <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={f.copySpec}><Copy className="size-3.5" />Copy spec</Button><Button variant="temper" className="flex-1" onClick={f.buildPrototype} disabled={f.generating}><AppWindow className="size-3.5" />Build prototype</Button></div>
  </div>;
}

function PrototypeView() {
  const f = useForge();
  const proto = f.conv?.prototype;
  if (!proto) return <Empty text="No prototype yet." />;
  const openTab = () => { const blob = new Blob([proto.html], { type: "text/html" }); const url = URL.createObjectURL(blob); window.open(url, "_blank", "noopener,noreferrer"); };
  return <div className="flex min-h-[640px] flex-col"><div className="mb-3 flex flex-wrap gap-1.5"><Button size="sm" onClick={f.buildPrototype} disabled={f.generating}>Rebuild</Button><Button size="sm" variant="secondary" onClick={f.copyPrototype}><Copy className="size-3.5" />Copy HTML</Button><Button size="sm" variant="secondary" onClick={f.runEval} disabled={f.generating}><FlaskConical className="size-3.5" />Run eval</Button><Button size="sm" variant="ghost" onClick={openTab}><ExternalLink className="size-3.5" />Open</Button></div><p className="mb-3 text-[11px] text-ink-3">{proto.summary}</p><iframe title="Prototype preview" sandbox="allow-scripts" srcDoc={proto.html} className="min-h-[560px] w-full rounded-[20px] border border-line-strong bg-white" /></div>;
}

function EvalView() {
  const f = useForge();
  const report = f.conv?.evalReport;
  if (!report) return <Empty text="Run an eval after creating a prototype." />;
  return <div className="space-y-5"><div className="rounded-xl border border-line bg-raised p-4"><div className="flex gap-2"><Pill tone="temper">{report.passed} pass</Pill><Pill tone="molten">{report.partial} partial</Pill><Pill tone="scorch">{report.failed} fail</Pill></div><p className="mt-3 text-[13px] leading-5 text-ink-2">{report.summary}</p></div><div className="space-y-2">{report.checks.map((check) => <div key={check.id} className="rounded-lg border border-line bg-raised p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-[12px] font-medium">{check.label}</p><p className="text-[10px] text-ink-4">{check.requirementId}</p></div><Pill tone={check.status === "pass" ? "temper" : check.status === "partial" ? "molten" : "scorch"}>{check.status}</Pill></div><p className="mt-2 text-[11px] leading-5 text-ink-3"><strong>Evidence:</strong> {check.evidence}</p>{check.issue && <p className="mt-1 text-[11px] leading-5 text-ink-3"><strong>Gap:</strong> {check.issue}</p>}{check.recommendation && <p className="mt-1 text-[11px] leading-5 text-ink-3"><strong>Next:</strong> {check.recommendation}</p>}</div>)}</div><Button variant="secondary" className="w-full" onClick={f.runEval} disabled={f.generating}><FlaskConical className="size-3.5" />Run eval again</Button></div>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-line bg-raised p-3"><p className="text-[10px] uppercase tracking-wide text-ink-4">{label}</p><p className={`mt-1 text-[12px] leading-5 ${value ? "text-ink-2" : "text-ink-4"}`}>{value || "Not clear yet"}</p></div>;
}

function ListSection({ title, empty, items }: { title: string; empty: string; items: Array<{ id: string; text: string; meta: string }> }) {
  return <section><div className="flex items-center justify-between"><h3 className="text-[12px] font-medium">{title}</h3><Pill>{items.length}</Pill></div><div className="mt-2 space-y-2">{items.length ? items.map((item) => <div key={item.id} className="rounded-lg border border-line bg-raised p-3"><p className="text-[12px] leading-5 text-ink-2">{item.text}</p><p className="mt-1 text-[10px] text-ink-4">{item.meta}</p></div>) : <Empty text={empty} />}</div></section>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-line px-3 py-4 text-[12px] leading-5 text-ink-4">{text}</p>;
}
