import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { runForgeTurn } from "../ai/forge";
import { specToMarkdown } from "../lib/format";
import { uid } from "../lib/id";
import type {
  ChatMessage,
  Conversation,
  MarketResearch,
  ProductModel,
  ProjectStage,
  PrototypeDoc,
  SpecDoc,
  StressTestReport,
  Theme,
  ThesisId,
  Toast,
} from "../types";

const STORAGE_KEY = "forge-conversations-v3";
const ACTIVE_KEY = "forge-active-v3";
const SIDEBAR_KEY = "forge-sidebar-collapsed-v3";
const LEGACY_STORAGE_KEY = "forge-conversations-v2";

function blankProductModel(): ProductModel {
  return {
    summary: "",
    primaryUser: "",
    opportunity: "",
    currentWorkaround: "",
    desiredOutcome: "",
    evidence: [],
    assumptions: [],
    decisions: [],
    validationTasks: [],
  };
}

function blankConversation(): Conversation {
  const now = Date.now();
  return {
    id: uid(),
    title: "New project",
    createdAt: now,
    updatedAt: now,
    stage: "frame",
    messages: [],
    sources: [],
    productModel: blankProductModel(),
    research: null,
    stressTest: null,
    theses: [],
    selectedThesis: "A",
    thesisLocked: false,
    spec: null,
    prototype: null,
    productName: "",
  };
}

function isStage(value: unknown): value is ProjectStage {
  return value === "frame" || value === "challenge" || value === "decide" || value === "brief" || value === "prototype" || value === "handoff";
}

function normalizeResearch(value: unknown): MarketResearch | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<MarketResearch>;
  return {
    summary: typeof raw.summary === "string" ? raw.summary : "",
    signals: Array.isArray(raw.signals) ? raw.signals : [],
    alternatives: Array.isArray(raw.alternatives) ? raw.alternatives : [],
    unresolved: Array.isArray(raw.unresolved) ? raw.unresolved.filter((x): x is string => typeof x === "string") : [],
    sources: Array.isArray(raw.sources) ? raw.sources.filter((item) => Boolean(item && typeof item.url === "string")) : [],
    researchedAt: typeof raw.researchedAt === "number" ? raw.researchedAt : Date.now(),
  };
}

function normalizeStressTest(value: unknown): StressTestReport | null {
  if (!value || typeof value !== "object") return null;
  const report = value as Partial<StressTestReport>;
  if (!Array.isArray(report.findings) || !report.firstExperiment) return null;
  return {
    createdAt: typeof report.createdAt === "number" ? report.createdAt : Date.now(),
    thesis: typeof report.thesis === "string" ? report.thesis : "",
    strongestCounterargument: typeof report.strongestCounterargument === "string" ? report.strongestCounterargument : "",
    recommendation: report.recommendation === "reframe" || report.recommendation === "proceed-to-test" ? report.recommendation : "investigate",
    recommendationReason: typeof report.recommendationReason === "string" ? report.recommendationReason : "",
    findings: report.findings.filter((item) => item && typeof item.title === "string").slice(0, 4),
    firstExperiment: report.firstExperiment,
  };
}

function normalizeSpec(value: unknown): SpecDoc | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SpecDoc>;
  return {
    productName: typeof raw.productName === "string" ? raw.productName : "Untitled product",
    thesis: typeof raw.thesis === "string" ? raw.thesis : "",
    overview: typeof raw.overview === "string" ? raw.overview : "",
    nonGoals: Array.isArray(raw.nonGoals) ? raw.nonGoals.filter((x): x is string => typeof x === "string") : [],
    requirements: Array.isArray(raw.requirements) ? raw.requirements : [],
    failureModes: Array.isArray(raw.failureModes) ? raw.failureModes : [],
    questions: Array.isArray(raw.questions) ? raw.questions.filter((x): x is string => typeof x === "string") : [],
    metrics: Array.isArray(raw.metrics) ? raw.metrics : [],
    validationPlan: Array.isArray(raw.validationPlan) ? raw.validationPlan : [],
  };
}

function normalizePrototype(value: unknown): PrototypeDoc | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<PrototypeDoc>;
  if (typeof raw.html !== "string" || !raw.html.trim()) return null;
  return {
    html: raw.html,
    summary: typeof raw.summary === "string" ? raw.summary : "Interactive prototype generated from the build brief.",
    screens: Array.isArray(raw.screens) ? raw.screens.filter((x): x is string => typeof x === "string") : [],
    builtAt: typeof raw.builtAt === "number" ? raw.builtAt : Date.now(),
  };
}

