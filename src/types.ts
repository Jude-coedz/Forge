export type ProjectStage = "frame" | "challenge" | "decide" | "brief" | "handoff";
export type Theme = "dark" | "light";
export type Severity = "critical" | "high" | "medium" | "low";

export type ThesisId = "A" | "B" | "C" | "CUSTOM";
export type ChatRole = "user" | "assistant";
export type ProductRisk = "value" | "usability" | "feasibility" | "viability";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
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
  nonGoals: string[];
  requirements: Requirement[];
  failureModes: FailureMode[];
  questions: string[];
  metrics: { name: string; target: string }[];
  validationPlan: ValidationItem[];
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  stage: ProjectStage;
  messages: ChatMessage[];
  sources: string[];
  productModel: ProductModel;
  theses: ThesisOption[];
  selectedThesis: ThesisId;
  thesisLocked: boolean;
  spec: SpecDoc | null;
  productName: string;
};

export type Toast = {
  id: string;
  title: string;
  body?: string;
  tone: "default" | "success" | "warn" | "danger";
};
