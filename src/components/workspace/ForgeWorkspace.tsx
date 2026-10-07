import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardCopy,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  Lightbulb,
  Monitor,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { clock } from "../../lib/id";
import { useForge } from "../../store/ForgeContext";
import type { Conversation, ProductModel, ThesisOption } from "../../types";
import { Button, Pill, SeverityBadge } from "../ui/primitives";

type ArtifactTab = "model" | "research" | "directions" | "brief" | "prototype";

export function ForgeWorkspace() {
  const f = useForge();
  const conv = f.conv;
  const bottom = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<ArtifactTab>("model");

  useEffect(() => {
    if (!conv) return;
    if (conv.prototype) setTab("prototype");
    else if (conv.spec) setTab("brief");
    else if (conv.theses.length > 0) setTab("directions");
    else if (conv.research) setTab("research");
    else setTab("model");
  }, [conv?.id, conv?.prototype?.builtAt, conv?.spec, conv?.theses.length]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conv?.messages.length, f.generating]);

  if (!conv) return null;

  const openDecision = conv.productModel.decisions.find((item) => item.status === "open");
  const tabs: Array<{ id: ArtifactTab; label: string; available: boolean }> = [
    { id: "model", label: "Idea", available: true },
    { id: "research", label: "Research", available: Boolean(conv.research) },
    { id: "directions", label: "Directions", available: conv.theses.length > 0 },
    { id: "brief", label: "Brief", available: Boolean(conv.spec) },
    { id: "prototype", label: "Prototype", available: Boolean(conv.prototype) },
  ];

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface lg:flex-row">
      <section className="flex min-h-[46%] w-full min-w-0 flex-col border-b border-line lg:min-h-0 lg:w-[430px] lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="shrink-0 border-b border-line px-4 py-3.5 sm:px-5">
          <p className="text-[13px] font-medium text-ink">Forge</p>
          <p className="mt-0.5 text-[12px] text-ink-4">Use chat for reasoning. Use the canvas to inspect and edit the product itself.</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 scrollbar-thin sm:px-5">
          <div className="space-y-6">
            {conv.messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div key={message.id} className={isUser ? "pl-8" : "pr-3"}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={"text-[11px] font-medium " + (isUser ? "text-ink-4" : "text-spark")}>
                      {isUser ? "You" : "Forge"}
                    </span>
                    <span className="text-[10px] text-ink-4/70">{clock(message.createdAt)}</span>
                  </div>
                  <div className={isUser ? "rounded-[16px] bg-inset px-3.5 py-3" : ""}>
                    <p className="whitespace-pre-wrap text-[14px] leading-6 text-ink-2">{message.text}</p>
                  </div>
                </div>
              );
            })}

            {f.generating && (
              <div className="pr-4">
                <div className="mb-1.5 text-[11px] font-medium text-spark">Forge</div>
                <div className="flex items-center gap-2 text-[13px] text-ink-4">
                  <span className="forge-thinking-dot size-2 rounded-full bg-spark" />
                  <span>Working through the product…</span>
                </div>
              </div>
            )}

            {!f.generating && openDecision && !conv.spec && (
              <DecisionPrompt decision={openDecision} />
            )}
            <div ref={bottom} />
          </div>
        </div>

        <WorkspaceComposer
          placeholder={openDecision ? "Answer this in your own words, or keep it uncertain…" : "Add context, correct Forge, or challenge the thinking…"}
        />
      </section>

      <section className="hidden min-h-0 min-w-0 flex-1 flex-col lg:flex">
        <div className="flex h-[49px] shrink-0 items-center justify-between border-b border-line bg-raised/60 px-5">
          <div className="flex items-center gap-1">
            {tabs.filter((item) => item.available).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={
                  "relative rounded-lg px-3 py-1.5 text-[12px] font-medium transition " +
                  (tab === item.id ? "text-ink" : "text-ink-4 hover:text-ink-2")
                }
              >
                {item.label}
                {tab === item.id && <span className="absolute inset-x-3 -bottom-[9px] h-px bg-ink" />}
              </button>
            ))}
          </div>
          <ArtifactActions conv={conv} tab={tab} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {tab === "model" && <ModelArtifact conv={conv} />}
          {tab === "research" && <ResearchArtifact conv={conv} />}
          {tab === "directions" && <DirectionsArtifact conv={conv} />}
          {tab === "brief" && <BriefArtifact conv={conv} />}
          {tab === "prototype" && <PrototypeArtifact conv={conv} />}
        </div>
      </section>

      <section className="min-h-0 min-w-0 flex-1 lg:hidden">
        <MobileArtifact conv={conv} tab={tab} setTab={setTab} />
      </section>
    </main>
  );
}