function inferLegacyStage(raw: Record<string, unknown>, spec: SpecDoc | null, thesisCount: number): ProjectStage {
  if (isStage(raw.stage)) return raw.stage;
  if (raw.prototype) return "prototype";
  if (raw.evalReport) return "handoff";
  if (spec) return "brief";
  if (thesisCount > 0 || raw.phase === "position") return "decide";
  if (raw.phase === "interrogate") return "challenge";
  return "frame";
}

function normalizeConversation(value: unknown): Conversation | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const productModel = {
    ...blankProductModel(),
    ...(raw.productModel && typeof raw.productModel === "object" ? raw.productModel as ProductModel : {}),
  };
  const theses = Array.isArray(raw.theses) ? raw.theses as Conversation["theses"] : [];
  const research = normalizeResearch(raw.research);
  const stressTest = normalizeStressTest(raw.stressTest);
  const spec = normalizeSpec(raw.spec);
  const prototype = normalizePrototype(raw.prototype);
  const messages = Array.isArray(raw.messages)
    ? raw.messages.filter((m): m is ChatMessage => Boolean(m && typeof m === "object" && (m as ChatMessage).role && typeof (m as ChatMessage).text === "string"))
      .map((m) => ({ id: m.id || uid(), role: m.role, text: m.text, createdAt: m.createdAt || Date.now() }))
    : [];
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "New project";
  const productName = typeof raw.productName === "string" && raw.productName.trim()
    ? raw.productName.trim()
    : title !== "New project" ? title : "";

  const conversation: Conversation = {
    id: typeof raw.id === "string" ? raw.id : uid(),
    title,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
    stage: inferLegacyStage(raw, spec, theses.length),
    messages,
    sources: Array.isArray(raw.sources) ? raw.sources.filter((x): x is string => typeof x === "string") : [],
    productModel,
    research,
    stressTest,
    theses,
    selectedThesis: raw.selectedThesis === "B" || raw.selectedThesis === "C" || raw.selectedThesis === "CUSTOM" ? raw.selectedThesis : "A",
    thesisLocked: raw.thesisLocked === true,
    spec,
    prototype,
    productName,
  };

  const hasWork = conversation.messages.length > 0
    || Boolean(conversation.productModel.summary || conversation.productModel.opportunity)
    || Boolean(conversation.research)
    || Boolean(conversation.stressTest)
    || Boolean(conversation.spec)
    || Boolean(conversation.prototype)
    || conversation.title !== "New project";

  return hasWork ? conversation : null;
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeConversation).filter((x): x is Conversation => Boolean(x));
  } catch {
    return [];
  }
}

function frameChanged(before: ProductModel, after: ProductModel) {
  return before.summary !== after.summary
    || before.primaryUser !== after.primaryUser
    || before.opportunity !== after.opportunity
    || before.currentWorkaround !== after.currentWorkaround
    || before.desiredOutcome !== after.desiredOutcome;
}

type ForgeContextValue = {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  conversations: Conversation[];
  activeId: string | null;
  conv: Conversation | null;
  composer: string;
  generating: boolean;
  toasts: Toast[];
  setSidebarOpen: (value: boolean) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setComposer: (value: string) => void;
  setProjectStage: (stage: ProjectStage) => void;
  updateProductModelFields: (patch: Partial<Pick<ProductModel, "summary" | "primaryUser" | "opportunity" | "currentWorkaround" | "desiredOutcome">>) => void;
  toggleTheme: () => void;
  newProject: () => void;
  openConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  sendChat: (text?: string) => void;
  researchIdea: () => void;
  stressTestIdea: () => void;
  advanceToDirections: () => void;
  buildChosenPrototype: () => void;
  prototypeCurrentIdea: () => void;
  selectThesis: (id: ThesisId) => void;
  lockThesis: () => void;
  buildPrototype: () => void;
  copySpec: () => void;
  copyPrototype: () => void;
  toast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
};

const ForgeContext = createContext<ForgeContextValue | null>(null);

