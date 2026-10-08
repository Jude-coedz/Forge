import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardCopy,
  Code2,
  Copy,
  ExternalLink,
  Lightbulb,
  Monitor,
  Pencil,
  RefreshCw,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import type { Conversation, ProductModel, ThesisOption } from "../../types";
import { Button, Pill, SeverityBadge } from "../ui/primitives";
import { Composer } from "../chat/Composer";

type ArtifactTab = "model" | "research" | "directions" | "brief" | "prototype";
type EditableField = "summary" | "primaryUser" | "currentWorkaround" | "opportunity" | "desiredOutcome";

export function ForgeWorkspace() {
  const f = useForge();
  const conv = f.conv;
  const bottom = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<ArtifactTab>("model");
  const [mobilePane, setMobilePane] = useState<"chat" | "canvas">("chat");

  useEffect(() => {
    if (!conv) return;
    if (conv.prototype) setTab("prototype");
    else if (conv.spec) setTab("brief");
    else if (conv.theses.length > 0) setTab("directions");
    else if (conv.research) setTab("research");
    else setTab("model");
  }, [conv?.id, conv?.prototype?.builtAt, conv?.spec, conv?.theses.length, conv?.research?.researchedAt]);

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
      <div className="flex shrink-0 border-b border-line bg-canvas px-3 py-2 lg:hidden">
        <div className="flex rounded-lg bg-inset p-0.5">
          <MobilePaneButton active={mobilePane === "chat"} onClick={() => setMobilePane("chat")}>
            Chat
          </MobilePaneButton>
          <MobilePaneButton active={mobilePane === "canvas"} onClick={() => setMobilePane("canvas")}>
            Canvas
          </MobilePaneButton>
        </div>
      </div>

      <section className={(mobilePane === "chat" ? "flex" : "hidden") + " min-h-0 w-full min-w-0 flex-1 flex-col bg-surface lg:flex lg:w-[440px] lg:flex-none lg:border-r xl:w-[490px]"}>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 scrollbar-thin sm:px-7">
          <div className="mx-auto max-w-[640px] space-y-7">
            {conv.messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div key={message.id} className={isUser ? "flex justify-end" : ""}>
                  {isUser ? (
                    <div className="max-w-[88%] rounded-lg bg-inset px-4 py-3.5">
                      <p className="whitespace-pre-wrap text-[16px] leading-7 text-ink-2">{message.text}</p>
                    </div>
                  ) : (
                    <div className="forge-message-enter max-w-[94%]">
                      <p className="mb-2 forge-eyebrow text-ink-4">Forge</p>
                      <p className="whitespace-pre-wrap text-[16px] leading-7 text-ink-2">{message.text}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {f.generating && (
              <div className="forge-message-enter">
                <p className="mb-2 text-[12px] font-medium text-spark">Forge</p>
                <div className="flex items-center gap-2.5 text-[14px] text-ink-4">
                  <span className="flex items-center gap-1" aria-hidden>
                    <span className="forge-thinking-dot size-1.5 rounded-full bg-spark [animation-delay:0ms]" />
                    <span className="forge-thinking-dot size-1.5 rounded-full bg-spark [animation-delay:120ms]" />
                    <span className="forge-thinking-dot size-1.5 rounded-full bg-spark [animation-delay:240ms]" />
                  </span>
                  Thinking through the product
                </div>
              </div>
            )}

            {!f.generating && openDecision && !conv.spec && (
              <DecisionPrompt decision={openDecision} />
            )}

            <div ref={bottom} />
          </div>
        </div>

        <div className="shrink-0 border-t border-line bg-canvas/92 p-3.5 backdrop-blur-xl">
          <Composer
            compact
            placeholder={openDecision ? "Answer the open question, correct Forge, or add more context…" : "Add context, challenge the thinking, or correct anything Forge got wrong…"}
          />
        </div>
      </section>

      <section className="hidden min-h-0 min-w-0 flex-1 flex-col bg-raised/20 lg:flex">
        <CanvasTabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {tab === "model" && <ModelArtifact conv={conv} />}
          {tab === "research" && <ResearchArtifact conv={conv} />}
          {tab === "directions" && <DirectionsArtifact conv={conv} />}
          {tab === "brief" && <BriefArtifact conv={conv} />}
          {tab === "prototype" && <PrototypeArtifact conv={conv} />}
        </div>
      </section>

      <section className={(mobilePane === "canvas" ? "flex" : "hidden") + " min-h-0 min-w-0 flex-1 flex-col lg:hidden"}>
        <CanvasTabs tabs={tabs} active={tab} onChange={setTab} compact />
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {tab === "model" && <ModelArtifact conv={conv} />}
          {tab === "research" && <ResearchArtifact conv={conv} />}
          {tab === "directions" && <DirectionsArtifact conv={conv} />}
          {tab === "brief" && <BriefArtifact conv={conv} />}
          {tab === "prototype" && <PrototypeArtifact conv={conv} />}
        </div>
      </section>
    </main>
  );
}

function MobilePaneButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"rounded-md px-3 py-1.5 text-[13px] font-medium transition " + (active ? "bg-raised text-ink shadow-sm" : "text-ink-4")}
    >
      {children}
    </button>
  );
}

