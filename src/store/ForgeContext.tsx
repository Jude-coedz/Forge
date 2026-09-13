import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { runForgeTurn } from "../ai/forge";
import { displayName, specToMarkdown } from "../lib/engine";
import { uid } from "../lib/id";
import type { AppScreen, ArtifactKind, ChatMessage, Conversation, Theme, ThesisId, Toast } from "../types";

const STORAGE_KEY = "forge-conversations-v2";
const ACTIVE_KEY = "forge-active-v2";

function blankConversation(): Conversation {
  const t = Date.now();
  return {
    id: uid(),
    title: "New project",
    createdAt: t,
    updatedAt: t,
    phase: "idle",
    messages: [],
    sources: [],
    brief: [],
    questions: [],
    theses: [],
    selectedThesis: "A",
    thesisLocked: false,
    spec: null,
    prototype: null,
    artifact: null,
    productName: "",
    readyForDirections: false,
  };
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c) => {
      const source = (c.sources ?? []).join("\n");
      const name = displayName(c.productName, source);
      return {
        ...blankConversation(),
        ...c,
        questions: c.questions ?? [],
        readyForDirections: c.readyForDirections ?? false,
        productName: name,
        messages: (c.messages ?? []).map((m) => ({ ...m, streaming: false })),
      };
    });
  } catch {
    return [];
  }
}

function loadActiveId(conversations: Conversation[]) {
  try {
    const id = localStorage.getItem(ACTIVE_KEY);
    if (id && conversations.some((c) => c.id === id)) return id;
  } catch {
    // ignore storage failures
  }
  return null;
}

type ForgeContextValue = {
  theme: Theme;
  screen: AppScreen;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  artifactOpen: boolean;
  conversations: Conversation[];
  activeId: string | null;
  conv: Conversation | null;
  composer: string;
  generating: boolean;
  toasts: Toast[];
  setScreen: (s: AppScreen) => void;
  setSidebarOpen: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setArtifactOpen: (v: boolean) => void;
  setComposer: (v: string) => void;
  toggleTheme: () => void;
  newProject: () => void;
  openConversation: (id: string) => void;
  sendChat: (text?: string) => void;
  confirmBrief: (id: string) => void;
  markAssumption: (id: string) => void;
  selectThesis: (id: ThesisId) => void;
  lockThesis: () => void;
  buildPrototype: () => void;
  openArtifact: (kind: ArtifactKind) => void;
  copySpec: () => void;
  copyPrototype: () => void;
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  later: (feature: string) => void;
};

const ForgeContext = createContext<ForgeContextValue | null>(null);

