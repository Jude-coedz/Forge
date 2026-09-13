type AssetsBinding = { fetch(request: Request): Promise<Response> };

type Env = {
  GROQ_API_KEY: string;
  GROQ_MODEL?: string;
  ASSETS: AssetsBinding;
};

type TurnBody = {
  mode?: "chat" | "directions" | "lock-thesis" | "prototype";
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

function structuredFormat(mode: string) {
  if (mode === "chat") {
    return {
      type: "json_schema",
      json_schema: {
        name: "forge_validation_turn",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            phase: { type: "string", enum: ["interrogate"] },
            productName: { type: "string" },
            brief: { type: "array", items: briefItemSchema, minItems: 1, maxItems: 8 },
            questions: { type: "array", items: questionSchema, maxItems: 8 },
            readyForDirections: { type: "boolean" },
          },
          required: ["reply", "phase", "productName", "brief", "questions", "readyForDirections"],
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
            questions: { type: "array", items: questionSchema, maxItems: 8 },
            readyForDirections: { type: "boolean" },
            theses: { type: "array", items: thesisSchema, minItems: 3, maxItems: 3 },
          },
          required: ["reply", "phase", "productName", "brief", "questions", "readyForDirections", "theses"],
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
            questions: { type: "array", items: questionSchema, maxItems: 8 },
            theses: { type: "array", items: thesisSchema, minItems: 3, maxItems: 4 },
            readyForDirections: { type: "boolean" },
            spec: specSchema,
          },
          required: ["reply", "phase", "productName", "brief", "questions", "theses", "readyForDirections", "spec"],
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
  const core = `You are Forge, an AI builder copilot for turning messy product ideas into decision-backed product definitions and testable prototypes. You are not a generic chatbot, a motivational coach, or an idea generator that rushes to solutions.

Your job is to improve the builder's product judgment and preserve the reasoning that leads to the product.

PRODUCT THINKING RULES
- Start from the customer problem or opportunity before choosing a solution.
- Decompose a messy prompt into distinct opportunity branches before declaring a single 'core problem'. If the user mentions several breakdowns, do not arbitrarily pick one. Ask a discriminating question that helps prioritize them.
- Prefer concrete behavior, observed incidents, workarounds, and outcomes over opinions.
- Separate evidence, inference, and unknowns. Never manufacture customer evidence.
- Treat the user's own experience as evidence about that user, not automatic proof of a broad market.
- Account for the current workaround, switching cost, frequency, severity, and willingness to change.
- Reduce the uncertainty most likely to change what product should be built. Consider value, usability, feasibility, and viability risk.
- Do not invent numeric thresholds, benchmarks, market facts, or false precision.
- Do not interrogate indefinitely. Once another answer is unlikely to change the product category or primary workflow, stop asking and set readyForDirections=true.
- The user owns the decision. You recommend, critique, and expose tradeoffs; you do not silently choose for them.

DECISION READINESS
Set readyForDirections=true only when all of these are sufficiently clear:
1. A specific primary user or context is known.
2. The dominant opportunity/problem is clear enough that competing pain branches are no longer unresolved.
3. At least one concrete behavior, incident, or repeated pattern supports the problem.
4. The current workaround or alternative is understood.
5. The stakes or desired outcome are understood well enough to judge why behavior might change.
6. No unresolved question is likely to produce a fundamentally different product direction.

NORMAL CHAT
- Read the supplied conversation before answering. Never ask for information already present.
- Treat short replies as answers to the latest relevant question when they fit.
- If the user asks 'what next?', state the current unresolved product decision and ask the exact question needed to move it forward.
- Keep replies compact and complete: usually 45-90 words.
- Never truncate a sentence.
- Use at most one short insight plus one high-leverage question.
- When several opportunity branches exist, name them briefly before asking which one dominates.
- Briefly state why the question changes the product decision. Do not lecture.
- If enough is known, say so plainly and set readyForDirections=true instead of inventing another question.

The evolving Product Brief should capture: primary user/context, dominant problem/opportunity, current behavior/workaround, stakes/outcome, direct evidence, assumptions, constraints, and important unresolved decisions.`;

  if (mode === "directions") {
    return `${core}\n\nThe user explicitly moved to Decide. Generate exactly three materially different product directions anchored to the dominant opportunity, not three feature bundles. Each direction should use a meaningfully different product mechanism or workflow. Compare who it serves, when it is used, why it could win, switching cost, and the largest unresolved risk. Recommend exactly one based only on the evidence. Scores are relative decision confidence, not market probabilities.`;
  }

  if (mode === "lock-thesis") {
    return `${core}\n\nThe user explicitly chose a direction. Generate a decision-backed V1 spec. The spec must trace requirements back to the problem frame and chosen direction. Keep V1 focused. Include acceptance criteria, failure modes, success measures, unresolved questions, and a validation plan across the most relevant value/usability/feasibility/viability risks. If evidence is weak, turn it into a validation item rather than presenting it as fact.`;
  }

  if (mode === "prototype") {
    return `${core}\n\nGenerate a self-contained clickable HTML prototype from the locked spec. Prototype the riskiest core workflow, not a generic dashboard. Use the actual domain language and include realistic empty, loading, validation, error, confirmation, and recovery states where relevant. The prototype should test product logic, not merely look polished. Use inline CSS and JS only.`;
  }

  return `${core}\n\nFor this validation turn, update the Product Brief and question history from the user's latest evidence. Preserve previously answered questions. Ask no more than one new high-leverage question. If the prompt contains multiple plausible product problems, keep them separate until the user's evidence distinguishes them.`;
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
      temperature: 0.12,
      reasoning_effort: mode === "chat" || mode === "prototype" ? "medium" : "high",
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
    return { error: response.status === 429 ? "Forge is briefly rate-limited. Try again in a moment." : "Forge could not complete this reasoning turn." };
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

  const mode = body.mode === "directions" || body.mode === "lock-thesis" || body.mode === "prototype" ? body.mode : "chat";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (mode === "chat" && !message) return json({ error: "Message is required." }, 400);
  if (message.length > 30000) return json({ error: "This message is too large for one reasoning turn." }, 413);

  const result = await callGroq(env, mode, body);
  if (typeof result.error === "string") return json({ error: result.error }, 502);

  if (mode === "prototype" && result.prototype && typeof result.prototype === "object") {
    const prototype = result.prototype as Record<string, unknown>;
    prototype.builtAt = Date.now();
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
