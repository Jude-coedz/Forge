import { useState } from "react";
import { AppWindow, Copy, ExternalLink, MessageSquareText, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useForge } from "../../store/ForgeContext";
import { Button, Pill, SeverityBadge } from "../ui/primitives";
import type { ArtifactKind } from "../../types";

export function ArtifactPane() {
  const f = useForge();
  const conv = f.conv;
  if (!conv || !conv.artifact || !f.artifactOpen) return null;
  const title = conv.artifact === "brief" ? "Decision brief" : conv.artifact === "thesis" ? "Product directions" : conv.artifact === "spec" ? "Decision-backed spec" : "Prototype";

  return (
    <>
      <button className="fixed inset-0 z-20 bg-black/40 lg:hidden" aria-label="Close artifact" onClick={() => f.setArtifactOpen(false)} />
      <aside className={cn(
        "fixed inset-y-0 right-0 z-30 flex w-full flex-col border-l border-line bg-surface shadow-[var(--shadow-float)] lg:static lg:z-0 lg:max-w-none",
        conv.artifact === "prototype" ? "max-w-none lg:w-[min(58%,40rem)]" : "max-w-xl lg:w-[min(42%,30rem)]",
      )}>
        <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-4">Current decision state</p>
            <h2 className="font-display text-base font-semibold">{title}</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={() => f.setArtifactOpen(false)} aria-label="Close"><X className="size-4" /></Button>
        </header>
        <nav className="flex gap-1 border-b border-line px-3 py-2">
          <Tab id="brief" label="Brief" active={conv.artifact === "brief"} disabled={conv.brief.length === 0} />
          <Tab id="thesis" label="Directions" active={conv.artifact === "thesis"} disabled={conv.theses.length === 0} />
          <Tab id="spec" label="Spec" active={conv.artifact === "spec"} disabled={!conv.spec} />
          <Tab id="prototype" label="Prototype" active={conv.artifact === "prototype"} disabled={!conv.prototype} />
        </nav>
        {conv.artifact === "prototype" ? <PrototypePreview /> : (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
            {conv.artifact === "brief" && <BriefDoc />}
            {conv.artifact === "thesis" && <ThesisDoc />}
            {conv.artifact === "spec" && <SpecDocView />}
          </div>
        )}
      </aside>
    </>
  );
}

function Tab({ id, label, active, disabled }: { id: ArtifactKind; label: string; active: boolean; disabled: boolean }) {
  const f = useForge();
  return <button disabled={disabled} onClick={() => f.openArtifact(id)} className={cn("rounded-lg px-2.5 py-1 text-[12px] disabled:opacity-30", active ? "bg-spark-soft text-ink" : "text-ink-3 hover:bg-inset")}>{label}</button>;
}

function BriefDoc() {
  const f = useForge();
  const conv = f.conv;
  if (!conv) return null;
  const evidence = conv.brief.filter((x) => x.provenance === "evidence");
  const inference = conv.brief.filter((x) => x.provenance === "inference");
  const next = conv.questions.find((q) => !q.answered);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-inset p-3">
        <p className="text-[12px] font-medium">What this is</p>
        <p className="mt-1 text-[12px] text-ink-3">A snapshot of the reasoning so far. You do not approve cards here. If something is wrong, say so in chat and Forge will revise it.</p>
      </div>

      <section>
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-ink-4">What we know from you</h3>
        <div className="mt-2 space-y-2">
          {evidence.length ? evidence.map((item) => <BriefCard key={item.id} label={item.label} body={item.body} badge="Evidence" />) : <Empty text="No direct evidence captured yet." />}
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-ink-4">What Forge is inferring</h3>
        <div className="mt-2 space-y-2">
          {inference.length ? inference.slice(0, 4).map((item) => <BriefCard key={item.id} label={item.label} body={item.body} badge="Inference" />) : <Empty text="No active inference needs your attention." />}
        </div>
      </section>

      {next && (
        <section className="rounded-xl border border-spark/40 bg-spark-soft p-3">
          <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-medium uppercase tracking-wide text-ink-4">What blocks the next decision</p><Pill tone="temper">{next.priority}</Pill></div>
          <p className="mt-2 text-[14px] font-medium text-pretty">{next.question}</p>
          <p className="mt-1 text-[12px] text-ink-3">{next.whyItMatters}</p>
        </section>
      )}

      <Button className="w-full" variant="secondary" onClick={() => f.setArtifactOpen(false)}>
        <MessageSquareText className="size-3.5" /> Continue in chat
      </Button>
      <p className="text-center text-[11px] text-ink-4">Answer the latest Forge question in your own words. You never need to repeat the question.</p>
    </div>
  );
}

function BriefCard({ label, body, badge }: { label: string; body: string; badge: string }) {
  return <div className="rounded-xl border border-line bg-raised p-3"><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-medium">{label}</p><Pill>{badge}</Pill></div><p className="mt-1 text-[13px] text-pretty text-ink-2">{body}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-line px-3 py-4 text-[12px] text-ink-4">{text}</p>;
}