export function ForgeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("forge-theme") as Theme | null;
    const next = saved ?? "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    return next;
  });
  const [screen, setScreen] = useState<AppScreen>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveId(loadConversations()));
  const [composer, setComposer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  const conv = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)), [conversations]);
  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeId]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const patchActive = useCallback(
    (fn: (c: Conversation) => Conversation) => {
      setConversations((list) => list.map((c) => (c.id === activeId ? fn({ ...c, updatedAt: Date.now() }) : c)));
    },
    [activeId],
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("forge-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  const newProject = useCallback(() => {
    const next = blankConversation();
    setConversations((list) => [next, ...list]);
    setActiveId(next.id);
    setScreen("chat");
    setSidebarOpen(false);
    setArtifactOpen(false);
    setComposer("");
  }, []);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setScreen("chat");
    setSidebarOpen(false);
    setArtifactOpen(false);
  }, []);

  const streamReply = useCallback((conversationId: string, full: string, artifact?: ArtifactKind) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const assistant: ChatMessage = {
      id: uid(),
      role: "assistant",
      text: reduce ? full : "",
      createdAt: Date.now(),
      artifact,
      streaming: !reduce,
    };
    setConversations((list) => list.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, assistant] } : c)));
    if (reduce) {
      setGenerating(false);
      return;
    }
    const parts = full.split(/(\s+)/);
    let i = 0;
    let acc = "";
    const tick = () => {
      if (i >= parts.length) {
        setConversations((list) => list.map((c) => c.id === conversationId ? {
          ...c,
          messages: c.messages.map((m) => m.id === assistant.id ? { ...m, text: full, streaming: false } : m),
        } : c));
        setGenerating(false);
        return;
      }
      acc += parts[i++];
      const snapshot = acc;
      setConversations((list) => list.map((c) => c.id === conversationId ? {
        ...c,
        messages: c.messages.map((m) => m.id === assistant.id ? { ...m, text: snapshot } : m),
      } : c));
      timers.current.push(window.setTimeout(tick, 16));
    };
    timers.current.push(window.setTimeout(tick, 120));
  }, []);

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

    const userMsg: ChatMessage = { id: uid(), role: "user", text: content, createdAt: Date.now() };
    const firstTurn = base.phase === "idle";
    const working: Conversation = {
      ...base,
      phase: firstTurn ? "interrogate" : base.phase,
      sources: firstTurn ? [...base.sources, content] : base.sources,
      messages: [...base.messages, userMsg],
      updatedAt: Date.now(),
    };

    setComposer("");
    setGenerating(true);
    setConversations((list) => {
      const exists = list.some((c) => c.id === conversationId);
      return exists ? list.map((c) => (c.id === conversationId ? working : c)) : [working, ...list];
    });

    try {
      const result = await runForgeTurn(working, content, "chat");
      const nextPhase = result.phase ?? (result.readyForDirections ? "position" : "interrogate");
      const nextArtifact: ArtifactKind | null = nextPhase === "position" && (result.theses?.length ?? 0) > 0
        ? "thesis"
        : (result.brief?.length ?? working.brief.length) > 0 ? "brief" : working.artifact;
      const productName = result.productName || working.productName;
      const patched: Conversation = {
        ...working,
        phase: nextPhase,
        productName,
        title: productName || working.title,
        brief: result.brief ?? working.brief,
        questions: result.questions ?? working.questions,
        theses: result.theses ?? working.theses,
        readyForDirections: result.readyForDirections ?? working.readyForDirections,
        artifact: nextArtifact,
        updatedAt: Date.now(),
      };
      setConversations((list) => list.map((c) => (c.id === conversationId ? patched : c)));
      streamReply(conversationId, result.reply, nextArtifact ?? undefined);
    } catch (error) {
      setGenerating(false);
      toast({
        title: "Forge couldn't reason about that turn",
        body: error instanceof Error ? error.message : "Try again in a moment.",
        tone: "danger",
      });
    }
  }, [activeId, composer, conv, generating, streamReply, toast]);

  const confirmBrief = useCallback((id: string) => {
    const item = conv?.brief.find((x) => x.id === id);
    if (item) void sendChat(`I can confirm this from my own knowledge: ${item.label}: ${item.body}`);
  }, [conv, sendChat]);

  const markAssumption = useCallback((id: string) => {
    const item = conv?.brief.find((x) => x.id === id);
    if (item) void sendChat(`Treat this as an assumption, not evidence: ${item.label}: ${item.body}`);
  }, [conv, sendChat]);

  const selectThesis = useCallback((id: ThesisId) => {
    patchActive((c) => ({ ...c, selectedThesis: id, artifact: "thesis" }));
    setArtifactOpen(true);
  }, [patchActive]);

  const lockThesis = useCallback(async () => {
    if (!conv || conv.phase !== "position" || generating) return;
    const thesis = conv.theses.find((t) => t.id === conv.selectedThesis);
    if (!thesis) return;
    setGenerating(true);
    try {
      const working = { ...conv, thesisLocked: true };
      const result = await runForgeTurn(working, `I choose ${thesis.title}. Lock this direction and write the spec.`, "lock-thesis");
      const patched: Conversation = {
        ...working,
        phase: "spec",
        spec: result.spec ?? working.spec,
        brief: result.brief ?? working.brief,
        questions: result.questions ?? working.questions,
        theses: result.theses ?? working.theses,
        artifact: "spec",
        updatedAt: Date.now(),
      };
      setConversations((list) => list.map((c) => (c.id === conv.id ? patched : c)));
      setArtifactOpen(true);
      streamReply(conv.id, result.reply, "spec");
    } catch (error) {
      setGenerating(false);
      toast({ title: "Spec generation failed", body: error instanceof Error ? error.message : "Try again.", tone: "danger" });
    }
  }, [conv, generating, streamReply, toast]);

  const buildPrototype = useCallback(async () => {
    if (!conv?.spec || !conv.thesisLocked || generating) {
      if (!conv?.spec) toast({ title: "No spec yet", body: "Choose and lock a direction first.", tone: "warn" });
      return;
    }
    setGenerating(true);
    try {
      const result = await runForgeTurn(conv, "Build a prototype that tests the core workflow in this spec.", "prototype");
      if (!result.prototype) throw new Error("Forge did not return a prototype.");
      const patched: Conversation = { ...conv, phase: "prototype", prototype: result.prototype, artifact: "prototype", updatedAt: Date.now() };
      setConversations((list) => list.map((c) => (c.id === conv.id ? patched : c)));
      setArtifactOpen(true);
      streamReply(conv.id, result.reply, "prototype");
    } catch (error) {
      setGenerating(false);
      toast({ title: "Prototype generation failed", body: error instanceof Error ? error.message : "Try again.", tone: "danger" });
    }
  }, [conv, generating, streamReply, toast]);

  const openArtifact = useCallback((kind: ArtifactKind) => {
    patchActive((c) => ({ ...c, artifact: kind }));
    setArtifactOpen(true);
  }, [patchActive]);

  const copySpec = useCallback(() => {
    if (!conv?.spec) return;
    void navigator.clipboard.writeText(specToMarkdown(conv.spec));
    toast({ title: "Spec copied", body: "Markdown is on your clipboard.", tone: "success" });
  }, [conv, toast]);

  const copyPrototype = useCallback(() => {
    if (!conv?.prototype) return;
    void navigator.clipboard.writeText(conv.prototype.html);
    toast({ title: "Prototype copied", body: "HTML is on your clipboard.", tone: "success" });
  }, [conv, toast]);

  const later = useCallback((feature: string) => {
    toast({ title: "Not available yet", body: `${feature} is not implemented yet.`, tone: "warn" });
  }, [toast]);

  const value = useMemo<ForgeContextValue>(() => ({
    theme, screen, sidebarOpen, sidebarCollapsed, artifactOpen, conversations, activeId, conv, composer, generating, toasts,
    setScreen: (s) => { setScreen(s); setSidebarOpen(false); },
    setSidebarOpen, setSidebarCollapsed, setArtifactOpen, setComposer, toggleTheme, newProject, openConversation, sendChat,
    confirmBrief, markAssumption, selectThesis, lockThesis, buildPrototype, openArtifact, copySpec, copyPrototype, toast, dismissToast, later,
  }), [theme, screen, sidebarOpen, sidebarCollapsed, artifactOpen, conversations, activeId, conv, composer, generating, toasts, toggleTheme, newProject, openConversation, sendChat, confirmBrief, markAssumption, selectThesis, lockThesis, buildPrototype, openArtifact, copySpec, copyPrototype, toast, dismissToast, later]);

  return <ForgeContext.Provider value={value}>{children}</ForgeContext.Provider>;
}

export function useForge() {
  const ctx = useContext(ForgeContext);
  if (!ctx) throw new Error("useForge must be used within ForgeProvider");
  return ctx;
}
