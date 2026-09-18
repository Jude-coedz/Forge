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
  ProductModel,
  ProjectStage,
  SpecDoc,
  Theme,
  ThesisId,
  Toast,
} from "../types";

const STORAGE_KEY = "forge-conversations-v3";
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
    theses: [],
    selectedThesis: "A",
    thesisLocked: false,
    spec: null,
    productName: "",
  };
}

function isStage(value: unknown): value is ProjectStage {
  return value === "frame" || value === "challenge" || value === "decide" || value === "brief" || value === "handoff";
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

function inferLegacyStage(raw: Record<string, unknown>, spec: SpecDoc | null, thesisCount: number): ProjectStage {
  if (isStage(raw.stage)) return raw.stage;
  if (raw.prototype || raw.evalReport) return "handoff";
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
  const spec = normalizeSpec(raw.spec);
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
    theses,
    selectedThesis: raw.selectedThesis === "B" || raw.selectedThesis === "C" || raw.selectedThesis === "CUSTOM" ? raw.selectedThesis : "A",
    thesisLocked: raw.thesisLocked === true,
    spec,
    productName,
  };

  const hasWork = conversation.messages.length > 0
    || Boolean(conversation.productModel.summary || conversation.productModel.opportunity)
    || Boolean(conversation.spec)
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
  return before.primaryUser !== after.primaryUser
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
  toggleTheme: () => void;
  newProject: () => void;
  openConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  sendChat: (text?: string) => void;
  advanceToDirections: () => void;
  selectThesis: (id: ThesisId) => void;
  lockThesis: () => void;
  copySpec: () => void;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const conv = conversations.find((item) => item.id === activeId) ?? null;

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
      const shouldInvalidate = didFrameChange && (working.stage === "decide" || working.stage === "brief" || working.stage === "handoff");

      const patched: Conversation = {
        ...working,
        productName,
        title: autoTitle ? (productName || working.title) : working.title,
        productModel: nextModel,
        stage: shouldInvalidate ? "challenge" : working.stage,
        theses: shouldInvalidate || working.stage === "frame" || working.stage === "challenge" ? [] : working.theses,
        thesisLocked: shouldInvalidate || working.stage === "frame" || working.stage === "challenge" ? false : working.thesisLocked,
        spec: shouldInvalidate || working.stage === "frame" || working.stage === "challenge" ? null : working.spec,
        updatedAt: Date.now(),
      };

      setConversations((list) => list.map((item) => item.id === conversationId ? patched : item));
      appendAssistant(conversationId, result.reply);
      setGenerating(false);

      if (shouldInvalidate) {
        toast({
          title: "Product frame changed",
          body: "The old direction and build brief were cleared so they do not contradict the new context.",
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

  const copySpec = useCallback(() => {
    if (!conv?.spec) return;
    void navigator.clipboard.writeText(specToMarkdown(conv.spec));
    toast({
      title: "Build brief copied",
      body: "The Markdown brief is ready to paste into your builder or docs.",
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
    toggleTheme,
    newProject,
    openConversation,
    renameConversation,
    deleteConversation,
    sendChat,
    advanceToDirections,
    selectThesis,
    lockThesis,
    copySpec,
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
    toggleTheme,
    newProject,
    openConversation,
    renameConversation,
    deleteConversation,
    sendChat,
    advanceToDirections,
    selectThesis,
    lockThesis,
    copySpec,
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
