import {
  KORAFLOW_BRIEF,
  KORAFLOW_NAME,
  KORAFLOW_SPEC,
  KORAFLOW_THESES,
  KORAFLOW_WHY_B,
  looksLikeKoraflow,
} from "../data/sample";
import { generatePrototype, wantsPrototype, wantsUnsafeAutomation } from "./prototype";
import type {
  BriefItem,
  Conversation,
  FailureMode,
  Phase,
  Requirement,
  SpecDoc,
  ThesisId,
  ThesisOption,
} from "../types";

export type Turn = {
  reply: string;
  artifact?: Conversation["artifact"];
  patch: Partial<
    Pick<
      Conversation,
      | "phase"
      | "brief"
      | "theses"
      | "selectedThesis"
      | "thesisLocked"
      | "spec"
      | "artifact"
      | "title"
      | "productName"
      | "sources"
      | "prototype"
    >
  >;
};

const PAIN =
  /\b(drown|struggl|forget|miss(ed|ing)?|buried|chaos|hate|pain|lose|lost|hard to|don't want|do not want|can't|cannot|no way|wrong|messy|overwhelm|manual|scroll)/i;
const PEOPLE =
  /\b(merchant|founder|teacher|nurse|parent|student|owner|freelancer|clinic|gym|seller|shop|vendor|designer|coach|creator|patient|buyer|customer)s?\b/i;
const CONSTRAINT =
  /\b(must|should|never|don't|do not|mobile|whatsapp|offline|approve|human|manual)\b/i;

function sentences(text: string) {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[-•]\s*/, "").trim())
    .filter((s) => s.length > 18 && !/^[-—]/.test(s));
}

function clip(s: string, n = 220) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Channels and apps — never the product we are naming. */
const NOT_A_PRODUCT =
  /^(WhatsApp|Telegram|iMessage|Signal|Slack|Discord|Instagram|Facebook|Twitter|LinkedIn|YouTube|TikTok|Gmail|Excel|Google)$/i;

function namedProduct(text: string) {
  const explicit = text.match(/(?:called|named)\s+([A-Z][A-Za-z0-9]{2,})/);
  if (explicit?.[1] && !NOT_A_PRODUCT.test(explicit[1])) return explicit[1];
  const camels = [...text.matchAll(/\b([A-Z][a-z]+[A-Z][A-Za-z]+)\b/g)].map((m) => m[1]);
  return camels.find((n) => !NOT_A_PRODUCT.test(n)) ?? null;
}

function domainNoun(text: string) {
  const people = text.match(PEOPLE)?.[0];
  if (people) return people.replace(/s$/, "");
  if (/whatsapp/i.test(text)) return "merchant";
  if (/health|clinic|patient/i.test(text)) return "clinic";
  if (/school|student|teacher/i.test(text)) return "school";
  return "operator";
}

function coreObject(text: string) {
  if (/order/i.test(text)) return "order";
  if (/payment|transfer|invoice/i.test(text)) return "payment";
  if (/lead|inbound/i.test(text)) return "lead";
  if (/shift|roster|attendance/i.test(text)) return "attendance";
  if (/ticket|request/i.test(text)) return "request";
  if (/inventory|stock/i.test(text)) return "inventory";
  if (/note|memory|remember/i.test(text)) return "record";
  return "job";
}

export function inventName(text: string) {
  if (looksLikeKoraflow(text)) return KORAFLOW_NAME;
  const named = namedProduct(text);
  if (named) return named;
  if (/gym|attendance|trainer|class/i.test(text)) return "Rollcall";
  if (/whatsapp/i.test(text) && /(order|merchant|shop|seller|fashion)/i.test(text)) return "Tillbook";
  const obj = titleCase(coreObject(text));
  const who = titleCase(domainNoun(text));
  if (obj !== "Job") return `${who} ${obj}`.trim();
  return "Working title";
}

export function displayName(name: string | undefined, source = "") {
  const trimmed = name?.trim() ?? "";
  if (trimmed && !NOT_A_PRODUCT.test(trimmed)) return trimmed;
  if (!source.trim()) return trimmed;
  return inventName(source);
}

