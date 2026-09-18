type AssetsBinding = { fetch(request: Request): Promise<Response> };

type Env = {
  GROQ_API_KEY: string;
  GROQ_MODEL?: string;
  ASSETS: AssetsBinding;
};

type TurnMode = "chat" | "directions" | "lock-thesis";

type TurnBody = {
  mode?: TurnMode;
  message?: string;
  conversation?: Record<string, unknown>;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

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
    evidence: { type: "array", items: evidenceSchema, maxItems: 10 },
    assumptions: { type: "array", items: assumptionSchema, maxItems: 10 },
    decisions: { type: "array", items: decisionSchema, maxItems: 8 },
    validationTasks: { type: "array", items: validationTaskSchema, maxItems: 8 },
  },
  required: [
    "summary",
    "primaryUser",
    "opportunity",
    "currentWorkaround",
    "desiredOutcome",
    "evidence",
    "assumptions",
    "decisions",
    "validationTasks",
  ],
};

const thesisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    pros: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    risks: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    recommended: { type: "boolean" },
  },
  required: ["title", "description", "pros", "risks", "recommended"],
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
    criteria: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    risk: { type: "string", enum: ["critical", "high", "medium", "low"] },
  },
  required: ["id", "name", "story", "priority", "source", "criteria", "risk"],
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
    nonGoals: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
    requirements: { type: "array", items: requirementSchema, minItems: 3, maxItems: 8 },
    failureModes: { type: "array", items: failureModeSchema, minItems: 1, maxItems: 6 },
    questions: { type: "array", items: { type: "string" }, maxItems: 6 },
    metrics: { type: "array", items: metricSchema, minItems: 1, maxItems: 5 },
    validationPlan: { type: "array", items: validationItemSchema, minItems: 1, maxItems: 6 },
  },
  required: [
    "productName",
    "thesis",
    "overview",
    "nonGoals",
    "requirements",
    "failureModes",
    "questions",
    "metrics",
    "validationPlan",
  ],
};

function structuredFormat(mode: TurnMode) {
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
            productName: { type: "string" },
            productModel: productModelSchema,
            theses: { type: "array", items: thesisSchema, minItems: 3, maxItems: 3 },
          },
          required: ["reply", "productName", "productModel", "theses"],
        },
      },
    };
  }

  if (mode === "lock-thesis") {
    return {
      type: "json_schema",
      json_schema: {
        name: "forge_build_brief",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            productName: { type: "string" },
            productModel: productModelSchema,
            theses: { type: "array", items: thesisSchema, minItems: 3, maxItems: 4 },
            spec: specSchema,
          },
          required: ["reply", "productName", "productModel", "theses", "spec"],
        },
      },
    };
  }

  return {
    type: "json_schema",
    json_schema: {
      name: "forge_product_frame",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          reply: { type: "string" },
          productName: { type: "string" },
          productModel: productModelSchema,
        },
        required: ["reply", "productName", "productModel"],
      },
    },
  };
}

function systemPrompt(mode: TurnMode) {
  const core = `You are Forge, a guided pre-build product copilot.

Forge has one job: help someone turn a messy idea into a defensible product direction and a build-ready brief before they start building.

The visible workflow is Frame -> Challenge -> Decide -> Build Brief -> Handoff. The Product Model is internal memory. Do not make the user manage the model or learn a product-management framework.

PRODUCT THINKING
- Start from the customer problem or opportunity, not the proposed solution.
- Separate evidence from assumptions. Never invent customer evidence, market facts, frequency, willingness to pay, or numeric certainty.
- A user's personal experience is evidence about that experience, not automatic proof of a market.
- Preserve important unknowns as assumptions or validation work instead of repeatedly asking the user to guess.
- Surface only decisions that could materially change the product.
- Consider value, usability, feasibility, viability, switching cost, current workaround, and desired outcome when relevant.
- Recommend clearly, but the user owns the decision.
- If the evidence is weak, say what is weak without blocking progress unnecessarily.
- Do not turn every idea into a SaaS dashboard, AI assistant, CRM, marketplace, or automation tool by default.

INTERNAL PRODUCT MODEL
Keep a concise summary, primary user, opportunity, current workaround, desired outcome, evidence, assumptions, open/decided decisions, and validation tasks.
Preserve useful existing state unless new user input changes it.
When the user corrects Forge, update dependent reasoning rather than defending the old interpretation.

RESPONSE STYLE
- Be concise, specific, and decision-oriented.
- Do not prefix replies with 'Insight:' or 'Question:'.
- Do not praise the idea.
- Do not teach PM theory unless asked.
- Ask at most one question, and only when the answer would materially change the frame or product direction.
- If the user likely cannot know the answer, preserve it as an assumption or validation task instead of asking.
- Prefer a useful conclusion or recommendation over another question.`;

  if (mode === "directions") {
    return `${core}

The user has explicitly chosen to compare product directions. Do not block this step because some assumptions remain unresolved. Preserve those unknowns and account for them in the risks.

Generate exactly three materially different product directions. They must differ in product mechanism or workflow, not merely feature scope. For each, explain the product in plain language, why it could win, and its biggest risks. Recommend exactly one based on the current evidence. Mark exactly one option recommended=true. Update the Product Model with the direction decision still open until the user chooses.`;
  }

  if (mode === "lock-thesis") {
    return `${core}

The user has chosen a product direction. Mark the direction decision as decided and generate a concise Build Brief, not a giant PRD.

The Build Brief must:
- make the chosen direction unmistakable;
- describe a focused V1;
- include 3-8 requirements, prioritizing a small P0 set;
- trace each requirement to evidence, the chosen direction, or an explicit assumption;
- include 2-5 explicit non-goals so scope is clear;
- include only the most important failure modes;
- include practical validation work for assumptions that are still unproven;
- include success signals without inventing unsupported numeric benchmarks;
- preserve unresolved questions honestly.

The result should be useful to hand directly to a coding or prototyping tool.`;
  }

  return `${core}

For this turn, update the Product Model from the user's latest input. On the first idea, do useful synthesis before asking anything: infer a working user, opportunity, current workaround, and desired outcome where the input supports them, and label uncertainty as assumptions.

If multiple plausible problems remain, preserve that ambiguity as an open decision instead of prematurely declaring one 'the core problem'. The reply should briefly say what Forge now thinks and what matters next.`;
}

async function callGroq(env: Env, mode: TurnMode, body: TurnBody) {
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
      reasoning_effort: mode === "chat" ? "medium" : "high",
      messages: [
        { role: "system", content: systemPrompt(mode) },
        {
          role: "user",
          content: `CURRENT FORGE CONTEXT:\n${JSON.stringify(context)}\n\nUSER INPUT:\n${userMessage || "Proceed based on the explicit user action."}`,
        },
      ],
      response_format: structuredFormat(mode),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Groq turn failed", response.status, response.headers.get("x-request-id"), detail.slice(0, 400));
    return {
      error: response.status === 429
        ? "Forge is busy right now. Your work is saved. Retry in a moment."
        : "Forge could not complete this reasoning step. Your work is saved.",
    };
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; refusal?: string | null } }>;
  };
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
    return json({ error: "Project context is required." }, 400);
  }

  const mode: TurnMode = body.mode === "directions" || body.mode === "lock-thesis" ? body.mode : "chat";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (mode === "chat" && !message) return json({ error: "Message is required." }, 400);
  if (message.length > 30000) return json({ error: "This input is too large for one reasoning step." }, 413);

  const result = await callGroq(env, mode, body);
  if (typeof result.error === "string") {
    const status = result.error.includes("busy") ? 429 : 502;
    return json({ error: result.error }, status);
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