function ThesisDoc() {
  const f = useForge();
  const conv = f.conv;
  const [custom, setCustom] = useState("");
  if (!conv) return null;
  const recommended = conv.theses.find((t) => t.recommended);

  return (
    <div className="space-y-4">
      <div><p className="text-[13px] text-ink-2">Choose deliberately. Forge recommends; you decide.</p>{recommended && <p className="mt-1 text-[12px] text-ink-4">Current recommendation: <strong className="text-ink-2">{recommended.title}</strong>.</p>}</div>
      <div className="space-y-2">{conv.theses.map((t) => {
        const selected = conv.selectedThesis === t.id;
        return <button key={t.id} onClick={() => f.selectThesis(t.id)} className={cn("w-full rounded-xl border p-3 text-left", selected ? "border-spark bg-spark-soft" : "border-line bg-raised hover:bg-canvas")}>
          <div className="flex items-center justify-between gap-2"><span className="text-[11px] text-ink-4">{t.userAuthored ? "Your direction" : `Option ${t.id}`}</span>{t.recommended && <Pill tone="temper">Recommended</Pill>}</div>
          <p className="mt-1 font-display text-sm font-semibold">{t.title}</p><p className="mt-1 text-[12px] text-ink-3">{t.description}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]"><div><p className="font-medium text-temper">Why it could work</p><p className="text-ink-3">{t.pros[0] ?? "—"}</p></div><div><p className="font-medium text-scorch">Tradeoff</p><p className="text-ink-3">{t.risks[0] ?? "—"}</p></div></div>
        </button>;
      })}</div>
      <div className="rounded-xl border border-line bg-raised p-3"><p className="text-[12px] font-medium">Your own direction</p><textarea value={custom} onChange={(e) => setCustom(e.target.value)} rows={3} placeholder="Describe what you think should be built…" className="mt-2 w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-[13px] outline-none" /><Button size="sm" className="mt-2" disabled={!custom.trim() || f.generating} onClick={() => { f.sendChat(`I think the product should be: ${custom.trim()}\n\nCritique this against what we learned and tell me what I am missing.`); setCustom(""); f.setArtifactOpen(false); }}>Have Forge critique it</Button></div>
      <div className="flex gap-2"><Button variant="secondary" className="flex-1" disabled={!recommended || f.generating} onClick={() => { f.sendChat(`Challenge your recommendation of ${recommended?.title}. What evidence could make another direction better?`); f.setArtifactOpen(false); }}>Challenge Forge</Button><Button variant="temper" className="flex-1" onClick={f.lockThesis} disabled={f.generating}>Choose selected direction</Button></div>
    </div>
  );
}

function SpecDocView() {
  const f = useForge();
  const spec = f.conv?.spec;
  if (!spec) return <p className="text-sm text-ink-3">Choose a product direction before Forge writes a spec.</p>;
  const p0 = spec.requirements.filter((r) => r.priority === "P0");
  return <div className="space-y-5"><div><p className="text-[11px] font-medium uppercase tracking-wide text-ink-4">Chosen product direction</p><p className="mt-1 text-[14px] font-medium">{spec.thesis}</p><p className="mt-2 text-[13px] text-ink-3">{spec.overview}</p></div><section><h3 className="font-display text-sm font-semibold">Must work in V1</h3><div className="mt-2 space-y-2">{p0.map((r) => <div key={r.id} className="rounded-xl border border-line bg-raised p-3"><p className="text-[13px] font-medium">{r.name}</p><p className="mt-1 text-[12px] text-ink-3">{r.story}</p></div>)}</div></section><section><h3 className="font-display text-sm font-semibold">Risks to design around</h3><div className="mt-2 space-y-2">{spec.failureModes.slice(0, 4).map((fm) => <div key={fm.id} className="rounded-xl border border-line bg-raised p-3"><div className="flex items-center justify-between gap-2"><p className="text-[13px] font-medium">{fm.title}</p><SeverityBadge value={fm.severity} /></div><p className="mt-1 text-[12px] text-ink-3">{fm.containment}</p></div>)}</div></section><div className="flex flex-col gap-2"><Button onClick={f.copySpec}><Copy className="size-3.5" />Copy full spec</Button><Button variant="temper" onClick={f.buildPrototype} disabled={f.generating}><AppWindow className="size-3.5" />Prototype the core workflow</Button></div></div>;
}

function PrototypePreview() {
  const f = useForge();
  const proto = f.conv?.prototype;
  if (!proto) return <div className="flex flex-1 items-center justify-center p-6 text-sm text-ink-3">No prototype yet.</div>;
  const openTab = () => { const blob = new Blob([proto.html], { type: "text/html" }); const url = URL.createObjectURL(blob); window.open(url, "_blank", "noopener,noreferrer"); };
  return <div className="flex min-h-0 flex-1 flex-col bg-inset"><div className="flex gap-1.5 border-b border-line bg-surface px-3 py-2"><Button size="sm" onClick={f.buildPrototype} disabled={f.generating}>Rebuild</Button><Button size="sm" variant="secondary" onClick={f.copyPrototype}><Copy className="size-3.5" />Copy HTML</Button><Button size="sm" variant="ghost" onClick={openTab}><ExternalLink className="size-3.5" />Open</Button></div><p className="px-3 py-2 text-[11px] text-ink-3">{proto.summary}</p><div className="flex min-h-0 flex-1 justify-center overflow-auto px-3 pb-3"><iframe title="Prototype preview" sandbox="allow-scripts" srcDoc={proto.html} className="h-full min-h-[520px] w-full max-w-[420px] rounded-[24px] border border-line-strong bg-white shadow-[var(--shadow-float)]" /></div></div>;
}
