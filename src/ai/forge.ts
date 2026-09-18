import type {
  Conversation,
  ProductModel,
  SpecDoc,
  ThesisOption,
} from "../types";
import { RemoteReasoningProvider } from "./remote";
import type { ForgeReasoningProvider, ForgeTurnMode } from "./provider";

export type ForgeTurnResult = {
  reply: string;
  productName?: string;
  productModel?: ProductModel;
  theses?: ThesisOption[];
  spec?: SpecDoc | null;
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

function cleanReply(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "I need a little more context to respond usefully.";
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
    theses: cleanTheses(raw.theses),
    spec: raw.spec && typeof raw.spec === "object" ? (raw.spec as SpecDoc) : raw.spec === null ? null : undefined,
  };
}
