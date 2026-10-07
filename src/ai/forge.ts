import type {
  Conversation,
  MarketResearch,
  ProductModel,
  PrototypeDoc,
  SpecDoc,
  ThesisOption,
} from "../types";
import { RemoteReasoningProvider } from "./remote";
import type { ForgeReasoningProvider, ForgeTurnMode } from "./provider";

export type ForgeTurnResult = {
  reply: string;
  productName?: string;
  productModel?: ProductModel;
  research?: MarketResearch | null;
  theses?: ThesisOption[];
  spec?: SpecDoc | null;
  prototype?: PrototypeDoc | null;
};

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
      recommended: raw.recommended === true,
      userAuthored: raw.userAuthored === true,
    } satisfies ThesisOption;
  });
}

function cleanProductModel(value: unknown): ProductModel | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const stringValue = (key: string) => typeof raw[key] === "string" ? (raw[key] as string) : "";
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];
  const assumptions = Array.isArray(raw.assumptions) ? raw.assumptions : [];
  const decisions = Array.isArray(raw.decisions) ? raw.decisions : [];
  const validationTasks = Array.isArray(raw.validationTasks) ? raw.validationTasks : [];

  return {
    summary: stringValue("summary"),
    primaryUser: stringValue("primaryUser"),
    opportunity: stringValue("opportunity"),
    currentWorkaround: stringValue("currentWorkaround"),
    desiredOutcome: stringValue("desiredOutcome"),
    evidence: evidence.filter(Boolean).map((item, index) => {
      const node = item as Record<string, unknown>;
      return {
        id: typeof node.id === "string" ? node.id : `e-${index}`,
        claim: typeof node.claim === "string" ? node.claim : "",
        source: typeof node.source === "string" ? node.source : "User input",
        strength: node.strength === "strong" || node.strength === "moderate" || node.strength === "weak" ? node.strength : "weak",
      };
    }),
    assumptions: assumptions.filter(Boolean).map((item, index) => {
      const node = item as Record<string, unknown>;
      return {
        id: typeof node.id === "string" ? node.id : `a-${index}`,
        claim: typeof node.claim === "string" ? node.claim : "",
        risk: node.risk === "value" || node.risk === "usability" || node.risk === "feasibility" || node.risk === "viability" ? node.risk : "value",
        status: node.status === "supported" || node.status === "invalidated" || node.status === "untested" ? node.status : "untested",
      };
    }),
    decisions: decisions.filter(Boolean).map((item, index) => {
      const node = item as Record<string, unknown>;
      return {
        id: typeof node.id === "string" ? node.id : `d-${index}`,
        question: typeof node.question === "string" ? node.question : "",
        status: node.status === "decided" ? "decided" : "open",
        recommendation: typeof node.recommendation === "string" ? node.recommendation : "",
        decision: typeof node.decision === "string" ? node.decision : "",
        rationale: typeof node.rationale === "string" ? node.rationale : "",
        affects: Array.isArray(node.affects) ? node.affects.filter((x): x is string => typeof x === "string") : [],
      };
    }),
    validationTasks: validationTasks.filter(Boolean).map((item, index) => {
      const node = item as Record<string, unknown>;
      return {
        id: typeof node.id === "string" ? node.id : `v-${index}`,
        assumptionId: typeof node.assumptionId === "string" ? node.assumptionId : "",
        test: typeof node.test === "string" ? node.test : "",
        successSignal: typeof node.successSignal === "string" ? node.successSignal : "",
        status: node.status === "done" ? "done" : "todo",
      };
    }),
  };
}

function cleanResearch(value: unknown): MarketResearch | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const signals = Array.isArray(raw.signals) ? raw.signals : [];
  const alternatives = Array.isArray(raw.alternatives) ? raw.alternatives : [];
  const unresolved = Array.isArray(raw.unresolved) ? raw.unresolved : [];
  const sources = Array.isArray(raw.sources) ? raw.sources : [];

  return {
    summary: typeof raw.summary === "string" ? raw.summary : "",
    signals: signals.filter(Boolean).map((item) => {
      const node = item as Record<string, unknown>;
      return {
        title: typeof node.title === "string" ? node.title : "",
        detail: typeof node.detail === "string" ? node.detail : "",
        stance: node.stance === "supports" || node.stance === "challenges" || node.stance === "context"
          ? node.stance
          : "context",
      };
    }),
    alternatives: alternatives.filter(Boolean).map((item) => {
      const node = item as Record<string, unknown>;
      return {
        name: typeof node.name === "string" ? node.name : "",
        description: typeof node.description === "string" ? node.description : "",
        relevance: typeof node.relevance === "string" ? node.relevance : "",
      };
    }),
    unresolved: unresolved.filter((x): x is string => typeof x === "string"),
    sources: sources.filter(Boolean).map((item) => {
      const node = item as Record<string, unknown>;
      return {
        title: typeof node.title === "string" ? node.title : "",
        url: typeof node.url === "string" ? node.url : "",
      };
    }).filter((item) => item.url.startsWith("http")),
    researchedAt: Date.now(),
  };
}

function cleanPrototype(value: unknown): PrototypeDoc | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  if (typeof raw.html !== "string" || !raw.html.trim()) return undefined;
  return {
    html: raw.html,
    summary: typeof raw.summary === "string" ? raw.summary : "Interactive prototype generated from the locked build brief.",
    screens: Array.isArray(raw.screens) ? raw.screens.filter((x): x is string => typeof x === "string").slice(0, 8) : [],
    builtAt: Date.now(),
  };
}

function cleanReply(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "I’ve kept the uncertain parts explicit and updated the working product model from what you gave me.";
  return value.trim();
}

export async function runForgeTurn(
  conversation: Conversation,
  message: string,
  mode: ForgeTurnMode = "chat",
  provider: ForgeReasoningProvider = new RemoteReasoningProvider(),
): Promise<ForgeTurnResult> {
  const raw = (await provider.runTurn(conversation, message, mode)) as Record<string, unknown>;
  return {
    reply: cleanReply(raw.reply),
    productName: typeof raw.productName === "string" ? raw.productName.trim() : undefined,
    productModel: cleanProductModel(raw.productModel),
    research: cleanResearch(raw.research),
    theses: cleanTheses(raw.theses),
    spec: raw.spec && typeof raw.spec === "object" ? (raw.spec as SpecDoc) : raw.spec === null ? null : undefined,
    prototype: cleanPrototype(raw.prototype),
  };
}
