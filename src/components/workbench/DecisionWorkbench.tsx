import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight,
  ClipboardCopy, Code2, ExternalLink, Monitor, Pencil,
  RefreshCw, Search, Smartphone, X,
} from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import type { Conversation, StressFinding, ThesisOption } from "../../types";
import { Button } from "../ui/primitives";

type View = "hypothesis" | "stress" | "directions" | "prototype";

const riskLabels: Record<StressFinding["risk"], string> = {
  value: "Desirability",
  usability: "Behavior",
  feasibility: "Feasibility",
  viability: "Viability",
};
const evidenceLabels: Record<StressFinding["evidenceState"], string> = {
  missing: "Evidence missing",
  partial: "Some evidence",
  contested: "Conflicting evidence",
};

function availableViews(conv: Conversation): View[] {
  return [
    "hypothesis",
    ...(conv.stressTest ? ["stress" as View] : []),
    ...(conv.theses.length ? ["directions" as View] : []),
    ...(conv.prototype ? ["prototype" as View] : []),
  ];
}

export function DecisionWorkbench() {
  const f = useForge();
  const conv = f.conv!;
  const [view, setView] = useState<View>("hypothesis");
  const [showContext, setShowContext] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (conv.prototype) setView("prototype");
    else if (conv.theses.length) setView("directions");
    else if (conv.stressTest) setView("stress");
    else setView("hypothesis");
  }, [conv.id, conv.prototype?.builtAt, conv.theses.length, conv.stressTest?.createdAt]);

  const views = availableViews(conv);
  const sendContext = () => {
    const text = note.trim();
    if (!text) return;
    f.sendChat(text);
    setNote("");
    setShowContext(false);
    setView("hypothesis");
  };

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto w-full max-w-[1260px] px-5 pb-24 pt-7 sm:px-9 xl:px-14">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex items-center gap-3">
            <span className="forge-eyebrow text-ink-4">Decision lab</span>
            <span className="h-1 w-1 rounded-full bg-ink-4" />
            <span className="max-w-[300px] truncate text-[13px] text-ink-3">{conv.productName || conv.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowContext((prev) => !prev)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-[13px] text-ink-2 transition hover:border-ink-3 hover:text-ink"
              aria-expanded={showContext}
              aria-controls="forge-context-editor"
            >
              {showContext ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
              {showContext ? "Close notes" : "Add context"}
            </button>
          </div>
        </div>

        {showContext && (
          <section id="forge-context-editor" className="forge-panel-enter my-5 max-w-[760px] rounded-lg border border-line-strong bg-raised p-5">
            <p className="text-[15px] font-medium text-ink">What did Forge miss?</p>
            <p className="mt-1 text-[13px] leading-6 text-ink-3">Add real observations, constraints, or a correction. This will update the working hypothesis, not start a separate chat.</p>
            <textarea
              autoFocus
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="For example: customers already use spreadsheets, but only once a month…"
              rows={3}
              className="mt-4 w-full resize-y rounded-lg border border-line-strong bg-canvas p-4 text-[15px] leading-7 text-ink outline-none focus-visible:outline-offset-2"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[12px] text-ink-4">Only what you provide is treated as user evidence.</span>
              <Button onClick={sendContext} disabled={!note.trim() || f.generating}>Update idea <ArrowRight className="size-4" /></Button>
            </div>
          </section>
        )}

        <nav aria-label="Decision artifacts" className="mt-6 flex flex-wrap gap-2">
          {views.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={
                "rounded-full border px-4 py-2 text-[13px] transition-colors " +
                (view === id
                  ? "border-white bg-white text-black"
                  : "border-line-strong text-ink-3 hover:border-ink-3 hover:text-ink")
              }
              aria-current={view === id ? "step" : undefined}
            >
              {id === "hypothesis" ? "Idea" : id === "stress" ? "Stress test" : id === "directions" ? "Directions" : "Prototype"}
            </button>
          ))}
        </nav>

        {view === "hypothesis" && <HypothesisView conv={conv} onStress={() => { setView("stress"); f.stressTestIdea(); }} onResearch={() => f.researchIdea()} />}
        {view === "stress" && <StressView
          conv={conv}
          onBack={() => setView("hypothesis")}
          onDirections={() => { setView("directions"); f.advanceToDirections(); }}
          onPrototype={() => { setView("prototype"); f.prototypeCurrentIdea(); }}
        />}
        {view === "directions" && <DirectionsView conv={conv} onBack={() => setView("stress")} onBuild={() => { setView("prototype"); f.buildChosenPrototype(); }} />}
        {view === "prototype" && <PrototypeView conv={conv} onBack={() => setView(conv.theses.length ? "directions" : "stress")} />}
      </div>
    </main>
  );
}

