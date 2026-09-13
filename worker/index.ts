type AssetsBinding = { fetch(request: Request): Promise<Response> };

type Env = {
  GROQ_API_KEY: string;
  GROQ_MODEL?: string;
  ASSETS: AssetsBinding;
};

type TurnBody = {
  mode?: "chat" | "directions" | "lock-thesis" | "prototype" | "eval";
  message?: string;
  conversation?: Record<string, unknown>;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const briefItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    label: { type: "string" },
    body: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "needs-validation"] },
    confirmed: { type: "boolean" },
    assumption: { type: "boolean" },
    provenance: { type: "string", enum: ["evidence", "inference", "unknown"] },
  },
  required: ["id", "label", "body", "confidence", "confirmed", "assumption", "provenance"],
};

const questionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    question: { type: "string" },
    whyItMatters: { type: "string" },
    priority: { type: "string", enum: ["critical", "high", "medium"] },
    answered: { type: "boolean" },
    answer: { type: "string" },
  },
  required: ["id", "question", "whyItMatters", "priority", "answered", "answer"],
};

const evidenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    claim: { type: "string" },
    source: { type: "string" },
    strength: { type: "string", enum: ["strong", "moderate", "weak"] },
  },
  required: ["id", "claim", "source", "strength"],
};

const assumptionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    claim: { type: "string" },
    risk: { type: "string", enum: ["value", "usability", "feasibility", "viability"] },
    status: { type: "string", enum: ["untested", "supported", "invalidated"] },
  },
  required: ["id", "claim", "risk", "status"],
};

const decisionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    question: { type: "string" },
    status: { type: "string", enum: ["open", "decided"] },
    recommendation: { type: "string" },
    decision: { type: "string" },
    rationale: { type: "string" },
    affects: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
  required: ["id", "question", "status", "recommendation", "decision", "rationale", "affects"],
};

const validationTaskSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    assumptionId: { type: "string" },
    test: { type: "string" },
    successSignal: { type: "string" },
    status: { type: "string", enum: ["todo", "done"] },
  },
  required: ["id", "assumptionId", "test", "successSignal", "status"],
};

const productModelSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    primaryUser: { type: "string" },
    opportunity: { type: "string" },
    currentWorkaround: { type: "string" },
    desiredOutcome: { type: "string" },
    evidence: { type: "array", items: evidenceSchema, maxItems: 12 },
    assumptions: { type: "array", items: assumptionSchema, maxItems: 12 },
    decisions: { type: "array", items: decisionSchema, maxItems: 10 },
    validationTasks: { type: "array", items: validationTaskSchema, maxItems: 10 },
  },
  required: ["summary", "primaryUser", "opportunity", "currentWorkaround", "desiredOutcome", "evidence", "assumptions", "decisions", "validationTasks"],
};

const thesisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    pros: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
    risks: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
    score: { type: "integer", minimum: 0, maximum: 100 },
    recommended: { type: "boolean" },
    userAuthored: { type: "boolean" },
  },
  required: ["title", "description", "pros", "risks", "score", "recommended", "userAuthored"],
};

const requirementSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    story: { type: "string" },
    priority: { type: "string", enum: ["P0", "P1", "P2"] },
    source: { type: "string" },
    criteria: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    screen: { type: "string" },
    risk: { type: "string", enum: ["critical", "high", "medium", "low"] },
  },
  required: ["id", "name", "story", "priority", "source", "criteria", "screen", "risk"],
};

const failureModeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
    likelihood: { type: "string", enum: ["high", "medium", "low"] },
    containment: { type: "string" },
  },
  required: ["id", "title", "severity", "likelihood", "containment"],
};

const validationItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    risk: { type: "string", enum: ["value", "usability", "feasibility", "viability"] },
    assumption: { type: "string" },
    test: { type: "string" },
    successSignal: { type: "string" },
  },
  required: ["risk", "assumption", "test", "successSignal"],
};

const metricSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    target: { type: "string" },
  },
  required: ["name", "target"],
};

const specSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    productName: { type: "string" },
    thesis: { type: "string" },
    overview: { type: "string" },
    requirements: { type: "array", items: requirementSchema, minItems: 3, maxItems: 12 },
    failureModes: { type: "array", items: failureModeSchema, minItems: 2, maxItems: 8 },
    questions: { type: "array", items: { type: "string" }, maxItems: 8 },
    metrics: { type: "array", items: metricSchema, minItems: 1, maxItems: 6 },
    screens: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 10 },
    validationPlan: { type: "array", items: validationItemSchema, minItems: 2, maxItems: 8 },
  },
  required: ["productName", "thesis", "overview", "requirements", "failureModes", "questions", "metrics", "screens", "validationPlan"],
};

const evalCheckSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    requirementId: { type: "string" },
    label: { type: "string" },
    status: { type: "string", enum: ["pass", "partial", "fail"] },
    evidence: { type: "string" },
    issue: { type: "string" },
    recommendation: { type: "string" },
  },
  required: ["id", "requirementId", "label", "status", "evidence", "issue", "recommendation"],
};

const evalReportSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    checks: { type: "array", items: evalCheckSchema, minItems: 1, maxItems: 20 },
    passed: { type: "integer", minimum: 0 },
    partial: { type: "integer", minimum: 0 },
    failed: { type: "integer", minimum: 0 },
    ranAt: { type: "integer" },
  },
  required: ["summary", "checks", "passed", "partial", "failed", "ranAt"],
};

function structuredFormat(mode: string) {
  if (mode === "chat") {
    return {
      type: "json_schema",
      json_schema: {
        name: "forge_product_model_turn",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            phase: { type: "string", enum: ["interrogate"] },
            productName: { type: "string" },
            brief: { type: "array", items: briefItemSchema, minItems: 1, maxItems: 8 },
            productModel: productModelSchema,
            questions: { type: "array", items: questionSchema, maxItems: 8 },
            readyForDirections: { type: "boolean" },
          },
          required: ["reply", "phase", "productName", "brief", "productModel", "questions", "readyForDirections"],
        },
      },
    };
  }

  if (mode === "directions") {
    return {
      type: "json_schema",
      json_schema: {
        name: "forge_product_directions",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            phase: { type: "string", enum: ["position"] },
            productName: { type: "string" },
            brief: { type: "array", items: briefItemSchema, minItems: 1, maxItems: 8 },
            productModel: productModelSchema,
            questions: { type: "array", items: questionSchema, maxItems: 8 },
            readyForDirections: { type: "boolean" },
            theses: { type: "array", items: thesisSchema, minItems: 3, maxItems: 3 },
          },
          required: ["reply", "phase", "productName", "brief", "productModel", "questions", "readyForDirections", "theses"],
        },
      },
    };
  }

  if (mode === "lock-thesis") {
    return {
      type: "json_schema",
      json_schema: {
        name: "forge_product_spec",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            phase: { type: "string", enum: ["spec"] },
            productName: { type: "string" },
            brief: { type: "array", items: briefItemSchema, minItems: 1, maxItems: 8 },
            productModel: productModelSchema,
            questions: { type: "array", items: questionSchema, maxItems: 8 },
            theses: { type: "array", items: thesisSchema, minItems: 3, maxItems: 4 },
            readyForDirections: { type: "boolean" },
            spec: specSchema,
          },
          required: ["reply", "phase", "productName", "brief", "productModel", "questions", "theses", "readyForDirections", "spec"],
        },
      },
    };
  }

  if (mode === "eval") {
    return {
      type: "json_schema",
      json_schema: {
        name: "forge_eval_report",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            phase: { type: "string", enum: ["eval"] },
            evalReport: evalReportSchema,
          },
          required: ["reply", "phase", "evalReport"],
        },
      },
    };
  }

  return {
    type: "json_schema",
    json_schema: {
      name: "forge_prototype",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          reply: { type: "string" },
          phase: { type: "string", enum: ["prototype"] },
          prototype: {
            type: "object",
            additionalProperties: false,
            properties: {
              html: { type: "string" },
              summary: { type: "string" },
              builtAt: { type: "integer" },
            },
            required: ["html", "summary", "builtAt"],
          },
        },
        required: ["reply", "phase", "prototype"],
      },
    },
  };
}

