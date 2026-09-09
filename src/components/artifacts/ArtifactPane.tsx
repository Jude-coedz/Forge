import { AppWindow, Copy, ExternalLink, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { whyRecommended } from "../../lib/engine";
import { useForge } from "../../store/ForgeContext";
import { Button, ConfidenceChip, Pill, SeverityBadge } from "../ui/primitives";
import type { ArtifactKind } from "../../types";

export function ArtifactPane() {
  const f = useForge();
  const conv = f.conv;
  if (!conv || !conv.artifact || !f.artifactOpen) return null;

  return (
    <>
      <button
        className="fixed inset-0 z-20 bg-black/40 lg:hidden"
        aria-label="Close artifact"
        onClick={() => f.setArtifactOpen(false)}
      />
      <aside className={cn(
        "fixed inset-y-0 right-0 z-30 flex w-full flex-col border-l border-line bg-surface shadow-[var(--shadow-float)] lg:static lg:z-0 lg:max-w-none",
        conv.artifact === "prototype"
          ? "max-w-none lg:w-[min(58%,40rem)] xl:w-[min(52%,44rem)]"
          : "max-w-xl lg:w-[min(42%,28rem)] xl:w-[min(42%,32rem)]",
      )}>
        <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-4">Artifact</p>
            <h2 className="font-display text-base font-semibold">
              {conv.artifact === "brief" && "Working brief"}
              {conv.artifact === "thesis" && "Product category"}
              {conv.artifact === "spec" && `${conv.spec?.productName ?? conv.productName} spec`}
              {conv.artifact === "prototype" && "Prototype"}
            </h2>
          </div>
          <Button size="icon" variant="ghost" onClick={() => f.setArtifactOpen(false)} aria-label="Close">
            <X className="size-4" />
          </Button>
        </header>
        {conv.phase !== "idle" && (
          <nav className="flex gap-1 border-b border-line px-3 py-2">
            <Tab id="brief" label="Brief" active={conv.artifact === "brief"} disabled={conv.brief.length === 0} />
            <Tab id="thesis" label="Category" active={conv.artifact === "thesis"} disabled={conv.theses.length === 0} />
            <Tab id="spec" label="Spec" active={conv.artifact === "spec"} disabled={!conv.spec} />
            <Tab id="prototype" label="Prototype" active={conv.artifact === "prototype"} disabled={!conv.prototype} />
          </nav>
        )}
        {conv.artifact === "prototype" ? (
          <PrototypePreview />
        ) : (
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

function Tab({
  id,
  label,
  active,
  disabled,
}: {
  id: ArtifactKind;
  label: string;
  active: boolean;
  disabled: boolean;
}) {
  const f = useForge();
  return (
    <button
      disabled={disabled}
      onClick={() => f.openArtifact(id)}
      className={cn(
        "rounded-lg px-2.5 py-1 text-[12px] disabled:opacity-30",
        active ? "bg-spark-soft text-ink" : "text-ink-3 hover:bg-inset",
      )}
    >
      {label}
    </button>
  );
}

function BriefDoc() {
  const f = useForge();
  const conv = f.conv;
  if (!conv) return null;

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-pretty text-ink-3">
        Confirm what is true. Mark what you are still guessing. Then lock a category — I will not write a spec before
        that.
      </p>
      {conv.brief.map((item) => (
        <div key={item.id} className="rounded-xl border border-line bg-raised p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-medium">{item.label}</p>
            <ConfidenceChip value={item.confidence} />
          </div>
          <p className="mt-1 text-[13px] text-pretty text-ink-2">{item.body}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button size="sm" variant={item.confirmed ? "temper" : "secondary"} onClick={() => f.confirmBrief(item.id)}>
              {item.confirmed ? "Confirmed" : "Confirm"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => f.markAssumption(item.id)}>
              Assumption
            </Button>
          </div>
        </div>
      ))}
      <Button className="w-full" onClick={() => f.sendChat("Looks right — continue to the category decision.")}>
        Continue to category
      </Button>
    </div>
  );
}

function ThesisDoc() {
  const f = useForge();
  const conv = f.conv;
  if (!conv) return null;
  const why = whyRecommended(conv);

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-pretty text-ink-3">
        This is the gate. Pick the category of product, then lock it. Spec comes after — not before.
      </p>
      {conv.theses.map((t) => {
        const selected = conv.selectedThesis === t.id;
        return (
          <button
            key={t.id}
            onClick={() => f.selectThesis(t.id)}
            className={cn(
              "w-full rounded-xl border p-3 text-left",
              selected ? "border-spark bg-spark-soft" : "border-line bg-raised hover:bg-canvas",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-ink-4">Option {t.id}</span>
              {t.recommended && <Pill tone="temper">Recommended</Pill>}
            </div>
            <p className="mt-1 font-display text-sm font-semibold">{t.title}</p>
            <p className="mt-1 text-[12px] text-pretty text-ink-3">{t.description}</p>
            <p className="mt-2 text-[11px] font-medium text-temper">Fits because</p>
            <ul className="text-[12px] text-ink-2">
              {t.pros.map((p) => (
                <li key={p}>· {p}</li>
              ))}
            </ul>
            <p className="mt-1 text-[11px] font-medium text-scorch">Risks</p>
            <ul className="text-[12px] text-ink-2">
              {t.risks.map((p) => (
                <li key={p}>· {p}</li>
              ))}
            </ul>
          </button>
        );
      })}
      <div className="rounded-xl border border-line bg-raised p-3">
        <p className="text-[12px] font-medium">Why Forge leans B</p>
        <p className="mt-1 text-[13px] text-pretty text-ink-2">{why}</p>
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => f.sendChat("Why not option A? Challenge the recommendation.")}>
          Challenge this
        </Button>
      </div>
      <Button className="w-full" variant="temper" onClick={f.lockThesis} disabled={conv.thesisLocked || f.generating}>
        {conv.thesisLocked ? "Category locked" : `Lock option ${conv.selectedThesis} — then write the spec`}
      </Button>
    </div>
  );
}

function SpecDocView() {
  const f = useForge();
  const spec = f.conv?.spec;
  if (!spec) {
    return <p className="text-sm text-ink-3">Lock a product category first. That is the product.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-4">Thesis</p>
        <p className="mt-1 text-[14px] text-pretty">{spec.thesis}</p>
      </div>
      <p className="text-[13px] text-pretty text-ink-2">{spec.overview}</p>

      <section>
        <h3 className="font-display text-sm font-semibold">Requirements</h3>
        <div className="mt-2 space-y-2">
          {spec.requirements.map((r) => (
            <div key={r.id} className="rounded-xl border border-line bg-raised p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium">
                  {r.id} · {r.name}
                </p>
                <Pill>{r.priority}</Pill>
              </div>
              <p className="mt-1 text-[12px] text-pretty text-ink-3">{r.story}</p>
              <ul className="mt-2 list-disc pl-4 text-[12px] text-ink-2">
                {r.criteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display text-sm font-semibold">Failure modes</h3>
        <p className="mt-1 text-[12px] text-ink-3">The part most specs skip — how this can go wrong.</p>
        <div className="mt-2 space-y-2">
          {spec.failureModes.map((fm) => (
            <div key={fm.id} className="rounded-xl border border-line bg-raised p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium">{fm.title}</p>
                <SeverityBadge value={fm.severity} />
              </div>
              <p className="mt-1 text-[12px] text-pretty text-ink-3">{fm.containment}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display text-sm font-semibold">Open questions</h3>
        <ul className="mt-2 list-disc pl-4 text-[13px] text-ink-2">
          {spec.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2">
        <Button onClick={f.copySpec}>
          <Copy className="size-3.5" />
          Copy spec as markdown
        </Button>
        <Button variant="temper" onClick={f.buildPrototype} disabled={f.generating}>
          <AppWindow className="size-3.5" />
          Build clickable prototype
        </Button>
        <Button variant="secondary" onClick={() => f.later("Hosted export to Lovable / v0 / Cursor")}>
          Publish to Lovable / v0
        </Button>
      </div>
    </div>
  );
}

function PrototypePreview() {
  const f = useForge();
  const proto = f.conv?.prototype;
  if (!proto) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-ink-3">No prototype yet. Build one from the spec.</p>
        <Button onClick={f.buildPrototype} disabled={!f.conv?.spec || f.generating}>
          Build clickable prototype
        </Button>
      </div>
    );
  }

  const openTab = () => {
    const blob = new Blob([proto.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-inset">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-surface px-3 py-2">
        <Button size="sm" onClick={f.buildPrototype} disabled={f.generating}>
          Rebuild
        </Button>
        <Button size="sm" variant="secondary" onClick={f.copyPrototype}>
          <Copy className="size-3.5" />
          Copy HTML
        </Button>
        <Button size="sm" variant="ghost" onClick={openTab}>
          <ExternalLink className="size-3.5" />
          Open
        </Button>
      </div>
      <p className="px-3 py-2 text-[11px] text-ink-3">{proto.summary}</p>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto px-3 pb-3">
        <iframe
          title="Prototype preview"
          sandbox="allow-scripts"
          srcDoc={proto.html}
          className="h-full min-h-[520px] w-full max-w-[390px] rounded-[28px] border border-line-strong bg-white shadow-[var(--shadow-float)]"
        />
      </div>
    </div>
  );
}