function HypothesisView({
  conv, onStress, onResearch,
}: { conv: Conversation; onStress: () => void; onResearch: () => void }) {
  const f = useForge();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    summary: conv.productModel.summary,
    primaryUser: conv.productModel.primaryUser,
    opportunity: conv.productModel.opportunity,
    currentWorkaround: conv.productModel.currentWorkaround,
    desiredOutcome: conv.productModel.desiredOutcome,
  });

  useEffect(() => {
    if (editing) return;
    setDraft({
      summary: conv.productModel.summary,
      primaryUser: conv.productModel.primaryUser,
      opportunity: conv.productModel.opportunity,
      currentWorkaround: conv.productModel.currentWorkaround,
      desiredOutcome: conv.productModel.desiredOutcome,
    });
  }, [
    editing, conv.productModel.summary, conv.productModel.primaryUser,
    conv.productModel.opportunity, conv.productModel.currentWorkaround, conv.productModel.desiredOutcome,
  ]);

  const model = conv.productModel;
  const initialInput = conv.messages.find((message) => message.role === "user")?.text ?? "";
  const hasModel = Boolean(model.summary || model.opportunity || model.primaryUser);

  if (!hasModel) {
    return (
      <section className="forge-panel-enter max-w-[800px] py-14">
        <p className="forge-eyebrow text-ink-4">{f.generating ? "Extracting your idea" : "Idea saved"}</p>
        <h1 className="forge-display mt-5 text-[36px] leading-[1.12] sm:text-[54px]">
          {f.generating ? "Finding what really needs to be true." : "Your idea is here. The analysis isn't yet."}
        </h1>
        <p className="mt-5 max-w-[670px] whitespace-pre-wrap text-[16px] leading-8 text-ink-3">{initialInput}</p>
        {!f.generating && <p className="mt-6 text-[14px] text-ink-4">Use Add context to retry or clarify the idea. Your original input has not been lost.</p>}
        {f.generating && <ProcessingBar label="Building your hypothesis" />}
      </section>
    );
  }

  return (
    <div className="forge-panel-enter pt-12">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(290px,.7fr)] xl:gap-20">
        <section className="max-w-[800px]">
          <p className="forge-eyebrow text-ink-4">01 / Your hypothesis</p>
          <h1 className="forge-display mt-5 text-[39px] leading-[1.06] text-ink sm:text-[58px]">
            {conv.productName || conv.title}
          </h1>
          {editing ? (
            <div className="mt-8 space-y-4">
              <EditableRow label="The idea" value={draft.summary} onChange={(value) => setDraft((prev) => ({ ...prev, summary: value }))} />
              <EditableRow label="Who needs it" value={draft.primaryUser} onChange={(value) => setDraft((prev) => ({ ...prev, primaryUser: value }))} />
              <EditableRow label="The problem" value={draft.opportunity} onChange={(value) => setDraft((prev) => ({ ...prev, opportunity: value }))} />
              <EditableRow label="Current workaround" value={draft.currentWorkaround} onChange={(value) => setDraft((prev) => ({ ...prev, currentWorkaround: value }))} />
              <EditableRow label="Better outcome" value={draft.desiredOutcome} onChange={(value) => setDraft((prev) => ({ ...prev, desiredOutcome: value }))} />
              <div className="flex gap-2">
                <Button onClick={() => { f.updateProductModelFields(draft); setEditing(false); }}>Save changes</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-6 text-[19px] leading-[1.65] text-ink-2">{model.summary || model.opportunity}</p>
              <div className="mt-8 divide-y divide-line border-y border-line">
                <FactRow label="For" value={model.primaryUser} />
                <FactRow label="Problem" value={model.opportunity} />
                <FactRow label="Today" value={model.currentWorkaround} />
                <FactRow label="Better outcome" value={model.desiredOutcome} />
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-5 inline-flex items-center gap-2 text-[13px] text-ink-3 transition hover:text-white"
              >
                <Pencil className="size-3.5" /> Correct this hypothesis
              </button>
            </>
          )}
        </section>

        <aside className="lg:pt-2">
          <div className="border-t border-white/40 pt-6">
            <span className="forge-eyebrow text-ink-4">The part people skip</span>
            <h2 className="forge-display mt-4 text-[27px] leading-[1.17] text-white sm:text-[31px]">
              What if your idea works, but nobody needs it?
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-ink-3">
              Forge will try to disprove the assumptions behind your idea and design a real-world test before you commit to building.
            </p>
            <Button className="mt-8" onClick={onStress} disabled={f.generating || editing}>
              {f.generating ? "Analyzing…" : conv.stressTest ? "Run stress test again" : "Stress-test this idea"}
              <ArrowRight className="size-4" />
            </Button>
            {f.generating && <ProcessingBar label="Testing the weakest assumptions" />}
            <div className="mt-8 border-t border-line pt-5">
              <button
                type="button"
                onClick={onResearch}
                disabled={f.generating}
                className="inline-flex items-center gap-2 text-[13px] text-ink-3 transition hover:text-white disabled:opacity-40"
              >
                <Search className="size-4" /> {conv.research ? "Refresh market evidence" : "Check existing alternatives"} <ArrowRight className="size-3.5" />
              </button>
              <p className="mt-2 text-[12px] leading-5 text-ink-4">External research supports the decision; it cannot prove demand on its own.</p>
            </div>
          </div>
        </aside>
      </div>

      {conv.research && (
        <details className="group mt-12 border-y border-line py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] text-ink-2">
            Market evidence <span className="flex items-center gap-2 text-ink-4">{conv.research.alternatives.length} alternatives <ChevronDown className="size-4 transition group-open:rotate-180" /></span>
          </summary>
          <p className="mt-5 max-w-[850px] text-[15px] leading-7 text-ink-2">{conv.research.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {conv.research.sources.map((source) => (
              <a key={source.url} href={source.url} rel="noreferrer" target="_blank" className="rounded-full border border-line-strong px-3 py-1.5 text-[12px] text-ink-3 hover:text-white">
                {source.title || "Source"} <ExternalLink className="ml-1 inline size-3" />
              </a>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[125px_1fr] sm:gap-6">
      <span className="text-[13px] text-ink-4">{label}</span>
      <p className="text-[15px] leading-6 text-ink-2">{value}</p>
    </div>
  );
}

function EditableRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[12px] text-ink-3">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)}
        rows={2} className="mt-1.5 w-full resize-y rounded-lg border border-line-strong bg-raised p-3 text-[15px] leading-7 text-ink outline-none" />
    </label>
  );
}

function StressView({
  conv, onBack, onDirections, onPrototype,
}: { conv: Conversation; onBack: () => void; onDirections: () => void; onPrototype: () => void }) {
  const f = useForge();
  const report = conv.stressTest;
  const [activeIndex, setActiveIndex] = useState(0);
  const current = report?.findings[activeIndex] || report?.findings[0];

  if (!report || !current) return <PendingScreen title="Finding the idea's breaking points" subtitle="Not a confidence score. Forge is looking for the assumptions that would make building this a mistake." busy={f.generating} onRetry={f.stressTestIdea} />;

  return (
    <div className="forge-panel-enter pt-12">
      <div className="max-w-[870px]">
        <p className="forge-eyebrow text-ink-4">02 / Adversarial review</p>
        <h1 className="forge-display mt-5 text-[41px] leading-[1.05] text-white sm:text-[62px]">Let's try to break it.</h1>
        <p className="mt-5 text-[18px] leading-8 text-ink-2">{report.strongestCounterargument}</p>
        <p className="mt-3 text-[13px] text-ink-4">Reasoned risks, not proof that the idea will fail.</p>
      </div>

      <div className="mt-11 grid overflow-hidden rounded-lg border border-line-strong bg-raised lg:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]">
        <div className="border-b border-line lg:border-b-0 lg:border-r">
          <div className="border-b border-line px-5 py-4"><span className="forge-eyebrow text-ink-4">Pressure points / {report.findings.length}</span></div>
          {report.findings.map((item, index) => (
            <button key={item.id} type="button" onClick={() => setActiveIndex(index)}
              className={
                "flex w-full items-start gap-4 border-b border-line px-5 py-5 text-left transition-colors last:border-0 " +
                (item.id === current.id ? "bg-[#25272b] text-white" : "text-ink-3 hover:bg-inset hover:text-white")
              }
              aria-pressed={item.id === current.id}>
              <span className="font-mono text-[12px] text-ink-4">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-6">{item.title}</span>
                <span className="mt-2 block text-[12px] text-ink-4">{riskLabels[item.risk]}</span>
              </span>
              {item.id === current.id && <ArrowRight className="mt-1 size-4 shrink-0 text-white" />}
            </button>
          ))}
        </div>
        <article key={current.id} className="forge-detail-enter min-h-[450px] p-6 sm:p-9">
          <span className="forge-eyebrow text-ink-4">{evidenceLabels[current.evidenceState]} / {riskLabels[current.risk]}</span>
          <h2 className="forge-display mt-5 text-[30px] leading-[1.15] text-white sm:text-[40px]">{current.assumption}</h2>
          <div className="mt-8 grid gap-7 sm:grid-cols-2">
            <Explain label="Why this could kill the idea">{current.whyItMatters}</Explain>
            <Explain label="What would prove it wrong">{current.falsification}</Explain>
          </div>
          <div className="mt-8 border-t border-line pt-7">
            <span className="forge-eyebrow text-ink-4">Cheapest test</span>
            <p className="mt-3 max-w-[620px] text-[16px] leading-7 text-ink-2">{current.fastestTest}</p>
          </div>
        </article>
      </div>

      <div className="mt-9 grid gap-8 border-t border-line pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.6fr)]">
        <section>
          <p className="forge-eyebrow text-ink-4">Run this before building</p>
          <p className="mt-4 text-[20px] leading-8 text-white">{report.firstExperiment.hypothesis}</p>
          <p className="mt-3 text-[15px] leading-7 text-ink-2">{report.firstExperiment.method}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Explain label="Evidence that supports continuing">{report.firstExperiment.successSignal}</Explain>
            <Explain label="Evidence that should stop or redirect">{report.firstExperiment.stopSignal}</Explain>
          </div>
        </section>
        <aside>
          <p className="forge-eyebrow text-ink-4">Provisional decision</p>
          <p className="mt-3 text-[18px] leading-7 text-white">
            {report.recommendation === "reframe" ? "Reframe the problem" : report.recommendation === "investigate" ? "Investigate before committing" : "Proceed to a real test"}
          </p>
          <p className="mt-3 text-[14px] leading-7 text-ink-3">{report.recommendationReason}</p>
          <Button className="mt-7" onClick={onPrototype} disabled={f.generating}>
            Build a prototype of this test <ArrowRight className="size-4" />
          </Button>
          <button type="button" onClick={onDirections} disabled={f.generating} className="mt-4 flex items-center gap-2 text-[13px] text-ink-2 transition hover:text-white disabled:opacity-40">
            Explore other product directions <ChevronRight className="size-4" />
          </button>
          <button type="button" onClick={onBack} className="mt-4 flex items-center gap-2 text-[13px] text-ink-4 hover:text-white">
            <ArrowLeft className="size-4" /> Rework the idea
          </button>
        </aside>
      </div>
    </div>
  );
}

function Explain({ label, children }: { label: string; children: ReactNode }) {
  return <div><span className="forge-eyebrow text-ink-4">{label}</span><p className="mt-3 text-[14px] leading-7 text-ink-2">{children}</p></div>;
}

function DirectionsView({
  conv, onBack, onBuild,
}: { conv: Conversation; onBack: () => void; onBuild: () => void }) {
  const f = useForge();
  if (!conv.theses.length) return <PendingScreen title="Comparing different ways to solve it" subtitle="These should be different products, not three feature bundles." busy={f.generating} onRetry={f.advanceToDirections} />;

  return (
    <div className="forge-panel-enter pt-12">
      <div className="max-w-[780px]">
        <p className="forge-eyebrow text-ink-4">03 / Choose a mechanism</p>
        <h1 className="forge-display mt-5 text-[40px] leading-[1.08] sm:text-[58px]">What deserves a prototype?</h1>
        <p className="mt-4 text-[17px] leading-7 text-ink-3">Three ways to address the problem. Select the one whose riskiest interaction is worth testing first.</p>
      </div>
      <div className="mt-10 grid gap-3 lg:grid-cols-3">
        {conv.theses.map((option, index) => (
          <DirectionChoice key={option.id} option={option} number={index + 1}
            selected={option.id === conv.selectedThesis} onClick={() => f.selectThesis(option.id)} />
        ))}
      </div>
      <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-7">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-ink-4 hover:text-white"><ArrowLeft className="size-4" /> Revisit risks</button>
        <Button onClick={onBuild} disabled={f.generating}> {f.generating ? "Building…" : "Build the selected prototype"} <ArrowRight className="size-4" /></Button>
      </div>
    </div>
  );
}

function DirectionChoice({ option, number, selected, onClick }: { option: ThesisOption; number: number; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={"flex min-h-[335px] flex-col rounded-lg border p-6 text-left transition-[background-color,border-color,transform] duration-200 " +
        (selected ? "border-white bg-raised" : "border-line-strong bg-[#101113] hover:-translate-y-0.5 hover:border-ink-3")}>
      <div className="flex items-center justify-between gap-3">
        <span className="forge-eyebrow text-ink-4">Option {String(number).padStart(2, "0")}</span>
        <span className={"grid size-6 place-items-center rounded-full border " + (selected ? "border-white bg-white text-black" : "border-line-strong")}>{selected && <Check className="size-3.5" />}</span>
      </div>
      <h2 className="forge-display mt-7 text-[25px] leading-[1.2] text-white">{option.title}</h2>
      <p className="mt-3 text-[14px] leading-7 text-ink-2">{option.description}</p>
      <div className="mt-auto border-t border-line pt-5">
        <span className="forge-eyebrow text-ink-4">{option.recommended ? "Forge recommendation" : "Most important tradeoff"}</span>
        <p className="mt-2 text-[13px] leading-6 text-ink-3">{option.risks[0] || "The main risk needs further evidence."}</p>
      </div>
    </button>
  );
}

function PrototypeView({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const f = useForge();
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const securedHtml = useMemo(() => conv.prototype ? securePrototypeHtml(conv.prototype.html) : "", [conv.prototype]);
  if (!conv.prototype) return <PendingScreen title="Making the decision tangible" subtitle="Forge is building a working demonstration of the riskiest V1 interaction, not an entire fake SaaS." busy={f.generating} onRetry={conv.theses.length ? f.buildChosenPrototype : f.prototypeCurrentIdea} />;
  return (
    <div className="forge-panel-enter pt-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-[750px]">
          <p className="forge-eyebrow text-ink-4">04 / Interaction prototype</p>
          <h1 className="forge-display mt-4 text-[37px] leading-[1.12] sm:text-[51px]">{conv.spec?.productName || conv.productName}</h1>
          <p className="mt-3 text-[15px] leading-7 text-ink-3">{conv.prototype.summary}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setViewport("desktop")} aria-pressed={viewport === "desktop"} aria-label="Desktop viewport" className={"grid size-10 place-items-center rounded-full border " + (viewport === "desktop" ? "border-white text-white" : "border-line-strong text-ink-4")}><Monitor className="size-4" /></button>
          <button type="button" onClick={() => setViewport("mobile")} aria-pressed={viewport === "mobile"} aria-label="Mobile viewport" className={"grid size-10 place-items-center rounded-full border " + (viewport === "mobile" ? "border-white text-white" : "border-line-strong text-ink-4")}><Smartphone className="size-4" /></button>
          <Button variant="secondary" onClick={f.copyPrototype}><Code2 className="size-4" /> Copy HTML</Button>
        </div>
      </div>
      <div className="mt-7 flex min-h-[620px] justify-center overflow-x-auto rounded-lg border border-line-strong bg-[#15161a] p-4 sm:p-6">
        <div className={"overflow-hidden bg-white transition-[width,border-radius] duration-300 " +
          (viewport === "mobile" ? "h-[710px] w-[390px] max-w-full rounded-[25px] border-[7px] border-[#35373b]" : "h-[710px] w-full rounded-lg")}>
          <iframe key={conv.prototype.builtAt + viewport} title="Interactive product prototype" srcDoc={securedHtml} sandbox="allow-scripts allow-modals" className="h-full w-full border-0 bg-white" />
        </div>
      </div>
      <div className="mt-7 flex flex-wrap justify-between gap-6 border-t border-line pt-6">
        <div className="max-w-[660px]">
          <p className="forge-eyebrow text-ink-4">What this does not prove</p>
          <p className="mt-2 text-[14px] leading-7 text-ink-3">A working demo tests an interaction, not market demand. The experiment in your stress test is still what will change the product decision.</p>
          {conv.spec && <details className="group mt-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] text-ink-2">Read the implementation brief <ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary>
            <p className="mt-3 text-[14px] leading-7 text-ink-3">{conv.spec.overview}</p>
            <button type="button" onClick={f.copySpec} className="mt-2 inline-flex items-center gap-2 text-[13px] text-white"><ClipboardCopy className="size-3.5" /> Copy full brief</button>
          </details>}
        </div>
        <Button variant="secondary" onClick={f.buildPrototype} disabled={f.generating}><RefreshCw className="size-4" /> Regenerate</Button>
      </div>
      <button type="button" onClick={onBack} className="mt-6 inline-flex items-center gap-2 text-[13px] text-ink-4 hover:text-white">
        <ArrowLeft className="size-4" /> {conv.theses.length ? "Directions" : "Stress test"}
      </button>
    </div>
  );
}

function PendingScreen({ title, subtitle, busy, onRetry }: { title: string; subtitle: string; busy: boolean; onRetry: () => void }) {
  return (
    <section className="forge-panel-enter mx-auto max-w-[780px] py-24">
      <span className="forge-eyebrow text-ink-4">{busy ? "Forge is working" : "Nothing generated yet"}</span>
      <h1 className="forge-display mt-6 text-[37px] leading-[1.1] sm:text-[54px]">{title}</h1>
      <p className="mt-5 text-[16px] leading-8 text-ink-3">{subtitle}</p>
      {busy ? <ProcessingBar label="Working through the evidence" /> : <Button className="mt-8" onClick={onRetry}>Try again <ArrowRight className="size-4" /></Button>}
    </section>
  );
}

function ProcessingBar({ label }: { label: string }) {
  return <div role="status" className="mt-6 flex items-center gap-3 text-[13px] text-ink-3"><span className="forge-process-track relative h-[2px] w-20 overflow-hidden bg-line-strong"><span className="forge-process-pulse absolute inset-y-0 left-0 w-1/3 bg-white" /></span>{label}</div>;
}

function securePrototypeHtml(html: string) {
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; media-src data: blob:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none';">`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${policy}`);
  return `<!doctype html><html><head>${policy}</head><body>${html}</body></html>`;
}
