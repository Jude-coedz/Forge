import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCopy,
  FileText,
  FlaskConical,
  GitBranch,
  Lightbulb,
  Play,
  ShieldAlert,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button, Pill, SeverityBadge } from "../ui/primitives";
import type { Conversation, ProductRisk } from "../../types";

type FlowStep = "frame" | "challenge" | "decide" | "brief" | "handoff";

const steps: Array<{ id: FlowStep; label: string }> = [
  { id: "frame", label: "Frame" },
  { id: "challenge", label: "Challenge" },
  { id: "decide", label: "Decide" },
  { id: "brief", label: "Build brief" },
  { id: "handoff", label: "Handoff" },
];

function defaultStep(conv: Conversation): FlowStep {
  if (conv.spec) return "brief";
  if (conv.theses.length > 0 || conv.phase === "position") return "decide";
  return "frame";
}

function stepAvailable(step: FlowStep, conv: Conversation) {
  if (step === "frame" || step === "challenge") return true;
  if (step === "decide") return conv.theses.length > 0 || conv.phase === "position";
  if (step === "brief" || step === "handoff") return !!conv.spec;
  return false;
}

export function GuidedProject({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv;
  const [step, setStep] = useState<FlowStep>(conv ? defaultStep(conv) : "frame");

  useEffect(() => {
    if (!conv) return;
    setStep(defaultStep(conv));
  }, [conv?.id]);

  useEffect(() => {
    if (!conv) return;
    if (conv.phase === "position") setStep("decide");
    if (conv.phase === "spec") setStep("brief");
  }, [conv?.phase]);

  if (!conv) return null;

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-surface scrollbar-thin">
      <div className="mx-auto w-full max-w-[980px] px-5 py-6 sm:px-7 lg:px-10 lg:py-8">
        <FlowHeader conv={conv} step={step} onStep={setStep} />

        {step === "frame" && <FrameScreen onNext={() => setStep("challenge")} onOpenCopilot={onOpenCopilot} />}
        {step === "challenge" && <ChallengeScreen onBack={() => setStep("frame")} onOpenCopilot={onOpenCopilot} />}
        {step === "decide" && <DecideScreen onBack={() => setStep("challenge")} onOpenCopilot={onOpenCopilot} />}
        {step === "brief" && <BuildBriefScreen onBack={() => setStep("decide")} onNext={() => setStep("handoff")} onOpenCopilot={onOpenCopilot} />}
        {step === "handoff" && <HandoffScreen onBack={() => setStep("brief")} />}
      </div>
    </main>
  );
}

