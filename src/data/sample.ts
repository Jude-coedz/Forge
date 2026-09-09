import type { BriefItem, FailureMode, Requirement, SpecDoc, ThesisOption } from "../types";

export const KORAFLOW_PASTE = `Small fashion and food sellers in Lagos are drowning in WhatsApp. Orders live in chats, payments are “I have transferred,” and follow-ups get buried. They don’t want another dashboard. They want the work captured from WhatsApp, with the ability to correct the AI when it’s wrong. First version: order tracking and customer follow-ups. Mobile first. Nothing goes to a customer unless they approve it.

— Adunni Atelier thread —
Chioma, 09:12: Hi Adunni, the ankara two-piece — do you still have size 12? I can do transfer today.
Adunni, 09:18: Yes babe, size 12 is remaining. 18,500. Pickup or dispatch to Lekki?
Chioma, 09:21: Dispatch. Please use the last address. I have transferred.
Adunni, 09:40: I haven’t seen it o. Which bank? I’ll confirm and pack.
Chioma, 09:44: GTBank. Name is Chioma Eze. Please I need it before Saturday.
Staff — Tunde, 10:02: Oga Adunni, three people asked about the satin dress. I replied two, I think I missed one.`;

export const KORAFLOW_NAME = "KoraFlow";

export const KORAFLOW_BRIEF: BriefItem[] = [
  {
    id: "problem",
    label: "Problem",
    confidence: "high",
    confirmed: false,
    assumption: false,
    body: "Small Nigerian merchants run daily operations through fragmented WhatsApp chats, so orders, payment status, and follow-ups get lost.",
  },
  {
    id: "user",
    label: "Who it's for",
    confidence: "high",
    confirmed: false,
    assumption: false,
    body: "Owner-operators of small fashion, food, and beauty businesses in Lagos who live in WhatsApp and do not have an ops team.",
  },
  {
    id: "workaround",
    label: "Current workaround",
    confidence: "high",
    confirmed: false,
    assumption: false,
    body: "Scrolling chats, informal notes, calling customers, treating transfer screenshots as truth, and relying on staff memory.",
  },
  {
    id: "jtbd",
    label: "Job to be done",
    confidence: "high",
    confirmed: false,
    assumption: false,
    body: "When orders arrive across WhatsApp, help me capture and track the important details so I can fulfill them without losing customers or money.",
  },
  {
    id: "constraints",
    label: "Constraints",
    confidence: "high",
    confirmed: false,
    assumption: false,
    body: "Mobile-first. WhatsApp-native. Human approval before any customer-facing message. Merchant can correct the AI. Never auto-confirm payment from chat language.",
  },
  {
    id: "evidence",
    label: "Evidence in the source",
    confidence: "medium",
    confirmed: false,
    assumption: false,
    body: "Chioma says “I have transferred” before Adunni can see it. Tunde missed a satin-dress inquiry. Delivery and payment are negotiated in the same thread.",
  },
  {
    id: "assumptions",
    label: "Assumptions",
    confidence: "needs-validation",
    confirmed: false,
    assumption: true,
    body: "Fashion, food, and beauty share one operational pattern. Merchants will review extractions daily. WhatsApp stays the primary channel.",
  },
  {
    id: "unknowns",
    label: "Still unknown",
    confidence: "needs-validation",
    confirmed: false,
    assumption: true,
    body: "Shared staff inboxes. Split payments. Inventory truth. WhatsApp Business API vs. export/screenshot capture.",
  },
];

export const KORAFLOW_THESES: ThesisOption[] = [
  {
    id: "A",
    title: "WhatsApp communication assistant",
    description: "Helps merchants reply faster with smart drafts and message automation.",
    pros: ["Familiar", "Easy to demo", "Fast first prototype"],
    risks: ["Becomes another chatbot", "Low switching cost", "Does not fix operational truth"],
    score: 62,
  },
  {
    id: "B",
    title: "Merchant system of record",
    description: "Turns WhatsApp conversations into structured orders, payment status, and follow-up work.",
    pros: ["Owns the workflow", "Higher retention", "Matches the evidence"],
    risks: ["Harder onboarding", "Accuracy and trust have to be real"],
    score: 87,
    recommended: true,
  },
  {
    id: "C",
    title: "Lightweight CRM for WhatsApp shops",
    description: "Tags conversations, stores customer records, and reminds you to follow up.",
    pros: ["Known category", "Easy competitor map"],
    risks: ["Crowded", "May not fix missed orders and fake “paid” status"],
    score: 71,
  },
];

