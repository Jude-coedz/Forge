import type { BriefItem, Conversation, ProductQuestion, PrototypeDoc, SpecDoc, ThesisOption } from "../types";
import { RemoteReasoningProvider } from "./remote";
import type { ForgeReasoningProvider, ForgeTurnMode } from "./provider";

export type ForgeTurnResult = {
  reply: string;
  productName?: string;
  brief?: BriefItem[];
  questions?: ProductQuestion[];
  theses?: ThesisOption[];
  readyForDirections?: boolean;
  phase?: Conversation["phase"];
  spec?: SpecDoc | null;
  prototype?: PrototypeDoc | null;
};

function cleanBrief(value: unknown): BriefItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const raw = item as Record<string, unknown>;
      const provenance = raw.provenance === "evidence" || raw.provenance === "inference" || raw.provenance === "unknown"
        ? raw.provenance
        : "unknown";
      return {
        id: typeof raw.id === "string" ? raw.id : `brief-${index}`,
        label: typeof raw.label === "string" ? raw.label : "Working belief",
        body: typeof raw.body === "string" ? raw.body : "",
        confidence: raw.confidence === "high" || raw.confidence === "medium" || raw.confidence === "needs-validation"
          ? raw.confidence
          : "needs-validation",
        confirmed: raw.confirmed === true,
        assumption: provenance !== "evidence",
        provenance,
      } satisfies BriefItem;
    });
}

function cleanQuestions(value: unknown): ProductQuestion[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const raw = item as Record<string, unknown>;
      return {
        id: typeof raw.id === "string" ? raw.id : `q-${index}`,
        question: typeof raw.question === "string" ? raw.question : "",
        whyItMatters: typeof raw.whyItMatters === "string" ? raw.whyItMatters : "This could change the product decision.",
        priority: raw.priority === "critical" || raw.priority === "high" || raw.priority === "medium" ? raw.priority : "high",
        answered: raw.answered === true,
        answer: typeof raw.answer === "string" ? raw.answer : undefined,
      } satisfies ProductQuestion;
    })
    .filter((q) => q.question.trim().length > 0);
}

function cleanTheses(value: unknown): ThesisOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids: ThesisOption["id"][] = ["A", "B", "C", "CUSTOM"];
  return value.slice(0, 4).map((item, index) => {
    const raw = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      id: ids[index] ?? "CUSTOM",
      title: typeof raw.title === "string" ? raw.title : "Product direction",
      description: typeof raw.description === "string" ? raw.description : "",
      pros: Array.isArray(raw.pros) ? raw.pros.filter((x): x is string => typeof x === "string") : [],
      risks: Array.isArray(raw.risks) ? raw.risks.filter((x): x is string => typeof x === "string") : [],
      score: typeof raw.score === "number" ? Math.max(0, Math.min(100, Math.round(raw.score))) : 50,
      recommended: raw.recommended === true,
      userAuthored: raw.userAuthored === true,
    } satisfies ThesisOption;
  });
}

function clipWords(text: string, max: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text.trim();
  return `${words.slice(0, max).join(" ")}…`;
}

function compactChatReply(value: unknown, mode: ForgeTurnMode) {
  const fallback = "I need a little more context to respond usefully.";
  if (typeof value !== "string" || !value.trim()) return fallback;
  const text = value.trim();
  if (mode !== "chat") return text;

  const words = text.split(/\s+/);
  if (words.length <= 110) return text;

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const insight = clipWords(paragraphs[0] ?? text, 42);
  const question = [...paragraphs].reverse().find((p) => p.includes("?"));
  const why = paragraphs.find((p) => /why this matters|this matters because/i.test(p));
  const parts = [insight];
  if (question && question !== paragraphs[0]) parts.push(clipWords(question, 45));
  if (why && why !== question && why !== paragraphs[0]) parts.push(clipWords(why, 22));
  return clipWords(parts.join("\n\n"), 110);
}

export async function runForgeTurn(
  conversation: Conversation,
  message: string,
  mode: ForgeTurnMode = "chat",
  provider: ForgeReasoningProvider = new RemoteReasoningProvider(),
): Promise<ForgeTurnResult> {
  const raw = (await provider.runTurn(conversation, message, mode)) as Record<string, unknown>;
  return {
    reply: compactChatReply(raw.reply, mode),
    productName: typeof raw.productName === "string" ? raw.productName.trim() : undefined,
    brief: cleanBrief(raw.brief),
    questions: cleanQuestions(raw.questions),
    theses: cleanTheses(raw.theses),
    readyForDirections: typeof raw.readyForDirections === "boolean" ? raw.readyForDirections : undefined,
    phase: raw.phase === "idle" || raw.phase === "interrogate" || raw.phase === "position" || raw.phase === "spec" || raw.phase === "prototype"
      ? raw.phase
      : undefined,
    spec: raw.spec && typeof raw.spec === "object" ? (raw.spec as SpecDoc) : raw.spec === null ? null : undefined,
    prototype: raw.prototype && typeof raw.prototype === "object" ? (raw.prototype as PrototypeDoc) : raw.prototype === null ? null : undefined,
  };
}