function WorkspaceComposer({ placeholder }: { placeholder: string }) {
  const f = useForge();

  return (
    <div className="shrink-0 border-t border-line bg-canvas/90 p-3 backdrop-blur-xl">
      <div className="rounded-[18px] border border-line-strong bg-raised p-2 shadow-sm transition focus-within:border-spark/35">
        <textarea
          value={f.composer}
          onChange={(event) => f.setComposer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              f.sendChat();
            }
          }}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-6 text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-1 pb-0.5 pt-1">
          <span className="text-[11px] text-ink-4">Shift + Enter for a new line</span>
          <button
            type="button"
            onClick={() => f.sendChat()}
            disabled={!f.composer.trim() || f.generating}
            className="grid size-8 place-items-center rounded-xl bg-ink text-canvas transition enabled:hover:-translate-y-0.5 disabled:opacity-30"
            aria-label="Send to Forge"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DecisionPrompt({ decision }: { decision: ProductModel["decisions"][number] }) {
  const f = useForge();

  return (
    <div className="rounded-[16px] border border-line-strong bg-raised p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium text-molten">
        <Lightbulb className="size-3.5" />
        Worth clarifying
      </div>
      <p className="mt-2 text-[14px] font-medium leading-5 text-ink">{decision.question}</p>
      {decision.rationale && <p className="mt-1.5 text-[12px] leading-5 text-ink-4">{decision.rationale}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {decision.recommendation && (
          <button
            type="button"
            onClick={() => f.sendChat(`Use your recommendation for this decision: ${decision.recommendation}. Keep the choice reversible where possible.`)}
            className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[11px] font-medium text-ink-3 transition hover:border-line-strong hover:text-ink"
          >
            Use Forge's recommendation
          </button>
        )}
        <button
          type="button"
          onClick={() => f.sendChat("I do not know this yet. Keep it as an explicit assumption and continue using the most reversible option.")}
          className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[11px] font-medium text-ink-3 transition hover:border-line-strong hover:text-ink"
        >
          I don't know yet
        </button>
      </div>
    </div>
  );
}

function ModelArtifact({ conv }: { conv: Conversation }) {
  const f = useForge();
  const model = conv.productModel;
  const hasModel = Boolean(model.summary || model.opportunity || model.primaryUser || model.desiredOutcome);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    summary: model.summary,
    primaryUser: model.primaryUser,
    currentWorkaround: model.currentWorkaround,
    opportunity: model.opportunity,
    desiredOutcome: model.desiredOutcome,
  });

  useEffect(() => {
    if (editing) return;
    setDraft({
      summary: model.summary,
      primaryUser: model.primaryUser,
      currentWorkaround: model.currentWorkaround,
      opportunity: model.opportunity,
      desiredOutcome: model.desiredOutcome,
    });
  }, [
    editing,
    model.summary,
    model.primaryUser,
    model.currentWorkaround,
    model.opportunity,
    model.desiredOutcome,
  ]);

  if (!hasModel && f.generating) {
    return <ArtifactSkeleton />;
  }

  const save = () => {
    f.updateProductModelFields(draft);
    setEditing(false);
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-7 py-9 xl:px-12 xl:py-11">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-[700px]">
          <p className="text-[12px] font-medium text-ink-4">Current understanding</p>
          <h1 className="mt-2 text-[32px] font-medium leading-[1.15] tracking-[-0.035em] text-ink">
            {conv.productName || conv.title || "Untitled idea"}
          </h1>
          {!editing && model.summary && (
            <p className="mt-4 text-[18px] leading-8 text-ink-2">{model.summary}</p>
          )}
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-ink-4 transition hover:bg-inset hover:text-ink"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="grid size-8 place-items-center rounded-lg text-ink-4 transition hover:bg-inset hover:text-ink"
              aria-label="Cancel editing"
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[12px] font-medium text-canvas"
            >
              <Check className="size-3.5" />
              Save
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-8 max-w-[820px] space-y-5">
          <EditField
            label="In one sentence"
            value={draft.summary}
            onChange={(value) => setDraft((current) => ({ ...current, summary: value }))}
            rows={2}
          />
          <EditField
            label="Who feels the problem?"
            value={draft.primaryUser}
            onChange={(value) => setDraft((current) => ({ ...current, primaryUser: value }))}
          />
          <EditField
            label="What happens today?"
            value={draft.currentWorkaround}
            onChange={(value) => setDraft((current) => ({ ...current, currentWorkaround: value }))}
          />
          <EditField
            label="What is actually not working?"
            value={draft.opportunity}
            onChange={(value) => setDraft((current) => ({ ...current, opportunity: value }))}
          />
          <EditField
            label="What would a better outcome look like?"
            value={draft.desiredOutcome}
            onChange={(value) => setDraft((current) => ({ ...current, desiredOutcome: value }))}
          />
        </div>
      ) : (
        <div className="mt-9 max-w-[820px] divide-y divide-line border-y border-line">
          <ModelRow label="Who feels the problem" value={model.primaryUser} />
          <ModelRow label="What happens today" value={model.currentWorkaround} />
          <ModelRow label="What is not working" value={model.opportunity} />
          <ModelRow label="What better looks like" value={model.desiredOutcome} />
        </div>
      )}

      {!editing && (model.evidence.length > 0 || model.assumptions.length > 0) && (
        <div className="mt-9 grid max-w-[860px] gap-8 md:grid-cols-2">
          <ArtifactSection title="What supports the idea">
            {model.evidence.length > 0 ? (
              <div className="space-y-3">
                {model.evidence.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex gap-3 text-[14px] leading-6 text-ink-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-temper" />
                    <span>{item.claim}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] leading-6 text-ink-4">
                No real evidence has been added yet. Forge is treating this as a working hypothesis.
              </p>
            )}
          </ArtifactSection>

          <ArtifactSection title="What still needs proving">
            {model.assumptions.length > 0 ? (
              <div className="space-y-3">
                {model.assumptions.filter((item) => item.status === "untested").slice(0, 4).map((item) => (
                  <div key={item.id} className="flex gap-3 text-[14px] leading-6 text-ink-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-molten" />
                    <span>{item.claim}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] leading-6 text-ink-4">
                Forge has not identified a major unproven assumption yet.
              </p>
            )}
          </ArtifactSection>
        </div>
      )}

      {!editing && (
        <div className="mt-11 max-w-[860px] rounded-[16px] border border-line bg-raised/55 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-ink">Next useful move</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-4">
                Compare genuinely different ways this product could solve the problem before deciding what to prototype.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" disabled={f.generating || !hasModel} onClick={f.researchIdea}>
                <Search className="size-3.5" />
                {conv.research ? "Refresh research" : "Research the market"}
              </Button>
              <Button variant="primary" disabled={f.generating || !hasModel} onClick={f.advanceToDirections}>
                Explore directions
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-ink-4">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-y rounded-[12px] border border-line-strong bg-raised px-3.5 py-3 text-[14px] leading-6 text-ink outline-none transition focus:border-spark/35"
      />
    </label>
  );
}

function ModelRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:gap-8">
      <span className="text-[13px] text-ink-4">{label}</span>
      <span className="text-[15px] leading-6 text-ink-2">{value}</span>
    </div>
  );
}

