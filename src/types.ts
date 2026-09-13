export type Phase = "idle" | "brief" | "interrogate" | "position" | "spec" | "prototype" | "eval";
export type ArtifactKind = "brief" | "thesis" | "spec" | "prototype" | "eval";
export type Theme = "dark" | "light";
export type Confidence = "high" | "medium" | "needs-validation";
export type Severity = "critical" | "high" | "medium" | "low";
export type AppScreen = "chat" | "settings";

export type ThesisId = "A" | "B" | "C" | "CUSTOM";
export type ChatRole = "user" | "assistant";
export type ProductRisk = "value" | "usability" | "feasibility" | "viability";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  artifact?: ArtifactKind;
  streaming?: boolean;
};

export type BriefItem = {
  id: string;
  label: string;
  body: string;
  confidence: Confidence;
  confirmed: boolean;
  assumption: boolean;
  provenance?: "evidence" | "inference" | "unknown";
};

export type ProductQuestion = {
  id: string;
  question: string;
  whyItMatters: string;
  priority: "critical" | "high" | "medium";
  answered: boolean;
  answer?: string;
};

export type EvidenceNode = {
  id: string;
  claim: string;
  source: string;
  strength: "strong" | "moderate" | "weak";
};

export type AssumptionNode = {
  id: string;
  claim: string;
  risk: ProductRisk;
  status: "untested" | "supported" | "invalidated";
};

export type DecisionNode = {
  id: string;
  question: string;
  status: "open" | "decided";
  recommendation: string;
  decision: string;
  rationale: string;
  affects: string[];
};

export type ValidationTask = {
  id: string;
  assumptionId: string;
  test: string;
  successSignal: string;
  status: "todo" | "done";
};

export type ProductModel = {
  summary: string;
  primaryUser: string;
  opportunity: string;
  currentWorkaround: string;
  desiredOutcome: string;
  evidence: EvidenceNode[];
  assumptions: AssumptionNode[];
  decisions: DecisionNode[];
  validationTasks: ValidationTask[];
};

export type ThesisOption = {
  id: ThesisId;
  title: string;
  description: string;
  pros: string[];
  risks: string[];
  score: number;
  recommended?: boolean;
  userAuthored?: boolean;
};

export type Requirement = {
  id: string;
  name: string;
  story: string;
  priority: "P0" | "P1" | "P2";
  source: string;
  criteria: string[];
  screen: string;
  risk: Severity;
};

export type FailureMode = {
  id: string;
  title: string;
  severity: Severity;
  likelihood: "high" | "medium" | "low";
  containment: string;
};

export type ValidationItem = {
  risk: ProductRisk;
  assumption: string;
  test: string;
  successSignal: string;
};

export type SpecDoc = {
  productName: string;
  thesis: string;
  overview: string;
  requirements: Requirement[];
  failureModes: FailureMode[];
  questions: string[];
  metrics: { name: string; target: string }[];
  screens: string[];
  validationPlan?: ValidationItem[];
};

export type PrototypeDoc = {
  html: string;
  summary: string;
  builtAt: number;
};

export type EvalCheck = {
  id: string;
  requirementId: string;
  label: string;
  status: "pass" | "partial" | "fail";
  evidence: string;
  issue: string;
  recommendation: string;
};

export type EvalReport = {
  summary: string;
  checks: EvalCheck[];
  passed: number;
  partial: number;
  failed: number;
  ranAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  phase: Phase;
  messages: ChatMessage[];
  sources: string[];
  brief: BriefItem[];
  productModel: ProductModel;
  questions: ProductQuestion[];
  theses: ThesisOption[];
  selectedThesis: ThesisId;
  thesisLocked: boolean;
  spec: SpecDoc | null;
  prototype: PrototypeDoc | null;
  evalReport: EvalReport | null;
  artifact: ArtifactKind | null;
  productName: string;
  readyForDirections: boolean;
};

export type Toast = {
  id: string;
  title: string;
  body?: string;
  tone: "default" | "success" | "warn" | "danger";
};
