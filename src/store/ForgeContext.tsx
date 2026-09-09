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
import { applyTurn, buildSpec, displayName, specToMarkdown } from "../lib/engine";
import { generatePrototype } from "../lib/prototype";
import { uid } from "../lib/id";
import type {
  AppScreen,
  ArtifactKind,
  ChatMessage,
  Conversation,
  Theme,
  ThesisId,
  Toast,
} from "../types";

const STORAGE_KEY = "forge-conversations-v1";
const ACTIVE_KEY = "forge-active-v1";

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
    theses: [],
    selectedThesis: "B",
    thesisLocked: false,
    spec: null,
    prototype: null,
    artifact: null,
    productName: "",
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
        ...c,
        productName: name,
        title: /^whatsapp$/i.test(c.title ?? "") ? name || c.title : c.title,
        prototype: c.prototype ?? null,
        spec: c.spec
          ? { ...c.spec, productName: displayName(c.spec.productName, source) || c.spec.productName }
          : c.spec,
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
    /* ignore */
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
  const [artifactOpen, setArtifactOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveId(loadConversations()));
  const [composer, setComposer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  const conv = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeId]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3400);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const patchActive = useCallback((fn: (c: Conversation) => Conversation) => {
    setConversations((list) => list.map((c) => (c.id === activeId ? fn({ ...c, updatedAt: Date.now() }) : c)));
  }, [activeId]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("forge-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  const newProject = useCallback(() => {
    const blank = conversations.find((c) => c.phase === "idle" && c.messages.length === 0);
    if (blank) {
      setActiveId(blank.id);
    } else {
      const next = blankConversation();
      setConversations((list) => [next, ...list]);
      setActiveId(next.id);
    }
    setScreen("chat");
    setSidebarOpen(false);
    setComposer("");
  }, [conversations]);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setScreen("chat");
    setSidebarOpen(false);
  }, []);

  const streamReply = useCallback(
    (conversationId: string, full: string, artifact?: ArtifactKind) => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const assistant: ChatMessage = {
        id: uid(),
        role: "assistant",
        text: reduce ? full : "",
        createdAt: Date.now(),
        artifact,
        streaming: !reduce,
      };
      setConversations((list) =>
        list.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, assistant] } : c)),
      );
      if (reduce) {
        setGenerating(false);
        return;
      }
      const parts = full.split(/(\s+)/);
      let i = 0;
      let acc = "";
      const tick = () => {
        if (i >= parts.length) {
          setConversations((list) =>
            list.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: c.messages.map((m) => (m.id === assistant.id ? { ...m, text: full, streaming: false } : m)),
                  }
                : c,
            ),
          );
          setGenerating(false);
          return;
        }
        acc += parts[i++];
        const snapshot = acc;
        setConversations((list) =>
          list.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === assistant.id ? { ...m, text: snapshot } : m)),
                }
              : c,
          ),
        );
        const delay = /\n/.test(parts[i - 1] ?? "") ? 28 : 10;
        timers.current.push(window.setTimeout(tick, delay));
      };
      timers.current.push(window.setTimeout(tick, 240));
    },
    [],
  );

  const sendChat = useCallback(
    (text?: string) => {
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

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        text: content,
        createdAt: Date.now(),
      };

      const working: Conversation = {
        ...base,
        messages: [...base.messages, userMsg],
        updatedAt: Date.now(),
      };
      const result = applyTurn(working, content);
      const patched: Conversation = {
        ...working,
        ...result.patch,
        updatedAt: Date.now(),
      };

      setConversations((list) => {
        const exists = list.some((c) => c.id === conversationId);
        if (!exists) return [patched, ...list];
        return list.map((c) => (c.id === conversationId ? patched : c));
      });
      setComposer("");
      setGenerating(true);
      if (result.artifact) setArtifactOpen(true);
      streamReply(conversationId, result.reply, result.artifact ?? undefined);
    },
    [activeId, composer, conv, generating, streamReply],
  );

  const confirmBrief = useCallback(
    (id: string) => {
      patchActive((c) => ({
        ...c,
        brief: c.brief.map((b) => (b.id === id ? { ...b, confirmed: true, assumption: false } : b)),
      }));
    },
    [patchActive],
  );

  const markAssumption = useCallback(
    (id: string) => {
      patchActive((c) => ({
        ...c,
        brief: c.brief.map((item) =>
          item.id === id ? { ...item, assumption: true, confirmed: false, confidence: "needs-validation" } : item,
        ),
      }));
    },
    [patchActive],
  );

  const selectThesis = useCallback(
    (id: ThesisId) => {
      patchActive((c) => ({ ...c, selectedThesis: id, artifact: "thesis" }));
      setArtifactOpen(true);
    },
    [patchActive],
  );

  const lockThesis = useCallback(() => {
    if (!conv || conv.phase === "idle") return;
    const spec = buildSpec({ ...conv, thesisLocked: true });
    patchActive((c) => ({
      ...c,
      thesisLocked: true,
      spec,
      phase: "spec",
      artifact: "spec",
    }));
    setArtifactOpen(true);
    setGenerating(true);
    streamReply(
      conv.id,
      `Locked **${conv.theses.find((t) => t.id === conv.selectedThesis)?.title ?? "this category"}**.\n\nI wrote the spec for **${spec.productName}**, including failure modes. Ask me to build a prototype when you want a clickable preview — Lovable-shaped, but constrained by this spec.`,
      "spec",
    );
  }, [conv, patchActive, streamReply]);

  const openArtifact = useCallback(
    (kind: ArtifactKind) => {
      patchActive((c) => ({ ...c, artifact: kind }));
      setArtifactOpen(true);
    },
    [patchActive],
  );

  const copySpec = useCallback(() => {
    if (!conv?.spec) return;
    void navigator.clipboard.writeText(specToMarkdown(conv.spec));
    toast({ title: "Spec copied", body: "Markdown is on your clipboard.", tone: "success" });
  }, [conv, toast]);

  const copyPrototype = useCallback(() => {
    if (!conv?.prototype) return;
    void navigator.clipboard.writeText(conv.prototype.html);
    toast({ title: "Prototype HTML copied", body: "Paste it into an .html file and open it.", tone: "success" });
  }, [conv, toast]);

  const buildPrototype = useCallback(() => {
    if (!conv?.spec || !conv.thesisLocked) {
      toast({ title: "Lock a category first", body: "No prototype until the spec exists.", tone: "warn" });
      return;
    }
    const prototype = generatePrototype(conv);
    patchActive((c) => ({
      ...c,
      prototype,
      phase: "prototype",
      artifact: "prototype",
    }));
    setArtifactOpen(true);
    setGenerating(true);
    streamReply(
      conv.id,
      `Built a clickable prototype for **${conv.spec.productName}**.\n\n${prototype.summary}\n\nOpen the preview. Try marking paid or sending — it should stop you. Hosted export to Lovable / v0 is later.`,
      "prototype",
    );
  }, [conv, patchActive, streamReply, toast]);

  const later = useCallback((feature: string) => {
    toast({
      title: "Later — not faked",
      body: `${feature} is not in this demo.`,
      tone: "warn",
    });
  }, [toast]);

  const value = useMemo<ForgeContextValue>(
    () => ({
      theme,
      screen,
      sidebarOpen,
      sidebarCollapsed,
      artifactOpen,
      conversations,
      activeId,
      conv,
      composer,
      generating,
      toasts,
      setScreen: (s) => {
        setScreen(s);
        setSidebarOpen(false);
      },
      setSidebarOpen,
      setSidebarCollapsed,
      setArtifactOpen,
      setComposer,
      toggleTheme,
      newProject,
      openConversation,
      sendChat,
      confirmBrief,
      markAssumption,
      selectThesis,
      lockThesis,
      buildPrototype,
      openArtifact,
      copySpec,
      copyPrototype,
      toast,
      dismissToast,
      later,
    }),
    [
      theme,
      screen,
      sidebarOpen,
      sidebarCollapsed,
      artifactOpen,
      conversations,
      activeId,
      conv,
      composer,
      generating,
      toasts,
      toggleTheme,
      newProject,
      openConversation,
      sendChat,
      confirmBrief,
      markAssumption,
      selectThesis,
      lockThesis,
      buildPrototype,
      openArtifact,
      copySpec,
      copyPrototype,
      toast,
      dismissToast,
      later,
    ],
  );

  return <ForgeContext.Provider value={value}>{children}</ForgeContext.Provider>;
}

export function useForge() {
  const ctx = useContext(ForgeContext);
  if (!ctx) throw new Error("useForge must be used within ForgeProvider");
  return ctx;
}