export const KORAFLOW_WHY_B =
  "The thread is not a typing problem. Adunni can reply. The failure is operational truth: payment status, a missed inquiry, a delivery promise — all trapped in chat. WhatsApp is the input. The product is the record.";

const REQUIREMENTS: Requirement[] = [
  {
    id: "REQ-001",
    name: "Capture an order from a WhatsApp conversation",
    story: "As a merchant, I want an order extracted from a customer chat so I do not retype it.",
    priority: "P0",
    source: "Adunni Atelier thread",
    criteria: [
      "Extract product, size, customer, delivery, and amount when present",
      "Merchant can edit every field",
      "Uncertain fields are visibly marked",
      "No order exists until the merchant confirms",
    ],
    screen: "Order review",
    risk: "high",
  },
  {
    id: "REQ-002",
    name: "Merchant-owned payment status",
    story: "As a merchant, I want to control “paid” so a customer is never told a transfer landed when it has not.",
    priority: "P0",
    source: "“I have transferred” exchange",
    criteria: [
      "Payment defaults to Pending",
      "Chat language cannot mark Paid by itself",
      "Status changes are logged",
      "Any customer-facing notice requires approval",
    ],
    screen: "Order detail",
    risk: "critical",
  },
  {
    id: "REQ-003",
    name: "Follow-up queue",
    story: "As a merchant, I want a queue of people who still need a reply so inquiries do not die in the thread.",
    priority: "P0",
    source: "Tunde missed the satin-dress inquiry",
    criteria: [
      "Show overdue follow-ups",
      "Explain why the item is in the queue",
      "Draft a message; never send it by default",
    ],
    screen: "Follow-up queue",
    risk: "high",
  },
  {
    id: "REQ-004",
    name: "Correction is first-class",
    story: "As a merchant, I want to fix an AI mistake and see that the fix stuck.",
    priority: "P1",
    source: "Raw brief — “correct it when the AI gets something wrong”",
    criteria: [
      "Any extracted field is editable",
      "Corrections write to activity history",
      "Later suggestions in-session respect the correction",
    ],
    screen: "Activity log",
    risk: "medium",
  },
];

const FAILURE_MODES: FailureMode[] = [
  {
    id: "FM-001",
    title: "AI misreads product or quantity",
    severity: "high",
    likelihood: "medium",
    containment: "Flag low-confidence fields. Require merchant confirmation before the order is real.",
  },
  {
    id: "FM-002",
    title: "AI marks an unverified transfer as paid",
    severity: "critical",
    likelihood: "medium",
    containment: "Never auto-confirm payment from chat language. Paid is a merchant verb, or it comes from a verified provider.",
  },
  {
    id: "FM-003",
    title: "A follow-up goes to the wrong customer",
    severity: "high",
    likelihood: "low",
    containment: "Draft only. Show identity and thread context. Require explicit send.",
  },
  {
    id: "FM-004",
    title: "Merchant stops trusting the product after one confident error",
    severity: "high",
    likelihood: "high",
    containment: "Show source quotes, confidence, and a one-tap correction. Do not hide uncertainty.",
  },
];

export const KORAFLOW_SPEC: SpecDoc = {
  productName: KORAFLOW_NAME,
  thesis: "KoraFlow is a merchant system of record. WhatsApp is how work arrives — not the product category.",
  overview:
    "KoraFlow captures orders, payment status, and follow-ups from WhatsApp for small Lagos merchants. The merchant remains in control of every customer-facing action. The first slice is fashion, food, and beauty: order tracking and follow-ups, mobile-first, with correction as a core verb.",
  requirements: REQUIREMENTS,
  failureModes: FAILURE_MODES,
  questions: [
    "Will merchants trust extracted orders enough to stop searching WhatsApp?",
    "Is fashion the right first vertical, or should food lead because of order velocity?",
    "What happens to staff-shared WhatsApp inboxes?",
  ],
  metrics: [
    { name: "Order capture completion", target: "≥ 80% of extractions confirmed" },
    { name: "Time from chat to confirmed order", target: "< 90 seconds median" },
    { name: "Autonomous sends / auto-Paid", target: "0" },
  ],
  screens: ["Inbox", "Order review", "Order detail", "Follow-up queue", "Activity log"],
};

export function looksLikeKoraflow(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes("whatsapp") &&
    (t.includes("adunni") || t.includes("lagos") || t.includes("ankara") || t.includes("i have transferred"))
  );
}
