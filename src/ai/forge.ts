import type { BriefItem, ThesisOption } from "../types";
import { RemoteAnalysisProvider } from "./remote";
import type { ProductAnalysisProvider } from "./provider";

export type ForgeAnalysis = {
  productName: string;
  brief: BriefItem[];
  theses: ThesisOption[];
  whyRecommended: string;
};

type RawAnalysis = {
  productName?: unknown;
  problem?: unknown;
  targetUser?: unknown;
  workaround?: unknown;
  jobToBeDone?: unknown;
  constraints?: unknown;
  evidence?: unknown;
  unknowns?: unknown;
  theses?: unknown;
  whyRecommended?: unknown;
};

type RawThesis = {
  title?: unknown;
  description?: unknown;
  pros?: unknown;
  risks?: unknown;
  score?: unknown;
  recommended?: unknown;
};

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function confidence(value: unknown): BriefItem["confidence"] {
  return value === "high" || value === "medium" || value === "needs-validation" ? value : "needs-validation";
}

function item(id: string, label: string, value: unknown, fallback: string): BriefItem {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const evidence = strings(raw.evidence);
  const body = text(raw.body, fallback);
  return {
    id,
    label,
    body: evidence.length ? `${body}\n\nEvidence: ${evidence.join(" • ")}` : body,
    confidence: confidence(raw.confidence),
    confirmed: false,
    assumption: typeof raw.assumption === "boolean" ? raw.assumption : evidence.length === 0,
  };
}

function normalizeTheses(value: unknown): ThesisOption[] {
  const input = Array.isArray(value) ? value.slice(0, 3) : [];
  const ids = ["A", "B", "C"] as const;
  const fallbackTitles = ["Focused assistant", "Workflow system", "Managed service"];

  const theses = ids.map((id, index) => {
    const raw = input[index] && typeof input[index] === "object" ? (input[index] as RawThesis) : {};
    const numericScore = typeof raw.score === "number" ? Math.max(0, Math.min(100, Math.round(raw.score))) : 50;
    return {
      id,
      title: text(raw.title, fallbackTitles[index]),
      description: text(raw.description, "A distinct way to solve the problem that still needs validation."),
      pros: strings(raw.pros).slice(0, 4),
      risks: strings(raw.risks).slice(0, 4),
      score: numericScore,
      recommended: raw.recommended === true,
    } satisfies ThesisOption;
  });

  let recommendedIndex = theses.findIndex((thesis) => thesis.recommended);
  if (recommendedIndex < 0) {
    recommendedIndex = theses.reduce(
      (best, thesis, index, all) => (thesis.score > all[best].score ? index : best),
      0,
    );
  }
  return theses.map((thesis, index) => ({ ...thesis, recommended: index === recommendedIndex }));
}

function normalize(raw: RawAnalysis): ForgeAnalysis {
  return {
    productName: text(raw.productName, "Working title"),
    brief: [
      item("problem", "Problem", raw.problem, "The core problem is still unclear."),
      item("user", "Who it's for", raw.targetUser, "The first beachhead user is still unclear."),
      item("workaround", "Current workaround", raw.workaround, "The current workaround is unknown."),
      item("jtbd", "Job to be done", raw.jobToBeDone, "The job to be done needs validation."),
      item("constraints", "Constraints", raw.constraints, "Important product constraints are still unknown."),
      item("evidence", "Evidence in the source", raw.evidence, "There is not enough direct evidence yet."),
      item(
        "unknowns",
        "Questions you haven't answered yet",
        raw.unknowns,
        "What must be true for this product to deserve to exist?",
      ),
    ],
    theses: normalizeTheses(raw.theses),
    whyRecommended: text(
      raw.whyRecommended,
      "The recommendation needs more evidence before it should be trusted.",
    ),
  };
}

export async function analyzeProductSource(
  source: string,
  provider: ProductAnalysisProvider = new RemoteAnalysisProvider(),
): Promise<ForgeAnalysis> {
  const raw = (await provider.analyzeSource(source)) as RawAnalysis;
  return normalize(raw);
}