function pick<T>(arr: T[], n: number) {
  return arr.slice(0, n);
}

export function extractFromSource(text: string): {
  productName: string;
  brief: BriefItem[];
  theses: ThesisOption[];
  whyB: string;
} {
  if (looksLikeKoraflow(text)) {
    return {
      productName: KORAFLOW_NAME,
      brief: KORAFLOW_BRIEF.map((b) => ({ ...b })),
      theses: KORAFLOW_THESES.map((t) => ({ ...t })),
      whyB: KORAFLOW_WHY_B,
    };
  }

  const lines = sentences(text);
  const pain = lines.find((s) => PAIN.test(s)) ?? lines[0] ?? clip(text, 180);
  const who =
    lines.find((s) => PEOPLE.test(s)) ??
    `People who currently handle this with ${/whatsapp/i.test(text) ? "WhatsApp and memory" : "ad hoc tools and memory"}.`;
  const constraints = lines.filter((s) => CONSTRAINT.test(s));
  const object = coreObject(text);
  const whoNoun = domainNoun(text);
  const productName = inventName(text);
  const dontWant = lines.find((s) => /don't want|do not want|not another/i.test(s));

  const brief: BriefItem[] = [
    {
      id: "problem",
      label: "Problem",
      confidence: lines.some((s) => PAIN.test(s)) ? "high" : "medium",
      confirmed: false,
      assumption: false,
      body: clip(pain),
    },
    {
      id: "user",
      label: "Who it's for",
      confidence: PEOPLE.test(text) ? "high" : "needs-validation",
      confirmed: false,
      assumption: !PEOPLE.test(text),
      body: clip(who),
    },
    {
      id: "workaround",
      label: "Current workaround",
      confidence: "medium",
      confirmed: false,
      assumption: true,
      body: clip(
        lines.find((s) => /currently|right now|today|manual|spreadsheet|chat|whatsapp|notes/i.test(s)) ??
          "They reconstruct the truth by searching chats, notes, and memory.",
      ),
    },
    {
      id: "jtbd",
      label: "Job to be done",
      confidence: "medium",
      confirmed: false,
      assumption: false,
      body: `When ${object}s show up in the messy channel they already use, help the ${whoNoun} capture a trustworthy record so work does not depend on scrolling.`,
    },
    {
      id: "constraints",
      label: "Constraints",
      confidence: constraints.length ? "high" : "needs-validation",
      confirmed: false,
      assumption: constraints.length === 0,
      body: constraints.length
        ? clip(constraints.slice(0, 3).join(" "))
        : "Human approval before anything leaves the system. Correction must be easy. Do not invent a dashboard they did not ask for.",
    },
    {
      id: "evidence",
      label: "Evidence in the source",
      confidence: "medium",
      confirmed: false,
      assumption: false,
      body: clip(pick(lines, 2).join(" ")),
    },
    {
      id: "unknowns",
      label: "Still unknown",
      confidence: "needs-validation",
      confirmed: false,
      assumption: true,
      body: "Who is the first beachhead user? What must never be automated? What does “done” look like for version one?",
    },
  ];

  const shallow = dontWant
    ? clip(dontWant.replace(/don't want|do not want/i, "the tempting version is exactly").replace(/^the tempting/, "The tempting"))
    : `A ${object} assistant that makes the current channel faster.`;

  const theses: ThesisOption[] = [
    {
      id: "A",
      title: `${titleCase(object)} assistant`,
      description: `Helps the ${whoNoun} go faster in the channel they already use — drafts, reminders, automation.`,
      pros: ["Easy to explain", "Ships quickly", "Feels like magic in a demo"],
      risks: ["Shallow category", "Easy to copy", "Builds the workaround, not the system"],
      score: 61,
    },
    {
      id: "B",
      title: `${titleCase(whoNoun)} system of record`,
      description: `Turns messy ${object} activity into a structured record the ${whoNoun} can trust, correct, and act on.`,
      pros: ["Matches the actual pain", "Owns the workflow", "Harder to rip out later"],
      risks: ["More product discipline", "Trust collapses if the record is wrong"],
      score: 86,
      recommended: true,
    },
    {
      id: "C",
      title: `Lightweight ${titleCase(whoNoun)} CRM`,
      description: `Contacts, tags, and follow-up reminders around the same ${object}s.`,
      pros: ["Buyers recognize the category", "Known feature checklist"],
      risks: ["Crowded", "Easy to become a dashboard they said they did not want"],
      score: 70,
    },
  ];

  const whyB = `${productName || "This"} looks like a speed problem. The source reads more like a record problem: ${clip(pain, 140)} ${shallow ? `They also said they do not want the obvious product.` : ""} Option B is the category that would actually change the work.`;

  return { productName, brief, theses, whyB };
}

export function buildSpec(conv: Conversation): SpecDoc {
  if (looksLikeKoraflow(conv.sources.join("\n")) && conv.selectedThesis === "B") {
    return { ...KORAFLOW_SPEC, failureModes: KORAFLOW_SPEC.failureModes.map((f) => ({ ...f })) };
  }

  const thesis = conv.theses.find((t) => t.id === conv.selectedThesis);
  const problem = conv.brief.find((b) => b.id === "problem")?.body ?? "";
  const who = conv.brief.find((b) => b.id === "user")?.body ?? "the primary user";
  const job = conv.brief.find((b) => b.id === "jtbd")?.body ?? "";
  const constraints = conv.brief.find((b) => b.id === "constraints")?.body ?? "";
  const object = coreObject(conv.sources.join(" "));
  const name = displayName(conv.productName, conv.sources.join("\n"));

  const requirements: Requirement[] = [
    {
      id: "REQ-001",
      name: `Capture a ${object} from messy source material`,
      story: `As a user, I want a ${object} captured from the channel I already use so I do not rebuild it by hand.`,
      priority: "P0",
      source: "Extracted brief",
      criteria: [
        `Identify the ${object} and the fields that were actually said`,
        "Uncertain fields are marked",
        "Nothing is committed without a human confirm",
      ],
      screen: `${titleCase(object)} review`,
      risk: "high",
    },
    {
      id: "REQ-002",
      name: "Human approval before irreversible actions",
      story: "As a user, I want control over anything that leaves the system or changes a status others will trust.",
      priority: "P0",
      source: constraints || "Default Forge constraint",
      criteria: [
        "Drafts are the default",
        "Status changes that imply truth require an explicit verb",
        "Every automated action is attributable",
      ],
      screen: "Review",
      risk: "critical",
    },
    {
      id: "REQ-003",
      name: "Work queue for what still needs a human",
      story: job || "As a user, I want the next unfinished thing in one place.",
      priority: "P0",
      source: "Job to be done",
      criteria: ["Show why an item is in the queue", "Allow snooze, dismiss, or confirm", "Never silently complete work"],
      screen: "Queue",
      risk: "high",
    },
    {
      id: "REQ-004",
      name: "Correction stays in the record",
      story: "As a user, I want to fix the AI and see that the fix became the new truth.",
      priority: "P1",
      source: "Forge default — solo builders get this wrong",
      criteria: ["Any extracted field is editable", "Corrections are logged", "Later suggestions respect the correction"],
      screen: "Activity",
      risk: "medium",
    },
  ];

  const failureModes: FailureMode[] = [
    {
      id: "FM-001",
      title: `AI invents a ${object} field that was never said`,
      severity: "high",
      likelihood: "high",
      containment: "Quote the source. Mark gaps as unknown. Do not fill them to look complete.",
    },
    {
      id: "FM-002",
      title: "The product acts without approval",
      severity: "critical",
      likelihood: "medium",
      containment: "No send, no status-as-truth, no delete without an explicit human action.",
    },
    {
      id: "FM-003",
      title: "The record is wrong and the user still believes it",
      severity: "critical",
      likelihood: "medium",
      containment: "Confidence is visible. Correction is one tap. Never hide uncertainty behind a polished UI.",
    },
    {
      id: "FM-004",
      title: "It becomes the dashboard they said they did not want",
      severity: "medium",
      likelihood: "high",
      containment: `${clip(thesis?.risks[0] ?? "Stay inside the locked category.", 160)} Home is the work, not a report.`,
    },
  ];

  return {
    productName: name,
    thesis: `${name} is ${thesis?.title.toLowerCase() ?? "the locked category"}. ${thesis?.description ?? ""}`.trim(),
    overview: `${name} exists because ${clip(problem, 200)} It is for ${clip(who, 160)} Locked category: ${thesis?.title ?? "unset"}.`,
    requirements,
    failureModes,
    questions: [
      conv.brief.find((b) => b.id === "unknowns")?.body ?? "What is still assumed?",
      "What is the smallest version that still matches the locked category?",
      "What should the product refuse to automate in v1?",
    ],
    metrics: [
      { name: `${titleCase(object)} capture confirmed`, target: "Track from day one" },
      { name: "Correction rate", target: "Visible, not minimized" },
      { name: "Autonomous irreversible actions", target: "0" },
    ],
    screens: [`${titleCase(object)} review`, "Queue", "Record", "Activity"],
  };
}

export function specToMarkdown(spec: SpecDoc) {
  const req = spec.requirements
    .map(
      (r) =>
        `### ${r.id} ${r.name}\n${r.story}\nPriority: ${r.priority}\nAcceptance:\n${r.criteria.map((c) => `- ${c}`).join("\n")}`,
    )
    .join("\n\n");
  const fm = spec.failureModes
    .map((f) => `- **${f.title}** (${f.severity}): ${f.containment}`)
    .join("\n");
  return `# ${spec.productName} spec\n\n**Thesis.** ${spec.thesis}\n\n${spec.overview}\n\n## Requirements\n\n${req}\n\n## Failure modes\n\n${fm}\n\n## Open questions\n\n${spec.questions.map((q) => `- ${q}`).join("\n")}\n`;
}

function wantsLock(text: string) {
  return /\b(lock|commit|go with|choose|pick|that's the one|thats the one|option [abc]|use b|use a|use c)\b/i.test(text);
}

function wantsSpec(text: string) {
  return /\b(spec|requirements|write it|build packet|prompt|v0|lovable|cursor|replit)\b/i.test(text);
}

function wantsContinue(text: string) {
  return /\b(continue|next|looks (good|right)|that's (it|right)|thats (it|right)|confirm|yes|go on|position|category)\b/i.test(
    text,
  );
}

function wantsChallenge(text: string) {
  return /\b(why|challenge|disagree|not sure|wrong|why not a)\b/i.test(text);
}

function pickedOption(text: string): ThesisId | null {
  const m = text.match(/\boption\s*([abc])\b/i) || text.match(/\b([abc])\b/i);
  if (!m) return null;
  if (text.length > 80 && !/option/i.test(text)) return null;
  return m[1].toUpperCase() as ThesisId;
}

function isMoreSource(text: string) {
  return text.length > 140 || /\n/.test(text) || /whatsapp|transcript|customer said/i.test(text);
}

function briefReply(productName: string, whyShape: string): string {
  return `I pulled a working brief out of that. Customer language is separated from what I am inferring — assumptions are marked.\n\n**${productName}** is the working name. Nothing is locked yet.\n\n${whyShape}\n\nConfirm what looks true, mark what is an assumption, then we pick a product category. I will not write a spec until you lock that.`;
}

function positionReply(productName: string, whyB: string): string {
  return `This is the actual product decision — the one most solo builders skip.\n\nWhat category is **${productName}**?\n\nI am recommending **Option B**. ${whyB}\n\nYou can challenge it. You cannot skip it. Lock a category and I will write the spec, including how this can go wrong.`;
}

function specReply(spec: SpecDoc): string {
  return `Locked. I wrote the spec for **${spec.productName}** as *${spec.thesis.split(".")[0]}*.\n\nIt includes requirements and the failure modes — the part people leave out when they jump to v0.\n\nWhen you are ready, ask me to **build a prototype**. I will generate a clickable preview from this spec — Lovable-style, but it has to respect the category you locked.`;
}

function gateReply(): string {
  return `I can draft a spec, but not before you lock a product category. That gate is the product. Most builders skip it and build the wrong thing well.\n\nOpen the positioning artifact and lock A, B, or C — or tell me which option to lock.`;
}

export function laterReply(): string {
  return `Hosting this on Lovable, v0, or Cursor as a real repo is later — not faked.\n\nWhat I can do here is build a clickable prototype from the locked spec, in this browser. Ask me to build it.`;
}

function isMeta(text: string) {
  return /how (does|do) forge work|what is forge|explain the (loop|gate|category)|before i paste/i.test(text);
}

const LOOP_EXPLAIN =
  `Forge is a product copilot for people who skip from “I have an idea” to “let me prompt v0.”\n\nThe loop is short:\n1. You paste the messy source — notes, a transcript, a customer thread.\n2. I extract a brief: problem, who it’s for, constraints, what’s still an assumption.\n3. You lock a product category. That is the whole product. Assistant vs. system of record vs. CRM — one decision, before any spec.\n4. Then I write a spec that includes failure modes, not just happy-path requirements.\n5. Then I can build a clickable prototype from that spec. Unlike Lovable, it will not auto-send or auto-confirm just because you asked — the failure modes are in the UI.\n\nVoice, live models, research, and deploying to Lovable’s cloud are later. This demo runs a local engine.\n\nPaste something real when you’re ready.`;

export function applyTurn(conv: Conversation, userText: string): Turn {
  const text = userText.trim();
  const phase: Phase = conv.phase;

  if (phase === "idle" && isMeta(text)) {
    return { reply: LOOP_EXPLAIN, patch: { title: "How Forge works" } };
  }

  if (phase === "idle" || (phase === "brief" && isMoreSource(text) && !wantsContinue(text) && !wantsSpec(text))) {
    if (text.length < 40) {
      return {
        reply:
          "I need source material, not a prompt. Paste notes, a transcript, or a thread — the messy version of what you heard or wrote.",
        patch: {},
      };
    }
    const extracted = extractFromSource(text);
    const sources = [...conv.sources, text];
    return {
      reply: briefReply(extracted.productName, "I have not decided the category yet. Speed vs. system-of-record vs. CRM is next — after you check this brief."),
      artifact: "brief",
      patch: {
        phase: "brief",
        brief: extracted.brief,
        theses: extracted.theses,
        productName: extracted.productName,
        title: extracted.productName,
        sources,
        artifact: "brief",
        spec: null,
        thesisLocked: false,
      },
    };
  }

  if (phase === "brief") {
    if (wantsSpec(text) && !wantsContinue(text)) {
      return { reply: gateReply(), artifact: "brief", patch: { artifact: "brief" } };
    }
    const extractedWhy = extractFromSource(conv.sources.join("\n") || text).whyB;
    return {
      reply: positionReply(conv.productName || "this product", extractedWhy),
      artifact: "thesis",
      patch: { phase: "position", artifact: "thesis" },
    };
  }

  if (phase === "position") {
    const option = pickedOption(text);
    if (option) {
      const thesis = conv.theses.find((t) => t.id === option);
      if (wantsLock(text) || /lock|go with|choose|commit/i.test(text)) {
        const next = { ...conv, selectedThesis: option, thesisLocked: true };
        const spec = buildSpec(next);
        return {
          reply: specReply(spec),
          artifact: "spec",
          patch: {
            selectedThesis: option,
            thesisLocked: true,
            spec,
            phase: "spec",
            artifact: "spec",
          },
        };
      }
      return {
        reply: `Option ${option} — **${thesis?.title}**. ${thesis?.description}\n\nSay “lock option ${option}” if that is the category. I will not write the spec until it is locked.`,
        artifact: "thesis",
        patch: { selectedThesis: option, artifact: "thesis" },
      };
    }
    if (wantsChallenge(text)) {
      const why = extractFromSource(conv.sources.join("\n")).whyB;
      return {
        reply: `Challenge accepted.\n\nOption A is the product you would build if you optimized for a demo. Option C is the product you would build if you optimized for a pitch deck category.\n\n${why}\n\nIf the evidence actually supports A or C, lock that instead. I am not married to B. I am married to making you choose.`,
        artifact: "thesis",
        patch: { artifact: "thesis" },
      };
    }
    if (wantsLock(text) || wantsContinue(text)) {
      const next = { ...conv, thesisLocked: true };
      const spec = buildSpec(next);
      return {
        reply: specReply(spec),
        artifact: "spec",
        patch: {
          thesisLocked: true,
          spec,
          phase: "spec",
          artifact: "spec",
        },
      };
    }
    if (wantsSpec(text) || wantsPrototype(text)) {
      return { reply: gateReply(), artifact: "thesis", patch: { artifact: "thesis" } };
    }
    if (isMoreSource(text)) {
      const extracted = extractFromSource([...conv.sources, text].join("\n\n"));
      return {
        reply: `I folded that into the brief. Category is still unlocked.\n\n${positionReply(extracted.productName, extracted.whyB)}`,
        artifact: "thesis",
        patch: {
          brief: extracted.brief,
          theses: extracted.theses,
          productName: extracted.productName,
          title: extracted.productName,
          sources: [...conv.sources, text],
          artifact: "thesis",
        },
      };
    }
    return {
      reply: `Still waiting on the lock. ${gateReply()}`,
      artifact: "thesis",
      patch: { artifact: "thesis" },
    };
  }

  // spec / prototype
  if (wantsUnsafeAutomation(text)) {
    return {
      reply: `I will not. That failure mode is in the spec.\n\nThe prototype keeps irreversible actions as human verbs — confirm, mark paid, send. Lovable would often just do what you typed. Forge will not.\n\nIf you want to change the spec, say so. Then we rebuild.`,
      artifact: conv.prototype ? "prototype" : "spec",
      patch: { artifact: conv.prototype ? "prototype" : "spec" },
    };
  }

  if (wantsPrototype(text)) {
    if (!conv.thesisLocked || !conv.spec) {
      return { reply: gateReply(), artifact: "thesis", patch: { artifact: "thesis" } };
    }
    const prototype = generatePrototype(conv);
    return {
      reply: `Built a clickable prototype for **${conv.spec.productName}**.\n\n${prototype.summary}\n\nThis is the Lovable-shaped step, with the spec as a constraint. Open the preview. Try marking paid or sending a message — it should stop you.\n\nPublishing this to Lovable or v0 as a hosted app is later.`,
      artifact: "prototype",
      patch: {
        prototype,
        phase: "prototype",
        artifact: "prototype",
      },
    };
  }

  if (/export|deploy|publish|host/i.test(text) && /lovable|v0|cursor|replit/i.test(text)) {
    return {
      reply: laterReply(),
      artifact: conv.prototype ? "prototype" : "spec",
      patch: { artifact: conv.prototype ? "prototype" : "spec" },
    };
  }

  if (isMoreSource(text)) {
    const extracted = extractFromSource([...conv.sources, text].join("\n\n"));
    const next: Conversation = {
      ...conv,
      brief: extracted.brief,
      theses: extracted.theses,
      productName: extracted.productName,
      sources: [...conv.sources, text],
    };
    const spec = conv.thesisLocked ? buildSpec(next) : conv.spec;
    return {
      reply: conv.thesisLocked
        ? "I revised the spec from the new source. The locked category did not change — tell me if it should."
        : briefReply(extracted.productName, extracted.whyB),
      artifact: conv.thesisLocked ? "spec" : "brief",
      patch: {
        brief: extracted.brief,
        theses: extracted.theses,
        productName: extracted.productName,
        title: extracted.productName,
        sources: [...conv.sources, text],
        spec,
        artifact: conv.thesisLocked ? "spec" : "brief",
      },
    };
  }
  return {
    reply: conv.prototype
      ? `The prototype is in the artifact. Click through it. If you want a different category, we unlock and rebuild. Hosted export to Lovable / v0 is later.`
      : `The spec is in the artifact. Ask me to **build a prototype** when you want a clickable preview from it.`,
    artifact: conv.prototype ? "prototype" : "spec",
    patch: { artifact: conv.prototype ? "prototype" : "spec" },
  };
}

export function whyRecommended(conv: Conversation) {
  return extractFromSource(conv.sources.join("\n")).whyB;
}
