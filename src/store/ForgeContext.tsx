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
  advanceToDirections: () => void;
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

  const finishReply = useCallback((conversationId: string, assistantId: string, full: string, artifact?: ArtifactKind) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setConversations((list) => list.map((c) => c.id === conversationId ? {
        ...c,
        messages: c.messages.map((m) => m.id === assistantId ? { ...m, text: full, artifact, streaming: false } : m),
      } : c));
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
          messages: c.messages.map((m) => m.id === assistantId ? { ...m, text: full, artifact, streaming: false } : m),
        } : c));
        setGenerating(false);
        return;
      }
      acc += parts[i++];
      const snapshot = acc;
      setConversations((list) => list.map((c) => c.id === conversationId ? {
        ...c,
        messages: c.messages.map((m) => m.id === assistantId ? { ...m, text: snapshot, artifact } : m),
      } : c));
      timers.current.push(window.setTimeout(tick, 12));
    };
    timers.current.push(window.setTimeout(tick, 80));
  }, []);

  const failReply = useCallback((conversationId: string, assistantId: string, message: string) => {
    setConversations((list) => list.map((c) => c.id === conversationId ? {
      ...c,
      messages: c.messages.map((m) => m.id === assistantId ? {
        ...m,
        text: `I couldn't complete that turn. ${message}`,
        streaming: false,
      } : m),
    } : c));
    setGenerating(false);
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
    const thinkingMsg: ChatMessage = { id: uid(), role: "assistant", text: "", createdAt: Date.now(), streaming: true };
    const firstTurn = base.phase === "idle";
    const working: Conversation = {
      ...base,
      phase: firstTurn ? "interrogate" : base.phase,
      sources: firstTurn ? [...base.sources, content] : base.sources,
      messages: [...base.messages, userMsg, thinkingMsg],
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
      const productName = result.productName || working.productName;
      const hasBrief = (result.brief?.length ?? working.brief.length) > 0;
      const patched: Conversation = {
        ...working,
        phase: "interrogate",
        productName,
        title: productName || working.title,
        brief: result.brief ?? working.brief,
        questions: result.questions ?? working.questions,
        theses: [],
        readyForDirections: result.readyForDirections ?? working.readyForDirections,
        artifact: hasBrief ? "brief" : working.artifact,
        updatedAt: Date.now(),
      };
      setConversations((list) => list.map((c) => (c.id === conversationId ? patched : c)));
      finishReply(conversationId, thinkingMsg.id, result.reply);
    } catch (error) {
      failReply(
        conversationId,
        thinkingMsg.id,
        error instanceof Error ? `${error.message} You can retry without retyping your previous messages.` : "Try again in a moment.",
      );
    }
  }, [activeId, composer, conv, failReply, finishReply, generating]);

  const advanceToDirections = useCallback(async () => {
    if (!conv || !conv.readyForDirections || generating) return;
    const thinkingMsg: ChatMessage = { id: uid(), role: "assistant", text: "", createdAt: Date.now(), streaming: true };
    const working: Conversation = { ...conv, messages: [...conv.messages, thinkingMsg], updatedAt: Date.now() };
    setGenerating(true);
    setConversations((list) => list.map((c) => c.id === conv.id ? working : c));
    try {
      const result = await runForgeTurn(working, "Show me the product directions now.", "directions");
      const theses = result.theses ?? [];
      const selected = theses.find((t) => t.recommended)?.id ?? theses[0]?.id ?? "A";
      const patched: Conversation = {
        ...working,
        phase: "position",
        theses,
        selectedThesis: selected,
        brief: result.brief ?? working.brief,
        questions: result.questions ?? working.questions,
        readyForDirections: true,
        artifact: "thesis",
        updatedAt: Date.now(),
      };
      setConversations((list) => list.map((c) => c.id === conv.id ? patched : c));
      setArtifactOpen(true);
      finishReply(conv.id, thinkingMsg.id, result.reply, "thesis");
    } catch (error) {
      failReply(conv.id, thinkingMsg.id, error instanceof Error ? error.message : "Try again.");
    }
  }, [conv, failReply, finishReply, generating]);

  const selectThesis = useCallback((id: ThesisId) => {
    patchActive((c) => ({ ...c, selectedThesis: id, artifact: "thesis" }));
    setArtifactOpen(true);
  }, [patchActive]);

  const lockThesis = useCallback(async () => {
    if (!conv || conv.phase !== "position" || generating) return;
    const thesis = conv.theses.find((t) => t.id === conv.selectedThesis);
    if (!thesis) return;
    const thinkingMsg: ChatMessage = { id: uid(), role: "assistant", text: "", createdAt: Date.now(), streaming: true };
    const working = { ...conv, thesisLocked: true, messages: [...conv.messages, thinkingMsg] };
    setGenerating(true);
    setConversations((list) => list.map((c) => c.id === conv.id ? working : c));
    try {
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
      finishReply(conv.id, thinkingMsg.id, result.reply, "spec");
    } catch (error) {
      failReply(conv.id, thinkingMsg.id, error instanceof Error ? error.message : "Try again.");
    }
  }, [conv, failReply, finishReply, generating]);

  const buildPrototype = useCallback(async () => {
    if (!conv?.spec || !conv.thesisLocked || generating) {
      if (!conv?.spec) toast({ title: "No spec yet", body: "Choose and lock a direction first.", tone: "warn" });
      return;
    }
    const thinkingMsg: ChatMessage = { id: uid(), role: "assistant", text: "", createdAt: Date.now(), streaming: true };
    const working = { ...conv, messages: [...conv.messages, thinkingMsg] };
    setGenerating(true);
    setConversations((list) => list.map((c) => c.id === conv.id ? working : c));
    try {
      const result = await runForgeTurn(working, "Build a prototype that tests the core workflow in this spec.", "prototype");
      if (!result.prototype) throw new Error("Forge did not return a prototype.");
      const patched: Conversation = { ...working, phase: "prototype", prototype: result.prototype, artifact: "prototype", updatedAt: Date.now() };
      setConversations((list) => list.map((c) => (c.id === conv.id ? patched : c)));
      setArtifactOpen(true);
      finishReply(conv.id, thinkingMsg.id, result.reply, "prototype");
    } catch (error) {
      failReply(conv.id, thinkingMsg.id, error instanceof Error ? error.message : "Try again.");
    }
  }, [conv, failReply, finishReply, generating, toast]);

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
    advanceToDirections, selectThesis, lockThesis, buildPrototype, openArtifact, copySpec, copyPrototype, toast, dismissToast, later,
  }), [theme, screen, sidebarOpen, sidebarCollapsed, artifactOpen, conversations, activeId, conv, composer, generating, toasts, toggleTheme, newProject, openConversation, sendChat, advanceToDirections, selectThesis, lockThesis, buildPrototype, openArtifact, copySpec, copyPrototype, toast, dismissToast, later]);

  return <ForgeContext.Provider value={value}>{children}</ForgeContext.Provider>;
}

export function useForge() {
  const ctx = useContext(ForgeContext);
  if (!ctx) throw new Error("useForge must be used within ForgeProvider");
  return ctx;
}