export function ForgeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("forge-theme") as Theme | null;
    const next = saved === "dark" || saved === "light" ? saved : "light";
    document.documentElement.classList.toggle("dark", next === "dark");
    return next;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === "true");
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));
  const [composer, setComposer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const conv = conversations.find((item) => item.id === activeId) ?? null;
  useEffect(() => {
    if (activeId && !conversations.some((item) => item.id === activeId)) setActiveId(null);
  }, [activeId, conversations]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeId]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem("forge-active-v2");
    localStorage.removeItem("forge-active");
  }, [conversations]);

  const toast = useCallback((input: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((prev) => [...prev, { ...input, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), input.tone === "danger" ? 6500 : 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const patchActive = useCallback((update: (conversation: Conversation) => Conversation) => {
    setConversations((list) => list.map((item) => item.id === activeId
      ? update({ ...item, updatedAt: Date.now() })
      : item));
  }, [activeId]);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => {
      const next = previous === "dark" ? "light" : "dark";
      localStorage.setItem("forge-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  const newProject = useCallback(() => {
    setActiveId(null);
    setSidebarOpen(false);
    setComposer("");
  }, []);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    setComposer("");
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    const next = title.trim();
    if (!next) return;
    setConversations((list) => list.map((item) => item.id === id
      ? { ...item, title: next, updatedAt: Date.now() }
      : item));
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((list) => list.filter((item) => item.id !== id));
    setActiveId((current) => current === id ? null : current);
  }, []);

  const setProjectStage = useCallback((stage: ProjectStage) => {
    patchActive((conversation) => ({ ...conversation, stage }));
  }, [patchActive]);

  const updateProductModelFields = useCallback((patch: Partial<Pick<ProductModel, "summary" | "primaryUser" | "opportunity" | "currentWorkaround" | "desiredOutcome">>) => {
    if (!conv) return;

    const nextModel = { ...conv.productModel, ...patch };
    const changed = frameChanged(conv.productModel, nextModel);

    patchActive((conversation) => ({
      ...conversation,
      productModel: nextModel,
      research: changed ? null : conversation.research,
      stressTest: changed ? null : conversation.stressTest,
      theses: changed ? [] : conversation.theses,
      thesisLocked: changed ? false : conversation.thesisLocked,
      spec: changed ? null : conversation.spec,
      prototype: changed ? null : conversation.prototype,
      stage: changed ? "frame" : conversation.stage,
    }));

    toast({
      title: "Idea updated",
      body: changed && (conv.theses.length > 0 || conv.spec || conv.prototype)
        ? "Old research, directions, and build outputs were cleared because the core idea changed."
        : "Forge will use this correction in the next reasoning step.",
      tone: changed && (conv.theses.length > 0 || conv.spec || conv.prototype) ? "warn" : "success",
    });
  }, [conv, patchActive, toast]);

  const appendAssistant = useCallback((conversationId: string, reply: string) => {
    const message: ChatMessage = {
      id: uid(),
      role: "assistant",
      text: reply,
      createdAt: Date.now(),
    };
    setConversations((list) => list.map((item) => item.id === conversationId
      ? { ...item, messages: [...item.messages, message], updatedAt: Date.now() }
      : item));
  }, []);

  const failAction = useCallback((title: string, body: string) => {
    setGenerating(false);
    toast({ title, body, tone: "danger" });
  }, [toast]);

  const sendChat = useCallback(async (text?: string) => {
    const content = (text ?? composer).trim();
    if (!content || generating) return;

    let conversationId = activeId;
    let base = conv;

    if (!base || !conversationId) {
      const created = blankConversation();
      conversationId = created.id;
      base = created;
      setConversations((list) => [created, ...list]);
      setActiveId(created.id);
    }

    const userMessage: ChatMessage = {
      id: uid(),
      role: "user",
      text: content,
      createdAt: Date.now(),
    };
    const firstInput = base.messages.length === 0;
    const working: Conversation = {
      ...base,
      sources: firstInput ? [...base.sources, content] : base.sources,
      messages: [...base.messages, userMessage],
      updatedAt: Date.now(),
    };

    setComposer("");
    setGenerating(true);
    setConversations((list) => {
      const exists = list.some((item) => item.id === conversationId);
      return exists
        ? list.map((item) => item.id === conversationId ? working : item)
        : [working, ...list];
    });

    try {
      const result = await runForgeTurn(working, content, "chat");
      const nextModel = result.productModel ?? working.productModel;
      const didFrameChange = frameChanged(working.productModel, nextModel);
      const productName = result.productName || working.productName;
      const autoTitle = working.title === "New project";
      const shouldInvalidate = didFrameChange && (
        working.stage === "decide"
        || working.stage === "brief"
        || working.stage === "prototype"
        || working.stage === "handoff"
      );

      const patched: Conversation = {
        ...working,
        productName,
        title: autoTitle ? (productName || working.title) : working.title,
        productModel: nextModel,
        research: didFrameChange ? null : working.research,
        stressTest: didFrameChange ? null : working.stressTest,
        stage: shouldInvalidate ? "challenge" : working.stage,
        theses: shouldInvalidate || working.stage === "frame" || working.stage === "challenge" ? [] : working.theses,
        thesisLocked: shouldInvalidate || working.stage === "frame" || working.stage === "challenge" ? false : working.thesisLocked,
        spec: shouldInvalidate || working.stage === "frame" || working.stage === "challenge" ? null : working.spec,
        prototype: shouldInvalidate || working.stage === "frame" || working.stage === "challenge" ? null : working.prototype,
        updatedAt: Date.now(),
      };

      setConversations((list) => list.map((item) => item.id === conversationId ? patched : item));
      appendAssistant(conversationId, result.reply);
      setGenerating(false);

      if (shouldInvalidate) {
        toast({
          title: "Product frame changed",
          body: "Old research, directions, brief, and prototype were cleared so they do not contradict the new context.",
          tone: "warn",
        });
      }
    } catch {
      failAction(
        "Forge could not update this project",
        "Your input is saved. Retry when ready; nothing in the project was deleted.",
      );
    }
  }, [activeId, appendAssistant, composer, conv, failAction, generating, toast]);

  const researchIdea = useCallback(async () => {
    if (!conv || generating) return;
    if (!conv.productModel.opportunity && !conv.productModel.summary) {
      toast({
        title: "There is not enough of an idea to research yet",
        body: "Give Forge a problem, idea, or context first. It will structure that before searching the market.",
        tone: "warn",
      });
      return;
    }

    setGenerating(true);
    try {
      const result = await runForgeTurn(
        conv,
        "Research the current market around this product hypothesis. Look for existing alternatives, current signals that support or challenge the problem, and evidence that changes what we should build.",
        "research",
      );
      if (!result.research) throw new Error("Research was missing.");

      setConversations((list) => list.map((item) => item.id === conv.id ? {
        ...item,
        research: result.research ?? null,
        stressTest: null,
        theses: [],
        thesisLocked: false,
        spec: null,
        prototype: null,
        updatedAt: Date.now(),
      } : item));
      appendAssistant(conv.id, result.reply);
      setGenerating(false);
      toast({
        title: "Market research ready",
        body: "Forge added current market evidence to the idea without changing your product decision.",
        tone: "success",
      });
    } catch {
      failAction(
        "Could not research this idea",
        "Your product thinking is saved. You can retry the market research without losing anything.",
      );
    }
  }, [appendAssistant, conv, failAction, generating, toast]);

  const stressTestIdea = useCallback(async () => {
    if (!conv || generating) return;
    if (!conv.productModel.summary && !conv.productModel.opportunity) {
      toast({ title: "Start with the idea first", body: "Forge needs an idea or problem to stress-test.", tone: "warn" });
      return;
    }
    setGenerating(true);
    try {
      const result = await runForgeTurn(
        conv,
        "Find the assumptions most likely to kill this specific product. Give me a falsifiable experiment before I build it.",
        "stress-test",
      );
      const stressTest = result.stressTest;
      if (!stressTest || stressTest.findings.length < 3) throw new Error("Incomplete stress test");
      setConversations((list) => list.map((item) => item.id === conv.id ? {
        ...item,
        stressTest,
        theses: [],
        thesisLocked: false,
        spec: null,
        prototype: null,
        stage: "challenge",
        updatedAt: Date.now(),
      } : item));
      setGenerating(false);
    } catch (error) {
      setGenerating(false);
      toast({
        title: "The stress test didn't finish",
        body: error instanceof Error ? error.message.slice(0, 180) : "Your idea remains saved. Retry the stress test.",
        tone: "danger",
      });
    }
  }, [conv, generating, toast]);

  const advanceToDirections = useCallback(async () => {
    if (!conv || generating) return;
    if (!conv.productModel.opportunity && !conv.productModel.summary) {
      toast({
        title: "The frame is still empty",
        body: "Add enough context for Forge to understand the problem before comparing directions.",
        tone: "warn",
      });
      return;
    }

    setGenerating(true);
    try {
      const result = await runForgeTurn(conv, "Compare three credible product directions from the current frame.", "directions");
      const theses = result.theses ?? [];
      if (theses.length < 3) throw new Error("Directions were incomplete.");
      const selected = theses.find((item) => item.recommended)?.id ?? theses[0].id;

      setConversations((list) => list.map((item) => item.id === conv.id ? {
        ...item,
        productName: result.productName || item.productName,
        productModel: result.productModel ?? item.productModel,
        theses,
        selectedThesis: selected,
        thesisLocked: false,
        spec: null,
        prototype: null,
        stage: "decide",
        updatedAt: Date.now(),
      } : item));
      appendAssistant(conv.id, result.reply);
      setGenerating(false);
    } catch {
      failAction(
        "Could not prepare product directions",
        "Your frame is saved. Retry Compare directions in a moment.",
      );
    }
  }, [appendAssistant, conv, failAction, generating, toast]);

  const selectThesis = useCallback((id: ThesisId) => {
    patchActive((conversation) => ({
      ...conversation,
      selectedThesis: id,
      thesisLocked: false,
      spec: null,
      prototype: null,
      stage: "decide",
    }));
  }, [patchActive]);

  const lockThesis = useCallback(async () => {
    if (!conv || generating) return;
    const thesis = conv.theses.find((item) => item.id === conv.selectedThesis);
    if (!thesis) return;

    setGenerating(true);
    try {
      const result = await runForgeTurn(
        conv,
        `I choose ${thesis.title}. Lock this direction and create the concise Build Brief.`,
        "lock-thesis",
      );
      const spec = result.spec;
      if (!spec) throw new Error("Build brief was missing.");

      setConversations((list) => list.map((item) => item.id === conv.id ? {
        ...item,
        productName: result.productName || item.productName,
        productModel: result.productModel ?? item.productModel,
        theses: result.theses ?? item.theses,
        thesisLocked: true,
        spec,
        prototype: null,
        stage: "brief",
        updatedAt: Date.now(),
      } : item));
      appendAssistant(conv.id, result.reply);
      setGenerating(false);
      toast({
        title: "Build brief ready",
        body: "The chosen direction is now connected to a focused V1 handoff.",
        tone: "success",
      });
    } catch {
      failAction(
        "Could not create the build brief",
        "Your chosen direction is saved. Retry when ready.",
      );
    }
  }, [appendAssistant, conv, failAction, generating, toast]);

  const buildPrototype = useCallback(async () => {
    if (!conv?.spec || generating) return;

    setGenerating(true);
    patchActive((conversation) => ({ ...conversation, stage: "prototype" }));

    try {
      const result = await runForgeTurn(
        conv,
        "Create a working interactive prototype from the locked Build Brief. Focus on the riskiest core workflow and keep the prototype faithful to V1.",
        "prototype",
      );
      const prototype = result.prototype;
      if (!prototype) throw new Error("Prototype was missing.");

      setConversations((list) => list.map((item) => item.id === conv.id ? {
        ...item,
        prototype,
        stage: "prototype",
        updatedAt: Date.now(),
      } : item));
      appendAssistant(conv.id, result.reply);
      setGenerating(false);
      toast({
        title: "Working prototype ready",
        body: "Forge built an interactive prototype from the locked V1 brief.",
        tone: "success",
      });
    } catch {
      setGenerating(false);
      toast({
        title: "Could not build the prototype",
        body: "The Build Brief is still saved. Retry prototype generation when ready.",
        tone: "danger",
      });
    }
  }, [appendAssistant, conv, generating, patchActive, toast]);

  const runPrototypePipeline = useCallback(async (source: Conversation, briefInstruction: string) => {
    setGenerating(true);
    try {
      let spec = source.spec;
      if (!spec || !source.thesisLocked) {
        const brief = await runForgeTurn(source, briefInstruction, "lock-thesis");
        if (!brief.spec) throw new Error("The build brief was incomplete.");
        spec = brief.spec;
        setConversations((list) => list.map((item) => item.id === source.id ? {
          ...item,
          spec,
          thesisLocked: true,
          stage: "brief",
          updatedAt: Date.now(),
        } : item));
      }

      const built = await runForgeTurn(
        { ...source, spec, thesisLocked: true, stage: "brief" as ProjectStage },
        "Build the smallest working prototype that tests the highest-risk user interaction in the chosen brief and stress test. No decorative dashboard or fake integrations.",
        "prototype",
      );
      if (!built.prototype) throw new Error("The prototype was incomplete.");
      const prototype = built.prototype;
      setConversations((list) => list.map((item) => item.id === source.id ? {
        ...item,
        spec,
        thesisLocked: true,
        prototype,
        stage: "prototype",
        updatedAt: Date.now(),
      } : item));
      toast({
        title: "Prototype ready",
        body: "Use this to test the product mechanism. A working demo is not market validation.",
        tone: "success",
      });
    } catch (error) {
      toast({
        title: "Prototype generation stopped",
        body: error instanceof Error ? error.message.slice(0, 180) : "Your project and any completed brief remain saved.",
        tone: "danger",
      });
    } finally {
      setGenerating(false);
    }
  }, [toast]);

  const prototypeCurrentIdea = useCallback(() => {
    if (!conv?.stressTest || generating) return;
    void runPrototypePipeline(
      conv,
      "Prototype the current product idea, not a new idea. Turn the highest-risk experiment from the stress test into a tightly scoped V1 Build Brief. The demo must show that interaction. Do not pretend this has validated demand.",
    );
  }, [conv, generating, runPrototypePipeline]);

  const buildChosenPrototype = useCallback(() => {
    if (!conv || generating) return;
    const thesis = conv.theses.find((option) => option.id === conv.selectedThesis);
    if (!thesis) return;
    void runPrototypePipeline(
      conv,
      `I choose ${thesis.title}. Create a focused V1 Build Brief around this mechanism and the stress test's highest-risk assumption.`,
    );
  }, [conv, generating, runPrototypePipeline]);

  const copySpec = useCallback(() => {
    if (!conv?.spec) return;
    void navigator.clipboard.writeText(specToMarkdown(conv.spec));
    toast({
      title: "Build brief copied",
      body: "The Markdown brief is ready to paste into your builder or docs.",
      tone: "success",
    });
  }, [conv, toast]);

  const copyPrototype = useCallback(() => {
    if (!conv?.prototype) return;
    void navigator.clipboard.writeText(conv.prototype.html);
    toast({
      title: "Prototype HTML copied",
      body: "The self-contained prototype is ready to paste into a file or coding tool.",
      tone: "success",
    });
  }, [conv, toast]);

  const value = useMemo<ForgeContextValue>(() => ({
    theme,
    sidebarOpen,
    sidebarCollapsed,
    conversations,
    activeId,
    conv,
    composer,
    generating,
    toasts,
    setSidebarOpen,
    setSidebarCollapsed,
    setComposer,
    setProjectStage,
    updateProductModelFields,
    toggleTheme,
    newProject,
    openConversation,
    renameConversation,
    deleteConversation,
    sendChat,
    researchIdea,
    stressTestIdea,
    advanceToDirections,
    buildChosenPrototype,
    prototypeCurrentIdea,
    selectThesis,
    lockThesis,
    buildPrototype,
    copySpec,
    copyPrototype,
    toast,
    dismissToast,
  }), [
    theme,
    sidebarOpen,
    sidebarCollapsed,
    conversations,
    activeId,
    conv,
    composer,
    generating,
    toasts,
    setProjectStage,
    updateProductModelFields,
    toggleTheme,
    newProject,
    openConversation,
    renameConversation,
    deleteConversation,
    sendChat,
    researchIdea,
    stressTestIdea,
    advanceToDirections,
    buildChosenPrototype,
    prototypeCurrentIdea,
    selectThesis,
    lockThesis,
    buildPrototype,
    copySpec,
    copyPrototype,
    toast,
    dismissToast,
  ]);

  return <ForgeContext.Provider value={value}>{children}</ForgeContext.Provider>;
}

export function useForge() {
  const context = useContext(ForgeContext);
  if (!context) throw new Error("useForge must be used within ForgeProvider");
  return context;
}