function ResearchArtifact({ conv }: { conv: Conversation }) {
  const f = useForge();
  const research = conv.research;

  if (!research) return <ArtifactSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[940px] px-7 py-9 xl:px-12 xl:py-11">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-[720px]">
          <p className="text-[12px] font-medium text-ink-4">Current market evidence</p>
          <h1 className="mt-2 text-[31px] font-medium leading-[1.16] tracking-[-0.035em] text-ink">
            What changed after looking outside the idea
          </h1>
          <p className="mt-4 text-[16px] leading-7 text-ink-2">{research.summary}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={f.researchIdea} disabled={f.generating}>
          <RefreshCw className={"size-3.5 " + (f.generating ? "animate-spin" : "")} />
          Refresh
        </Button>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,.85fr)]">
        <section>
          <p className="text-[12px] font-medium text-ink-4">Signals</p>
          <div className="mt-3 divide-y divide-line border-y border-line">
            {research.signals.map((signal, index) => (
              <div key={signal.title + index} className="grid gap-2 py-5 sm:grid-cols-[110px_1fr] sm:gap-5">
                <span className={
                  "mt-0.5 w-fit rounded-full px-2 py-0.5 text-[10px] font-medium " +
                  (signal.stance === "supports"
                    ? "bg-temper-soft text-temper"
                    : signal.stance === "challenges"
                      ? "bg-scorch-soft text-scorch"
                      : "bg-inset text-ink-4")
                }>
                  {signal.stance === "supports" ? "Supports" : signal.stance === "challenges" ? "Challenges" : "Context"}
                </span>
                <div>
                  <p className="text-[14px] font-medium text-ink">{signal.title}</p>
                  <p className="mt-1 text-[13px] leading-6 text-ink-3">{signal.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[12px] font-medium text-ink-4">Existing alternatives</p>
          <div className="mt-3 space-y-3">
            {research.alternatives.length > 0 ? research.alternatives.map((item) => (
              <div key={item.name} className="rounded-[14px] border border-line bg-raised/60 p-4">
                <p className="text-[13px] font-medium text-ink">{item.name}</p>
                <p className="mt-1 text-[12px] leading-5 text-ink-3">{item.description}</p>
                <p className="mt-2 text-[11px] leading-5 text-ink-4">{item.relevance}</p>
              </div>
            )) : (
              <p className="text-[13px] leading-6 text-ink-4">No directly relevant alternative was strong enough to include.</p>
            )}
          </div>
        </section>
      </div>

      {research.unresolved.length > 0 && (
        <section className="mt-9 rounded-[16px] border border-molten/20 bg-molten-soft/35 p-5">
          <p className="text-[12px] font-medium text-molten">Search still cannot prove</p>
          <ul className="mt-3 space-y-2">
            {research.unresolved.map((item) => (
              <li key={item} className="flex gap-3 text-[13px] leading-6 text-ink-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-molten" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {research.sources.length > 0 && (
        <section className="mt-9 border-t border-line pt-6">
          <p className="text-[12px] font-medium text-ink-4">Sources</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {research.sources.map((source, index) => (
              <a
                key={source.url + index}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[11px] text-ink-3 transition hover:border-line-strong hover:text-ink"
              >
                <span className="max-w-[240px] truncate">{source.title || new URL(source.url).hostname}</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="max-w-xl text-[12px] leading-5 text-ink-4">
          External evidence changes the hypothesis; it does not automatically prove demand or willingness to switch.
        </p>
        <Button variant="primary" disabled={f.generating} onClick={f.advanceToDirections}>
          Explore directions
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ArtifactSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-4 text-[12px] font-medium text-ink-4">{title}</p>
      {children}
    </section>
  );
}

function DirectionsArtifact({ conv }: { conv: Conversation }) {
  const f = useForge();
  const selected = conv.theses.find((item) => item.id === conv.selectedThesis);

  return (
    <div className="mx-auto w-full max-w-[980px] px-8 py-10 xl:px-12 xl:py-12">
      <div className="max-w-[720px]">
        <p className="text-[12px] font-medium text-ink-4">Product directions</p>
        <h1 className="mt-2 text-[32px] font-medium tracking-[-0.035em] text-ink">Three ways this product could work.</h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-3">
          Forge is keeping the options meaningfully different so you can choose a product mechanism, not a blended feature list.
        </p>
      </div>

      <div className="mt-9 overflow-hidden rounded-[16px] border border-line-strong bg-raised">
        {conv.theses.map((option, index) => (
          <DirectionRow
            key={option.id}
            option={option}
            index={index}
            selected={conv.selectedThesis === option.id}
            onSelect={() => f.selectThesis(option.id)}
          />
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <button
          type="button"
          onClick={() => f.setComposer("These directions are missing something important. Here is what Forge has not accounted for: ")}
          className="text-[13px] font-medium text-ink-4 transition hover:text-ink"
        >
          None of these feel right
        </button>
        <Button variant="primary" disabled={!selected || f.generating} onClick={f.lockThesis}>
          {f.generating ? "Building the brief…" : selected ? `Choose ${selected.title}` : "Choose a direction"}
          {!f.generating && <ChevronRight className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function DirectionRow({
  option,
  index,
  selected,
  onSelect,
}: {
  option: ThesisOption;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "grid w-full gap-5 border-b border-line p-5 text-left transition last:border-b-0 md:grid-cols-[44px_1.2fr_1fr_1fr] md:items-start " +
        (selected ? "bg-spark-soft/50" : "hover:bg-canvas/70")
      }
    >
      <span className={
        "grid size-8 place-items-center rounded-full border text-[12px] font-medium " +
        (selected ? "border-spark bg-spark text-white" : "border-line-strong text-ink-4")
      }>
        {selected ? <Check className="size-3.5" /> : String.fromCharCode(65 + index)}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[16px] font-medium text-ink">{option.title}</p>
          {option.recommended && <Pill tone="spark">Forge pick</Pill>}
        </div>
        <p className="mt-1.5 text-[13px] leading-6 text-ink-3">{option.description}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium text-ink-4">Why it could win</p>
        <p className="mt-2 text-[13px] leading-5 text-ink-2">{option.pros[0] || "No clear advantage captured."}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium text-ink-4">Biggest risk</p>
        <p className="mt-2 text-[13px] leading-5 text-ink-2">{option.risks[0] || "No major risk captured."}</p>
      </div>
    </button>
  );
}

function BriefArtifact({ conv }: { conv: Conversation }) {
  const f = useForge();
  const spec = conv.spec;
  if (!spec) return <ArtifactSkeleton />;

  const p0 = spec.requirements.filter((item) => item.priority === "P0");

  return (
    <div className="mx-auto w-full max-w-[900px] px-8 py-10 xl:px-12 xl:py-12">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-[680px]">
          <p className="text-[12px] font-medium text-ink-4">Build brief</p>
          <h1 className="mt-2 text-[32px] font-medium tracking-[-0.035em] text-ink">{spec.productName}</h1>
          <p className="mt-3 text-[17px] leading-8 text-ink-2">{spec.overview}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={f.copySpec}>
          <ClipboardCopy className="size-3.5" />
          Copy brief
        </Button>
      </div>

      <div className="mt-10 border-y border-line">
        <BriefBlock title="Chosen direction">
          <p className="text-[18px] font-medium leading-7 text-ink">{spec.thesis}</p>
        </BriefBlock>

        <BriefBlock title="Must exist in V1">
          <div className="space-y-5">
            {p0.map((item, index) => (
              <div key={item.id} className="grid gap-2 sm:grid-cols-[30px_1fr]">
                <span className="font-mono text-[10px] text-ink-4">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-[15px] font-medium text-ink">{item.name}</p>
                  <p className="mt-1 text-[13px] leading-6 text-ink-3">{item.story}</p>
                </div>
              </div>
            ))}
          </div>
        </BriefBlock>

        <BriefBlock title="Explicitly not V1">
          <ul className="space-y-2">
            {spec.nonGoals.map((item) => (
              <li key={item} className="flex gap-3 text-[14px] leading-6 text-ink-2">
                <span className="text-ink-4">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </BriefBlock>

        {(spec.failureModes.length > 0 || spec.validationPlan.length > 0) && (
          <BriefBlock title="Do not lose sight of">
            <div className="grid gap-6 md:grid-cols-2">
              {spec.failureModes.slice(0, 3).map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-medium text-ink">{item.title}</p>
                    <SeverityBadge value={item.severity} />
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-ink-4">{item.containment}</p>
                </div>
              ))}
              {spec.validationPlan.slice(0, 2).map((item, index) => (
                <div key={item.assumption + index}>
                  <p className="text-[11px] font-medium text-molten">Unproven assumption</p>
                  <p className="mt-1 text-[13px] leading-5 text-ink-2">{item.assumption}</p>
                  <p className="mt-1 text-[12px] leading-5 text-ink-4">Test: {item.test}</p>
                </div>
              ))}
            </div>
          </BriefBlock>
        )}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-lg text-[13px] leading-5 text-ink-4">
          The prototype should test the core interaction in this brief, not decorate it.
        </p>
        <Button variant="primary" onClick={f.buildPrototype} disabled={f.generating}>
          {f.generating ? "Building prototype…" : conv.prototype ? "Regenerate prototype" : "Build working prototype"}
          {!f.generating && <Code2 className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function BriefBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-b border-line py-7 last:border-b-0 md:grid-cols-[170px_1fr]">
      <p className="text-[12px] font-medium text-ink-4">{title}</p>
      <div>{children}</div>
    </section>
  );
}

function PrototypeArtifact({ conv }: { conv: Conversation }) {
  const f = useForge();
  const prototype = conv.prototype;
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const securedHtml = useMemo(() => prototype ? securePrototypeHtml(prototype.html) : "", [prototype]);

  if (!prototype) return <ArtifactSkeleton />;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div>
          <p className="text-[13px] font-medium text-ink">Working prototype</p>
          <p className="mt-0.5 text-[11px] text-ink-4">{prototype.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line bg-canvas p-0.5">
            <PreviewButton active={viewport === "desktop"} onClick={() => setViewport("desktop")} label="Desktop">
              <Monitor className="size-3.5" />
            </PreviewButton>
            <PreviewButton active={viewport === "mobile"} onClick={() => setViewport("mobile")} label="Mobile">
              <Smartphone className="size-3.5" />
            </PreviewButton>
          </div>
          <Button size="sm" variant="secondary" onClick={f.copyPrototype}>
            <Copy className="size-3.5" />
            Copy HTML
          </Button>
          <Button size="sm" variant="ghost" onClick={f.buildPrototype} disabled={f.generating}>
            <RefreshCw className={"size-3.5 " + (f.generating ? "animate-spin" : "")} />
            Regenerate
          </Button>
        </div>
      </div>

      <div className="flex min-h-[680px] flex-1 items-start justify-center overflow-auto bg-[#ececeb] p-4 dark:bg-[#11110f]">
        <div
          className={
            "overflow-hidden bg-white shadow-[0_30px_80px_-45px_rgba(0,0,0,.45)] transition-[width,border-radius] duration-300 " +
            (viewport === "mobile"
              ? "h-[720px] w-[390px] max-w-full rounded-[28px] border-[7px] border-[#1e1e1d]"
              : "h-[720px] w-full max-w-[1200px] rounded-xl border border-black/10")
          }
        >
          <iframe
            key={prototype.builtAt + viewport}
            title={"Interactive prototype for " + (conv.productName || conv.title)}
            srcDoc={securedHtml}
            sandbox="allow-scripts allow-modals"
            className="h-full w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}

function PreviewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={"grid size-7 place-items-center rounded-md transition " + (active ? "bg-raised text-ink shadow-sm" : "text-ink-4 hover:text-ink")}
    >
      {children}
    </button>
  );
}

function ArtifactActions({ conv, tab }: { conv: Conversation; tab: ArtifactTab }) {
  const f = useForge();

  if (tab === "brief" && conv.spec) {
    return (
      <button type="button" onClick={f.copySpec} className="flex items-center gap-1.5 text-[11px] font-medium text-ink-4 hover:text-ink">
        <FileText className="size-3.5" />
        Copy brief
      </button>
    );
  }

  if (tab === "prototype" && conv.prototype) {
    return (
      <button type="button" onClick={f.copyPrototype} className="flex items-center gap-1.5 text-[11px] font-medium text-ink-4 hover:text-ink">
        <Code2 className="size-3.5" />
        Copy prototype
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-4">
      <Sparkles className="size-3.5 text-spark" />
      Updates as you work
    </span>
  );
}

function ArtifactSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-8 py-12 xl:px-12">
      <div className="max-w-[700px]">
        <div className="forge-shimmer h-3 w-28 rounded-full bg-inset" />
        <div className="forge-shimmer mt-4 h-9 w-3/5 rounded-xl bg-inset [animation-delay:100ms]" />
        <div className="forge-shimmer mt-4 h-4 w-full rounded-lg bg-inset [animation-delay:160ms]" />
        <div className="forge-shimmer mt-2 h-4 w-4/5 rounded-lg bg-inset [animation-delay:220ms]" />
      </div>
      <div className="mt-10 max-w-[800px] divide-y divide-line border-y border-line">
        {[0, 1, 2].map((item) => (
          <div key={item} className="grid grid-cols-[180px_1fr] gap-8 py-5">
            <div className="forge-shimmer h-3 w-24 rounded bg-inset" />
            <div className="forge-shimmer h-4 w-4/5 rounded bg-inset" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileArtifact({
  conv,
  tab,
  setTab,
}: {
  conv: Conversation;
  tab: ArtifactTab;
  setTab: (tab: ArtifactTab) => void;
}) {
  const tabs: Array<{ id: ArtifactTab; label: string; available: boolean }> = [
    { id: "model", label: "Idea", available: true },
    { id: "research", label: "Research", available: Boolean(conv.research) },
    { id: "directions", label: "Directions", available: conv.theses.length > 0 },
    { id: "brief", label: "Brief", available: Boolean(conv.spec) },
    { id: "prototype", label: "Prototype", available: Boolean(conv.prototype) },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-raised px-3 py-2">
        {tabs.filter((item) => item.available).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={"rounded-lg px-3 py-1.5 text-[12px] font-medium " + (tab === item.id ? "bg-inset text-ink" : "text-ink-4")}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "model" && <ModelArtifact conv={conv} />}
        {tab === "research" && <ResearchArtifact conv={conv} />}
        {tab === "directions" && <DirectionsArtifact conv={conv} />}
        {tab === "brief" && <BriefArtifact conv={conv} />}
        {tab === "prototype" && <PrototypeArtifact conv={conv} />}
      </div>
    </div>
  );
}

function securePrototypeHtml(html: string) {
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; media-src data: blob:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none';">`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${policy}`);
  }

  return `<!doctype html><html><head>${policy}</head><body>${html}</body></html>`;
}