function systemPrompt(mode: string) {
  const core = `You are Forge, an AI builder copilot. Your job is not to keep a conversation going. Your job is to maintain a durable product model that turns messy context into evidence-backed product decisions, requirements, prototypes, and evals.

The user should get more than they would from a generic chat. Every useful turn should improve the Product Model.

PRODUCT MODEL RULES
- Maintain a concise summary, primary user, dominant opportunity, current workaround, and desired outcome.
- Maintain evidence separately from assumptions. Evidence must name its source. Never invent customer evidence.
- Maintain open product decisions. Each decision should explain the recommendation, rationale, and downstream artifacts it affects.
- Maintain validation tasks for important assumptions that the user cannot answer directly. Unknown is a valid state; do not force the user to guess.
- Preserve decided items unless new evidence genuinely changes them.
- Treat the user's own experience as evidence about that user, not automatic proof of a broad market.

PRODUCT THINKING RULES
- Start from customer opportunity before solution.
- Decompose messy prompts into distinct opportunity branches before choosing a core problem.
- Prefer concrete behavior, incidents, workarounds, and outcomes over opinions.
- Account for switching cost, frequency, severity, and willingness to change.
- Reduce the uncertainty most likely to change the product direction. Consider value, usability, feasibility, and viability risk.
- Do not invent numeric thresholds, benchmarks, market facts, or false precision.
- Do not interrogate indefinitely. If the user cannot answer something, create a validation task and keep moving when possible.
- The user owns the decision. Recommend and critique; never silently decide for them.

READINESS FOR DIRECTIONS
Set readyForDirections=true when the product model has a specific user/context, a dominant opportunity, at least one concrete supporting behavior/pattern, an understood workaround, meaningful stakes/outcome, and no unresolved fork likely to produce a fundamentally different product category.

COPILOT RESPONSE STYLE
- Be concise, specific, and decision-oriented. Usually 45-100 words.
- Do not prefix every reply with 'Insight:' or 'Question:'. Write naturally.
- Answer direct questions directly.
- When the user asks 'what next?', tell them the exact unresolved product decision and the most useful action.
- Ask at most one question, only when the answer would materially change the product model.
- If the user likely cannot know the answer, propose a validation task instead of another interrogation.
- Never praise filler or explain product-management theory unless asked.`;

  if (mode === "directions") {
    return `${core}\n\nThe user explicitly moved to Decide. Generate exactly three materially different product directions anchored to the dominant opportunity. They must differ in product mechanism or workflow, not just feature scope. Compare why each could win, switching cost, and the largest unresolved risk. Recommend exactly one based on the evidence. Add or update an open decision in the Product Model for the product-direction choice.`;
  }

  if (mode === "lock-thesis") {
    return `${core}\n\nThe user chose a direction. Update the Product Model so the product-direction decision is marked decided with the chosen direction and rationale. Generate a focused V1 spec. Every P0 requirement must trace back to the chosen direction, an evidence-backed problem, or an explicit assumption. Include acceptance criteria, failure modes, success measures, unresolved questions, and a validation plan. Do not disguise assumptions as requirements.`;
  }

  if (mode === "prototype") {
    return `${core}\n\nGenerate a self-contained clickable HTML prototype from the locked spec. Prototype the riskiest core workflow, not a generic dashboard. Use actual domain language and realistic states. The prototype should be usable enough for an eval to inspect whether the requirements are represented. Use inline CSS and JS only.`;
  }

  if (mode === "eval") {
    return `${core}\n\nEvaluate the current prototype against the locked spec and its P0 requirements. Inspect the supplied prototype HTML and spec. For each relevant requirement, mark pass, partial, or fail based only on observable evidence in the prototype. A visually present element is not automatically a passed workflow. Explain the evidence, the gap, and a concrete recommendation. Count statuses accurately. This is an implementation-conformance eval, not proof of customer value.`;
  }

  return `${core}\n\nFor this turn, update the Product Model from the user's latest input. If multiple opportunity branches remain, preserve them as open decisions or assumptions instead of prematurely collapsing them. Only ask a question when it changes the model; otherwise explain what changed and the next useful action.`;
}

async function callGroq(env: Env, mode: string, body: TurnBody) {
  const context = body.conversation ?? {};
  const userMessage = typeof body.message === "string" ? body.message.trim() : "";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || "openai/gpt-oss-120b",
      temperature: 0.1,
      reasoning_effort: mode === "prototype" ? "medium" : "high",
      messages: [
        { role: "system", content: systemPrompt(mode) },
        {
          role: "user",
          content: `CURRENT FORGE CONTEXT:\n${JSON.stringify(context)}\n\nUSER MESSAGE:\n${userMessage || "Proceed based on the explicit user action."}`,
        },
      ],
      response_format: structuredFormat(mode),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Groq turn failed", response.status, response.headers.get("x-request-id"), detail.slice(0, 300));
    return {
      error: response.status === 429
        ? "Forge is temporarily at its model rate limit. Your work is saved; wait a moment and retry."
        : "Forge could not complete this reasoning turn.",
    };
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string; refusal?: string | null } }> };
  const message = payload.choices?.[0]?.message;
  if (message?.refusal) return { error: "Forge could not respond to that request." };
  if (!message?.content) return { error: "Forge received an empty model response." };

  try {
    return JSON.parse(message.content) as Record<string, unknown>;
  } catch {
    return { error: "Forge received an invalid structured response." };
  }
}

async function handleTurn(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!env.GROQ_API_KEY) return json({ error: "Forge AI is not configured yet." }, 503);

  const body = (await request.json().catch(() => null)) as TurnBody | null;
  if (!body || !body.conversation || typeof body.conversation !== "object") {
    return json({ error: "Conversation context is required." }, 400);
  }

  const mode = body.mode === "directions" || body.mode === "lock-thesis" || body.mode === "prototype" || body.mode === "eval"
    ? body.mode
    : "chat";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (mode === "chat" && !message) return json({ error: "Message is required." }, 400);
  if (message.length > 30000) return json({ error: "This message is too large for one reasoning turn." }, 413);

  const result = await callGroq(env, mode, body);
  if (typeof result.error === "string") {
    const status = result.error.includes("rate limit") ? 429 : 502;
    return json({ error: result.error }, status);
  }

  if (mode === "prototype" && result.prototype && typeof result.prototype === "object") {
    (result.prototype as Record<string, unknown>).builtAt = Date.now();
  }
  if (mode === "eval" && result.evalReport && typeof result.evalReport === "object") {
    (result.evalReport as Record<string, unknown>).ranAt = Date.now();
  }

  return json(result);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/forge/turn") return handleTurn(request, env);
    return env.ASSETS.fetch(request);
  },
};