function CanvasTabs({
  tabs,
  active,
  onChange,
  compact = false,
}: {
  tabs: Array<{ id: ArtifactTab; label: string; available: boolean }>;
  active: ArtifactTab;
  onChange: (tab: ArtifactTab) => void;
  compact?: boolean;
}) {
  return (
    <div className={"flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-surface/80 backdrop-blur " + (compact ? "px-3 py-2" : "h-[52px] px-7")}>
      {tabs.filter((item) => item.available).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={
            "relative shrink-0 rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors " +
            (active === item.id ? "text-ink" : "text-ink-4 hover:text-ink-2")
          }
        >
          {item.label}
          {active === item.id && <span className="absolute inset-x-3 -bottom-[9px] h-px bg-ink" />}
        </button>
      ))}
    </div>
  );
}

function DecisionPrompt({ decision }: { decision: ProductModel["decisions"][number] }) {
  const f = useForge();

  return (
    <div className="forge-message-enter border-l-2 border-molten/45 pl-4">
      <div className="flex items-center gap-2 text-[12px] font-medium text-molten">
        <Lightbulb className="size-3.5" />
        One decision changes the product
      </div>
      <p className="mt-2 text-[16px] font-medium leading-7 text-ink">{decision.question}</p>
      {decision.rationale && <p className="mt-1.5 text-[14px] leading-6 text-ink-4">{decision.rationale}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {decision.recommendation && (
          <button
            type="button"
            onClick={() => f.sendChat(`Use your recommendation for this decision: ${decision.recommendation}. Keep the choice reversible where possible.`)}
            className="rounded-lg bg-inset px-3 py-1.5 text-[13px] font-medium text-ink-2 transition hover:bg-line-strong"
          >
            Use Forge's suggestion
          </button>
        )}
        <button
          type="button"
          onClick={() => f.sendChat("I do not know this yet. Keep it as an explicit assumption and continue using the most reversible option.")}
          className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-4 transition hover:bg-inset hover:text-ink"
        >
          Keep it uncertain
        </button>
      </div>
    </div>
  );
}

function ModelArtifact({ conv }: { conv: Conversation }) {
  const f = useForge();
  const model = conv.productModel;
  const hasModel = Boolean(model.summary || model.opportunity || model.primaryUser || model.desiredOutcome);
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState("");

  if (!hasModel && f.generating) return <ArtifactSkeleton />;

  const beginEdit = (field: EditableField, value: string) => {
    setEditing(field);
    setDraft(value);
  };

  const saveEdit = () => {
    if (!editing) return;
    f.updateProductModelFields({ [editing]: draft } as Partial<Pick<ProductModel, EditableField>>);
    setEditing(null);
  };

  return (
    <div className="forge-content-enter mx-auto w-full max-w-[940px] px-7 py-9 xl:px-12 xl:py-12">
      <div className="max-w-[760px]">
        <p className="forge-eyebrow text-ink-4">Current hypothesis</p>
        <h1 className="mt-2 forge-display text-[36px] leading-[1.12] text-ink">
          {conv.productName || conv.title || "Untitled idea"}
        </h1>

        <EditableText
          field="summary"
          label="Summary"
          value={model.summary}
          editing={editing}
          draft={draft}
          onBegin={beginEdit}
          onDraft={setDraft}
          onSave={saveEdit}
          onCancel={() => setEditing(null)}
          prominent
        />

        <div className="mt-7 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={f.generating || !hasModel} onClick={f.researchIdea}>
            <Search className="size-4" />
            {f.generating ? "Working…" : conv.research ? "Refresh research" : "Research the market"}
          </Button>
          <Button variant="primary" disabled={f.generating || !hasModel} onClick={f.advanceToDirections}>
            Explore directions
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-10 max-w-[840px] border-y border-line">
        <EditableText
          field="primaryUser"
          label="Who has this problem?"
          value={model.primaryUser}
          editing={editing}
          draft={draft}
          onBegin={beginEdit}
          onDraft={setDraft}
          onSave={saveEdit}
          onCancel={() => setEditing(null)}
        />
        <EditableText
          field="currentWorkaround"
          label="What happens today?"
          value={model.currentWorkaround}
          editing={editing}
          draft={draft}
          onBegin={beginEdit}
          onDraft={setDraft}
          onSave={saveEdit}
          onCancel={() => setEditing(null)}
        />
        <EditableText
          field="opportunity"
          label="What is actually broken?"
          value={model.opportunity}
          editing={editing}
          draft={draft}
          onBegin={beginEdit}
          onDraft={setDraft}
          onSave={saveEdit}
          onCancel={() => setEditing(null)}
        />
        <EditableText
          field="desiredOutcome"
          label="What would better look like?"
          value={model.desiredOutcome}
          editing={editing}
          draft={draft}
          onBegin={beginEdit}
          onDraft={setDraft}
          onSave={saveEdit}
          onCancel={() => setEditing(null)}
        />
      </div>

      {(model.evidence.length > 0 || model.assumptions.length > 0) && (
        <div className="mt-9 max-w-[840px] divide-y divide-line border-t border-line">
          <EvidenceDisclosure
            title="Evidence already in the idea"
            count={model.evidence.length}
            tone="temper"
          >
            {model.evidence.length > 0 ? model.evidence.slice(0, 5).map((item) => (
              <li key={item.id} className="flex gap-3 text-[15px] leading-7 text-ink-2">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-temper" />
                <span>{item.claim}</span>
              </li>
            )) : <li className="text-[15px] leading-7 text-ink-4">No direct evidence has been added yet.</li>}
          </EvidenceDisclosure>

          <EvidenceDisclosure
            title="Assumptions that still need proving"
            count={model.assumptions.filter((item) => item.status === "untested").length}
            tone="molten"
          >
            {model.assumptions.filter((item) => item.status === "untested").slice(0, 5).map((item) => (
              <li key={item.id} className="flex gap-3 text-[15px] leading-7 text-ink-2">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-molten" />
                <span>{item.claim}</span>
              </li>
            ))}
          </EvidenceDisclosure>
        </div>
      )}
    </div>
  );
}

function EditableText({
  field,
  label,
  value,
  editing,
  draft,
  onBegin,
  onDraft,
  onSave,
  onCancel,
  prominent = false,
}: {
  field: EditableField;
  label: string;
  value: string;
  editing: EditableField | null;
  draft: string;
  onBegin: (field: EditableField, value: string) => void;
  onDraft: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  prominent?: boolean;
}) {
  if (!value && editing !== field) return null;

  if (editing === field) {
    return (
      <div className={prominent ? "mt-5" : "grid gap-3 border-b border-line py-6 last:border-b-0 sm:grid-cols-[190px_1fr]"}>
        {!prominent && <span className="pt-2 text-[13px] text-ink-4">{label}</span>}
        <div>
          <textarea
            autoFocus
            rows={prominent ? 3 : 4}
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            className="w-full resize-y rounded-xl border border-line-strong bg-raised px-3.5 py-3 text-[16px] leading-7 text-ink outline-none focus:border-line-strong"
          />
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={onSave} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12px] font-medium text-canvas">
              <Check className="size-3.5" />
              Save
            </button>
            <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-ink-4 hover:bg-inset">
              <X className="size-3.5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (prominent) {
    return (
      <div className="group relative mt-5 max-w-[760px] pr-9">
        <p className="text-[19px] leading-8 text-ink-2">{value}</p>
        <button
          type="button"
          onClick={() => onBegin(field, value)}
          className="absolute right-0 top-1 grid size-7 place-items-center rounded-lg text-ink-4 opacity-0 transition group-hover:opacity-100 hover:bg-inset hover:text-ink focus:opacity-100"
          aria-label={"Edit " + label}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group grid gap-2 border-b border-line py-6 last:border-b-0 sm:grid-cols-[190px_1fr] sm:gap-8">
      <span className="text-[13px] text-ink-4">{label}</span>
      <div className="relative pr-9">
        <p className="text-[16px] leading-7 text-ink-2">{value}</p>
        <button
          type="button"
          onClick={() => onBegin(field, value)}
          className="absolute right-0 top-0 grid size-7 place-items-center rounded-lg text-ink-4 opacity-0 transition group-hover:opacity-100 hover:bg-inset hover:text-ink focus:opacity-100"
          aria-label={"Edit " + label}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function EvidenceDisclosure({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone: "temper" | "molten";
  children: ReactNode;
}) {
  return (
    <details className="group py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className={"size-1.5 rounded-full " + (tone === "temper" ? "bg-temper" : "bg-molten")} />
          <span className="text-[14px] font-medium text-ink-2">{title}</span>
          <span className="text-[12px] text-ink-4">{count}</span>
        </div>
        <ChevronRight className="size-4 text-ink-4 transition-transform group-open:rotate-90" />
      </summary>
      <ul className="mt-4 space-y-2 pl-4">{children}</ul>
    </details>
  );
}

function ResearchArtifact({ conv }: { conv: Conversation }) {
  const f = useForge();
  const research = conv.research;
  if (!research) return <ArtifactSkeleton />;

  return (
    <div className="forge-content-enter mx-auto w-full max-w-[960px] px-7 py-9 xl:px-12 xl:py-12">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-[740px]">
          <p className="text-[13px] font-medium text-ink-4">Market check</p>
          <h1 className="mt-2 forge-display text-[34px] leading-[1.15] tracking-[-0.035em] text-ink">
            What changes after looking outside the idea
          </h1>
          <p className="mt-4 text-[17px] leading-8 text-ink-2">{research.summary}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={f.researchIdea} disabled={f.generating}>
          <RefreshCw className={"size-3.5 " + (f.generating ? "animate-spin" : "")} />
          Refresh
        </Button>
      </div>

      <section className="mt-10 max-w-[860px]">
        <p className="text-[13px] font-medium text-ink-4">Signals</p>
        <div className="mt-3 divide-y divide-line border-y border-line">
          {research.signals.map((signal, index) => (
            <div key={signal.title + index} className="grid gap-3 py-5 sm:grid-cols-[110px_1fr] sm:gap-6">
              <span className={
                "mt-0.5 w-fit rounded-full px-2 py-0.5 text-[11px] font-medium " +
                (signal.stance === "supports"
                  ? "bg-temper-soft text-temper"
                  : signal.stance === "challenges"
                    ? "bg-scorch-soft text-scorch"
                    : "bg-inset text-ink-4")
              }>
                {signal.stance === "supports" ? "Supports" : signal.stance === "challenges" ? "Challenges" : "Context"}
              </span>
              <div>
                <p className="text-[15px] font-medium text-ink">{signal.title}</p>
                <p className="mt-1 text-[14px] leading-7 text-ink-3">{signal.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {research.alternatives.length > 0 && (
        <section className="mt-9 max-w-[860px]">
          <p className="text-[13px] font-medium text-ink-4">Existing alternatives and substitutes</p>
          <div className="mt-3 divide-y divide-line border-y border-line">
            {research.alternatives.map((item) => (
              <div key={item.name} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
                <p className="text-[15px] font-medium text-ink">{item.name}</p>
                <div>
                  <p className="text-[14px] leading-6 text-ink-2">{item.description}</p>
                  <p className="mt-1 text-[13px] leading-6 text-ink-4">{item.relevance}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {research.unresolved.length > 0 && (
        <section className="mt-9 max-w-[860px]">
          <p className="text-[13px] font-medium text-molten">Search still cannot prove</p>
          <ul className="mt-3 space-y-2.5">
            {research.unresolved.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-7 text-ink-2">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-molten" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {research.sources.length > 0 && (
        <section className="mt-9 max-w-[860px] border-t border-line pt-6">
          <p className="text-[13px] font-medium text-ink-4">Sources</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {research.sources.map((source, index) => (
              <a
                key={source.url + index}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[12px] text-ink-3 transition hover:border-line-strong hover:text-ink"
              >
                <span className="max-w-[260px] truncate">{source.title || new URL(source.url).hostname}</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 max-w-[860px] border-t border-line pt-6">
        <Button variant="primary" disabled={f.generating} onClick={f.advanceToDirections}>
          Explore directions
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function DirectionsArtifact({ conv }: { conv: Conversation }) {
  const f = useForge();
  const selected = conv.theses.find((item) => item.id === conv.selectedThesis);

  return (
    <div className="forge-content-enter mx-auto w-full max-w-[980px] px-7 py-9 xl:px-12 xl:py-12">
      <div className="max-w-[760px]">
        <p className="text-[13px] font-medium text-ink-4">Directions</p>
        <h1 className="mt-2 text-[34px] font-[480] tracking-[-0.035em] text-ink">Three ways this product could work.</h1>
        <p className="mt-3 text-[16px] leading-7 text-ink-3">
          These differ by product mechanism, not just feature scope. Choose the one you believe is most worth testing.
        </p>
      </div>

      <div className="mt-9 overflow-hidden border-y border-line">
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

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => f.setComposer("These directions are missing something important. Here is what Forge has not accounted for: ")}
          className="text-[14px] font-medium text-ink-4 transition hover:text-ink"
        >
          None of these feel right
        </button>
        <Button variant="primary" disabled={!selected || f.generating} onClick={f.lockThesis}>
          {f.generating ? "Building the brief…" : selected ? `Choose ${selected.title}` : "Choose a direction"}
          {!f.generating && <ChevronRight className="size-4" />}
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
        "grid w-full gap-5 border-b border-line px-1 py-6 text-left transition-colors last:border-b-0 md:grid-cols-[44px_1.25fr_1fr_1fr] md:items-start " +
        (selected ? "bg-inset/70" : "hover:bg-inset/45")
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
          <p className="text-[17px] font-medium text-ink">{option.title}</p>
          {option.recommended && <Pill tone="spark">Forge pick</Pill>}
        </div>
        <p className="mt-1.5 text-[14px] leading-6 text-ink-3">{option.description}</p>
      </div>
      <div>
        <p className="text-[12px] font-medium text-ink-4">Why it could win</p>
        <p className="mt-2 text-[14px] leading-6 text-ink-2">{option.pros[0] || "No clear advantage captured."}</p>
      </div>
      <div>
        <p className="text-[12px] font-medium text-ink-4">Biggest risk</p>
        <p className="mt-2 text-[14px] leading-6 text-ink-2">{option.risks[0] || "No major risk captured."}</p>
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
    <div className="forge-content-enter mx-auto w-full max-w-[940px] px-7 py-9 xl:px-12 xl:py-12">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-[700px]">
          <p className="text-[13px] font-medium text-ink-4">Build brief</p>
          <h1 className="mt-2 text-[34px] font-[480] tracking-[-0.035em] text-ink">{spec.productName}</h1>
          <p className="mt-4 text-[17px] leading-8 text-ink-2">{spec.overview}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={f.copySpec}>
          <ClipboardCopy className="size-3.5" />
          Copy
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
                <span className="font-mono text-[11px] text-ink-4">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-[16px] font-medium text-ink">{item.name}</p>
                  <p className="mt-1 text-[14px] leading-6 text-ink-3">{item.story}</p>
                </div>
              </div>
            ))}
          </div>
        </BriefBlock>

        <BriefBlock title="Explicitly not V1">
          <ul className="space-y-2">
            {spec.nonGoals.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-7 text-ink-2">
                <span className="text-ink-4">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </BriefBlock>

        {(spec.failureModes.length > 0 || spec.validationPlan.length > 0) && (
          <BriefBlock title="Keep visible">
            <div className="grid gap-6 md:grid-cols-2">
              {spec.failureModes.slice(0, 3).map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] font-medium text-ink">{item.title}</p>
                    <SeverityBadge value={item.severity} />
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-ink-4">{item.containment}</p>
                </div>
              ))}
              {spec.validationPlan.slice(0, 2).map((item, index) => (
                <div key={item.assumption + index}>
                  <p className="text-[12px] font-medium text-molten">Unproven assumption</p>
                  <p className="mt-1 text-[14px] leading-6 text-ink-2">{item.assumption}</p>
                  <p className="mt-1 text-[13px] leading-6 text-ink-4">Test: {item.test}</p>
                </div>
              ))}
            </div>
          </BriefBlock>
        )}
      </div>

      <div className="mt-7">
        <Button variant="primary" onClick={f.buildPrototype} disabled={f.generating}>
          {f.generating ? "Building prototype…" : conv.prototype ? "Regenerate prototype" : "Build working prototype"}
          {!f.generating && <Code2 className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

function BriefBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-b border-line py-7 last:border-b-0 md:grid-cols-[170px_1fr]">
      <p className="text-[13px] font-medium text-ink-4">{title}</p>
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
    <div className="forge-content-enter flex min-h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <p className="text-[14px] font-medium text-ink">Working prototype</p>
          <p className="mt-0.5 max-w-2xl text-[12px] text-ink-4">{prototype.summary}</p>
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

      <div className="flex min-h-[680px] flex-1 items-start justify-center overflow-auto bg-[#ecebe7] p-4 dark:bg-[#11110f]">
        <div
          className={
            "overflow-hidden bg-white shadow-[0_30px_80px_-45px_rgba(0,0,0,.38)] transition-[width,border-radius] duration-300 " +
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

function ArtifactSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[940px] px-7 py-12 xl:px-12">
      <div className="max-w-[720px]">
        <div className="forge-shimmer h-3 w-28 rounded-full bg-inset" />
        <div className="forge-shimmer mt-4 h-9 w-3/5 rounded-xl bg-inset [animation-delay:100ms]" />
        <div className="forge-shimmer mt-4 h-4 w-full rounded-lg bg-inset [animation-delay:160ms]" />
        <div className="forge-shimmer mt-2 h-4 w-4/5 rounded-lg bg-inset [animation-delay:220ms]" />
      </div>
      <div className="mt-10 max-w-[820px] divide-y divide-line border-y border-line">
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

function securePrototypeHtml(html: string) {
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; media-src data: blob:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none';">`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${policy}`);
  }

  return `<!doctype html><html><head>${policy}</head><body>${html}</body></html>`;
}