function FlowHeader({ conv, step, onStep }: { conv: Conversation; step: FlowStep; onStep: (step: FlowStep) => void }) {
  return (
    <div className="mb-8 border-b border-line pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-4">Project</p>
          <h1 className="mt-1 truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">{conv.title}</h1>
        </div>
        <Pill tone={conv.spec ? "temper" : "default"}>{conv.spec ? "Build brief ready" : "Shaping product"}</Pill>
      </div>

      <nav className="mt-5 flex gap-1 overflow-x-auto" aria-label="Product flow">
        {steps.map((item, index) => {
          const active = item.id === step;
          const available = stepAvailable(item.id, conv);
          const currentIndex = steps.findIndex((x) => x.id === step);
          const completed = index < currentIndex && available;
          return (
            <button
              key={item.id}
              type="button"
              disabled={!available}
              onClick={() => onStep(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] transition ${active ? "bg-ink text-canvas" : available ? "text-ink-3 hover:bg-inset hover:text-ink" : "cursor-default text-ink-4/50"}`}
            >
              <span className={`grid size-4 place-items-center rounded-full text-[9px] ${active ? "bg-canvas/15" : completed ? "bg-temper text-white" : "border border-current/30"}`}>
                {completed ? <Check className="size-2.5" /> : index + 1}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function FrameScreen({ onNext, onOpenCopilot }: { onNext: () => void; onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;
  const model = conv.productModel;
  const hasFrame = Boolean(model.summary || model.primaryUser || model.opportunity);
  const assumptions = model.assumptions.filter((x) => x.status === "untested").slice(0, 3);

  if (!hasFrame && f.generating) return <LoadingState title="Turning your idea into a product frame…" />;

  return (
    <ScreenShell
      eyebrow="1 · Frame"
      title="Here’s the product Forge thinks you mean"
      description="Start by checking the interpretation—not by answering a questionnaire. Correct anything that feels wrong."
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-raised">
        <FrameRow icon={<UserRound className="size-4" />} label="Primary user" value={model.primaryUser} />
        <FrameRow icon={<Target className="size-4" />} label="Problem / opportunity" value={model.opportunity} />
        <FrameRow icon={<GitBranch className="size-4" />} label="What they do today" value={model.currentWorkaround} />
        <FrameRow icon={<Sparkles className="size-4" />} label="What better looks like" value={model.desiredOutcome} />
      </div>

      {assumptions.length > 0 && (
        <section className="mt-5 rounded-2xl border border-line bg-canvas p-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4 text-molten" />
            <h3 className="text-[13px] font-medium">Forge is assuming</h3>
          </div>
          <div className="mt-3 space-y-2">
            {assumptions.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-inset px-3 py-2.5">
                <p className="text-[12px] leading-5 text-ink-2">{item.claim}</p>
                <RiskPill risk={item.risk} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-7 flex flex-wrap gap-2">
        <Button variant="temper" onClick={onNext}>Looks right — challenge it <ArrowRight className="size-3.5" /></Button>
        <Button variant="secondary" onClick={() => { f.setComposer("The product frame is wrong or incomplete. Here is what I want to correct: "); onOpenCopilot(); }}>Something’s wrong</Button>
      </div>
    </ScreenShell>
  );
}

function FrameRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="grid gap-2 border-b border-line px-4 py-4 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-6">
      <div className="flex items-center gap-2 text-[11px] font-medium text-ink-4">{icon}{label}</div>
      <p className={`text-[13px] leading-5 ${value ? "text-ink" : "text-ink-4"}`}>{value || "Not clear yet"}</p>
    </div>
  );
}

function ChallengeScreen({ onBack, onOpenCopilot }: { onBack: () => void; onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;
  const model = conv.productModel;
  const openDecisions = model.decisions.filter((x) => x.status === "open").slice(0, 2);
  const assumptions = model.assumptions.filter((x) => x.status === "untested").slice(0, Math.max(1, 3 - openDecisions.length));
  const unresolved = conv.questions.find((q) => !q.answered);

  const challenges = useMemo(() => [
    ...openDecisions.map((d) => ({ id: d.id, type: "Decision" as const, title: d.question, why: d.rationale || "This choice can materially change the product shape.", risk: null as ProductRisk | null })),
    ...assumptions.map((a) => ({ id: a.id, type: "Assumption" as const, title: a.claim, why: `This is an untested ${a.risk} assumption.`, risk: a.risk })),
  ].slice(0, 3), [openDecisions, assumptions]);

  return (
    <ScreenShell
      eyebrow="2 · Challenge"
      title="What could make this the wrong product?"
      description="Forge should surface the few assumptions or decisions that can actually change what you build. You do not need to know every answer."
    >
      <div className="space-y-3">
        {challenges.length > 0 ? challenges.map((item, index) => (
          <section key={item.id} className="rounded-2xl border border-line bg-raised p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-ink-4">
                  <span>{index + 1}</span><span>·</span><span>{item.type}</span>
                  {item.risk && <RiskPill risk={item.risk} />}
                </div>
                <h3 className="mt-2 text-[14px] font-medium leading-6 text-ink">{item.title}</h3>
                <p className="mt-1 text-[12px] leading-5 text-ink-4">{item.why}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => { f.setComposer(`I can answer this: ${item.title}\n\nMy answer: `); onOpenCopilot(); }}>I know this</Button>
              <Button size="sm" variant="ghost" disabled={f.generating} onClick={() => { f.sendChat(`I don't know this yet: ${item.title}\n\nDo not make me guess. Treat it as an assumption or validation task, and tell me what we can still decide without it.`); onOpenCopilot(); }}>I don’t know yet</Button>
            </div>
          </section>
        )) : (
          <section className="rounded-2xl border border-line bg-raised p-5">
            <div className="flex items-center gap-2 text-temper"><Check className="size-4" /><span className="text-[12px] font-medium">No major unresolved challenge is blocking a product comparison.</span></div>
          </section>
        )}
      </div>

      {!conv.readyForDirections && unresolved && (
        <div className="mt-4 rounded-xl border border-dashed border-line-strong px-4 py-3">
          <p className="text-[11px] font-medium text-ink-3">One thing could still change the direction</p>
          <p className="mt-1 text-[12px] leading-5 text-ink-4">{unresolved.question}</p>
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="size-3.5" /> Back to frame</Button>
        {conv.readyForDirections ? (
          <Button variant="temper" onClick={f.advanceToDirections} disabled={f.generating}>{f.generating ? "Preparing directions…" : "Compare product directions"}<ArrowRight className="size-3.5" /></Button>
        ) : (
          <Button variant="secondary" disabled={f.generating} onClick={() => { f.sendChat("I don't have more evidence right now. Preserve the unknowns as assumptions or validation tasks. If we can compare credible product directions without inventing facts, mark this ready to move forward."); onOpenCopilot(); }}>
            Continue with assumptions
          </Button>
        )}
      </div>
    </ScreenShell>
  );
}

function DecideScreen({ onBack, onOpenCopilot }: { onBack: () => void; onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;

  if (f.generating && conv.theses.length === 0) return <LoadingState title="Comparing genuinely different product directions…" />;

  if (conv.theses.length === 0) {
    return (
      <ScreenShell eyebrow="3 · Decide" title="Choose the product—not the feature list" description="Forge will compare different product mechanisms, then you make the call.">
        <div className="rounded-2xl border border-line bg-raised p-6 text-center">
          <GitBranch className="mx-auto size-5 text-ink-4" />
          <p className="mt-3 text-[13px] text-ink-3">Directions have not been generated yet.</p>
          <Button className="mt-4" variant="temper" onClick={f.advanceToDirections} disabled={!conv.readyForDirections || f.generating}>Generate directions</Button>
        </div>
        <Button className="mt-5" variant="ghost" onClick={onBack}><ArrowLeft className="size-3.5" /> Back to challenge</Button>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      eyebrow="3 · Decide"
      title="Three credible products are hiding inside this idea"
      description="Forge recommends one based on the evidence. You can disagree—the point is to make the tradeoff explicit."
    >
      <div className="grid gap-3 lg:grid-cols-3">
        {conv.theses.map((option) => {
          const selected = conv.selectedThesis === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => f.selectThesis(option.id)}
              className={`rounded-2xl border p-4 text-left transition ${selected ? "border-ink bg-raised shadow-sm" : "border-line bg-canvas hover:border-line-strong hover:bg-raised"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-ink-4">Option {option.id}</span>
                {option.recommended && <Pill tone="temper">Forge pick</Pill>}
              </div>
              <h3 className="mt-3 font-display text-[15px] font-semibold leading-5">{option.title}</h3>
              <p className="mt-2 text-[12px] leading-5 text-ink-3">{option.description}</p>
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-temper">Why it could win</p>
                <p className="mt-1 text-[11px] leading-4 text-ink-3">{option.pros[0] || "—"}</p>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-scorch">Biggest risk</p>
                <p className="mt-1 text-[11px] leading-4 text-ink-3">{option.risks[0] || "—"}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => { f.setComposer("I think there is a better product direction than these. Here is my alternative: "); onOpenCopilot(); }}>Propose my own direction</Button>
        <Button variant="ghost" onClick={() => { const pick = conv.theses.find((x) => x.recommended); f.setComposer(`Challenge your recommendation${pick ? ` of ${pick.title}` : ""}. What evidence or risk would make another direction better?`); onOpenCopilot(); }}>Challenge Forge’s recommendation</Button>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="size-3.5" /> Back to challenge</Button>
        <Button variant="temper" onClick={f.lockThesis} disabled={f.generating}>{f.generating ? "Creating build brief…" : "Choose direction & create build brief"}<ArrowRight className="size-3.5" /></Button>
      </div>
    </ScreenShell>
  );
}

function BuildBriefScreen({ onBack, onNext, onOpenCopilot }: { onBack: () => void; onNext: () => void; onOpenCopilot: () => void }) {
  const f = useForge();
  const conv = f.conv!;
  const spec = conv.spec;
  const [tab, setTab] = useState<"overview" | "requirements" | "risks">("overview");

  if (f.generating && !spec) return <LoadingState title="Turning the chosen direction into a focused build brief…" />;
  if (!spec) return <LoadingState title="Build brief is not ready yet." />;

  const p0 = spec.requirements.filter((x) => x.priority === "P0");
  const validation = spec.validationPlan ?? [];

  return (
    <ScreenShell
      eyebrow="4 · Build brief"
      title="The minimum product you can actually defend"
      description="This is the handoff artifact. It should contain enough reasoning to build without pretending every assumption is proven."
    >
      <div className="flex gap-1 border-b border-line">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabButton>
        <TabButton active={tab === "requirements"} onClick={() => setTab("requirements")}>Requirements <span className="text-ink-4">{p0.length}</span></TabButton>
        <TabButton active={tab === "risks"} onClick={() => setTab("risks")}>Risks & validation</TabButton>
      </div>

      {tab === "overview" && (
        <div className="mt-5 space-y-4">
          <BriefBlock label="Chosen direction"><p className="text-[14px] font-medium">{spec.thesis}</p></BriefBlock>
          <BriefBlock label="What V1 is"><p className="text-[13px] leading-6 text-ink-2">{spec.overview}</p></BriefBlock>
          <div className="grid gap-3 sm:grid-cols-2">
            <BriefBlock label="Primary user"><p className="text-[12px] leading-5 text-ink-2">{conv.productModel.primaryUser || "Not explicit"}</p></BriefBlock>
            <BriefBlock label="Problem"><p className="text-[12px] leading-5 text-ink-2">{conv.productModel.opportunity || "Not explicit"}</p></BriefBlock>
          </div>
          {spec.metrics.length > 0 && <BriefBlock label="Success signals"><div className="space-y-2">{spec.metrics.slice(0, 4).map((metric) => <div key={metric.name} className="flex items-start justify-between gap-4 text-[12px]"><span className="text-ink-2">{metric.name}</span><span className="text-right text-ink-4">{metric.target}</span></div>)}</div></BriefBlock>}
        </div>
      )}

      {tab === "requirements" && (
        <div className="mt-5 space-y-2">
          {p0.map((req) => (
            <section key={req.id} className="rounded-xl border border-line bg-raised p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-medium">{req.name}</p><p className="mt-1 text-[12px] leading-5 text-ink-3">{req.story}</p></div><Pill>{req.priority}</Pill></div>
              {req.criteria.length > 0 && <ul className="mt-3 space-y-1 text-[11px] leading-4 text-ink-4">{req.criteria.slice(0, 3).map((item) => <li key={item} className="flex gap-2"><span>•</span><span>{item}</span></li>)}</ul>}
              <p className="mt-3 text-[10px] text-ink-4">Why it exists: {req.source}</p>
            </section>
          ))}
        </div>
      )}

      {tab === "risks" && (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <section className="rounded-xl border border-line bg-raised p-4">
            <div className="flex items-center gap-2"><ShieldAlert className="size-4 text-scorch" /><h3 className="text-[13px] font-medium">Failure modes</h3></div>
            <div className="mt-3 space-y-3">{spec.failureModes.slice(0, 5).map((risk) => <div key={risk.id} className="border-b border-line pb-3 last:border-0 last:pb-0"><div className="flex items-center justify-between gap-3"><p className="text-[12px] font-medium">{risk.title}</p><SeverityBadge value={risk.severity} /></div><p className="mt-1 text-[11px] leading-4 text-ink-4">{risk.containment}</p></div>)}</div>
          </section>
          <section className="rounded-xl border border-line bg-raised p-4">
            <div className="flex items-center gap-2"><FlaskConical className="size-4 text-molten" /><h3 className="text-[13px] font-medium">What still needs proving</h3></div>
            <div className="mt-3 space-y-3">{validation.slice(0, 5).map((item, index) => <div key={`${item.risk}-${index}`} className="border-b border-line pb-3 last:border-0 last:pb-0"><RiskPill risk={item.risk} /><p className="mt-1.5 text-[12px] text-ink-2">{item.assumption}</p><p className="mt-1 text-[11px] leading-4 text-ink-4">Test: {item.test}</p></div>)}</div>
          </section>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => { f.setComposer("Review the build brief and tell me the weakest requirement, unsupported assumption, or unnecessary scope. Be specific."); onOpenCopilot(); }}>Review with Forge</Button>
        <Button variant="ghost" onClick={f.copySpec}><ClipboardCopy className="size-3.5" /> Copy brief</Button>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="size-3.5" /> Back to directions</Button>
        <Button variant="temper" onClick={onNext}>Prepare handoff <ArrowRight className="size-3.5" /></Button>
      </div>
    </ScreenShell>
  );
}

function HandoffScreen({ onBack }: { onBack: () => void }) {
  const f = useForge();
  const conv = f.conv!;
  const spec = conv.spec;
  if (!spec) return null;

  const copyBuilderPrompt = async () => {
    const requirements = spec.requirements.filter((r) => r.priority === "P0").map((r) => `- ${r.name}: ${r.story}\n  Acceptance: ${r.criteria.join("; ")}`).join("\n");
    const prompt = `Build ${spec.productName}.\n\nProduct direction:\n${spec.thesis}\n\nProduct intent:\n${spec.overview}\n\nV1 requirements:\n${requirements}\n\nDo not invent new scope. Preserve the product decisions above and call out any implementation choice that changes user behavior or violates an acceptance criterion.`;
    await navigator.clipboard.writeText(prompt);
    f.toast({ title: "Builder prompt copied", body: "Paste it into your preferred coding or prototyping tool.", tone: "success" });
  };

  return (
    <ScreenShell
      eyebrow="5 · Handoff"
      title="You have enough to start building"
      description="Forge’s job here is to preserve the product decision while you move into the tool that actually builds it."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <ActionCard icon={<FileText className="size-5" />} title="Copy the full build brief" body="Problem, direction, V1 requirements, risks, validation plan and success signals." action="Copy brief" onClick={f.copySpec} />
        <ActionCard icon={<ClipboardCopy className="size-5" />} title="Copy a builder prompt" body="A compact implementation prompt for Claude Code, Cursor, Lovable, Replit or another builder." action="Copy builder prompt" onClick={copyBuilderPrompt} />
      </div>

      <section className="mt-5 rounded-2xl border border-line bg-canvas p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2"><Play className="size-4 text-ink-4" /><h3 className="text-[13px] font-medium">Optional: test the core workflow here</h3></div>
            <p className="mt-1 text-[12px] leading-5 text-ink-4">Prototype generation is a convenience, not Forge’s core value. Use it when you want a quick workflow check before moving to your builder.</p>
          </div>
          <Button variant="secondary" disabled={f.generating} onClick={f.buildPrototype}>{f.generating ? "Building…" : conv.prototype ? "Rebuild prototype" : "Build prototype"}</Button>
        </div>

        {conv.prototype && (
          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
            <iframe title="Forge prototype" sandbox="allow-scripts" srcDoc={conv.prototype.html} className="h-[520px] w-full bg-white" />
          </div>
        )}
      </section>

      <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="size-3.5" /> Back to build brief</Button>
        {conv.prototype && <Button variant="ghost" disabled={f.generating} onClick={f.runEval}><FlaskConical className="size-3.5" /> {conv.evalReport ? "Run eval again" : "Run optional eval"}</Button>}
      </div>
    </ScreenShell>
  );
}

function ScreenShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="pb-10">
      <div className="mb-6 max-w-2xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-4">{eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">{title}</h2>
        <p className="mt-2 text-[13px] leading-6 text-ink-3">{description}</p>
      </div>
      {children}
    </section>
  );
}

function LoadingState({ title }: { title: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex w-fit gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-ink-4" /><span className="size-1.5 animate-pulse rounded-full bg-ink-4 [animation-delay:120ms]" /><span className="size-1.5 animate-pulse rounded-full bg-ink-4 [animation-delay:240ms]" /></div>
        <p className="mt-3 text-[12px] text-ink-4">{title}</p>
      </div>
    </div>
  );
}

function RiskPill({ risk }: { risk: ProductRisk }) {
  const labels: Record<ProductRisk, string> = { value: "Value", usability: "Usability", feasibility: "Feasibility", viability: "Viability" };
  return <Pill>{labels[risk]}</Pill>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`border-b-2 px-3 py-2 text-[12px] transition ${active ? "border-ink font-medium text-ink" : "border-transparent text-ink-4 hover:text-ink-2"}`}>{children}</button>;
}

function BriefBlock({ label, children }: { label: string; children: ReactNode }) {
  return <section className="rounded-xl border border-line bg-raised p-4"><p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-ink-4">{label}</p>{children}</section>;
}

function ActionCard({ icon, title, body, action, onClick }: { icon: ReactNode; title: string; body: string; action: string; onClick: () => void }) {
  return (
    <section className="rounded-2xl border border-line bg-raised p-5">
      <div className="text-ink-3">{icon}</div>
      <h3 className="mt-4 text-[14px] font-medium">{title}</h3>
      <p className="mt-1 text-[12px] leading-5 text-ink-4">{body}</p>
      <Button className="mt-4" size="sm" variant="secondary" onClick={onClick}>{action}</Button>
    </section>
  );
}
