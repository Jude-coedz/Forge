export type Phase = "idle" | "brief" | "interrogate" | "position" | "spec" | "prototype";
export type ArtifactKind = "brief" | "thesis" | "spec" | "prototype";
export type Theme = "dark" | "light";
export type Confidence = "high" | "medium" | "needs-validation";
export type Severity = "critical" | "high" | "medium" | "low";
export type AppScreen = "chat" | "settings";

export type ThesisId = "A" | "B" | "C" | "CUSTOM";
export type ChatRole = "user" | "assistant";

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

export type SpecDoc = {
  productName: string;
  thesis: string;
  overview: string;
  requirements: Requirement[];
  failureModes: FailureMode[];
  questions: string[];
  metrics: { name: string; target: string }[];
  screens: string[];
};

export type PrototypeDoc = {
  html: string;
  summary: string;
  builtAt: number;
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
  questions: ProductQuestion[];
  theses: ThesisOption[];
  selectedThesis: ThesisId;
  thesisLocked: boolean;
  spec: SpecDoc | null;
  prototype: PrototypeDoc | null;
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
