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
            brief: { type: "array", items: briefItemSchema, minItems: 1, maxItems: 7 },
            questions: { type: "array", items: questionSchema, maxItems: 6 },
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
            brief: { type: "array", items: briefItemSchema, minItems: 1, maxItems: 7 },
            questions: { type: "array", items: questionSchema, maxItems: 6 },
            readyForDirections: { type: "boolean" },
            theses: { type: "array", items: thesisSchema, minItems: 3, maxItems: 3 },
          },
          required: ["reply", "phase", "productName", "brief", "questions", "readyForDirections", "theses"],
        },
      },
    };
  }

  return { type: "json_object" };
}

function systemPrompt(mode: string) {
  const core = `You are Forge, a product-definition system for solo builders. You are not a general chatbot and you are not a motivational coach.

Forge's job is to turn a messy idea into a decision-backed product definition and then into something testable.

Use these product principles:
- Start from the customer problem/opportunity before choosing a solution.
- Prefer observed behavior and concrete incidents over opinions or invented evidence.
- Separate evidence, inference, and unknowns.
- Reduce the riskiest uncertainty first. Consider value, usability, feasibility, and business viability.
- Account for the user's existing workaround and switching cost.
- Do not interrogate indefinitely. Ask only questions that could materially change the problem frame, product direction, or risk profile.
- Never dismiss a recurring time/workflow cost simply because it is not catastrophic. Frequency, friction, and willingness to change matter.
- Do not invent arbitrary thresholds such as '4 times per month means X'. If no evidence supports a threshold, say so.
- The user owns the decision. Forge makes recommendations, shows tradeoffs, and lets the user override them.

Normal chat behavior:
- Read the full supplied context before responding.
- Treat short replies as answers to the latest relevant question when they fit.
- Do not ask for information already present.
- Reply in 70 words or fewer.
- Give at most one useful product insight and one next question.
- No long preambles, lectures, praise, filler, or fake certainty.
- If enough is known, stop questioning and set readyForDirections=true.

The validation brief should converge on: the user, concrete problem, current behavior/workaround, stakes/outcome, evidence, assumptions, and key constraints.`;

  if (mode === "directions") {
    return `${core}\n\nThe user explicitly moved to Decide. Generate exactly three materially different product directions. Compare the problem each direction solves, why it could win, switching cost, and the most important risk. Recommend exactly one based on the evidence, but do not choose for the user.`;
  }

  if (mode === "lock-thesis") {
    return `${core}\n\nThe user explicitly chose a direction. Generate a decision-backed V1 spec. Return JSON with reply, phase:'spec', productName, brief, questions, theses, readyForDirections:true, and spec. The spec must contain productName, thesis, overview, requirements, failureModes, questions, metrics, screens. Requirements must be specific, traceable to the conversation, and distinguish validated facts from assumptions. Include validation needs where evidence is weak.`;
  }

  if (mode === "prototype") {
    return `${core}\n\nGenerate a self-contained clickable HTML prototype from the locked spec. Prototype the riskiest core workflow, not a generic dashboard. Use the actual domain language, states, constraints, and failure controls. Return JSON with reply, phase:'prototype', prototype:{html,summary,builtAt}. Use inline CSS and JS only.`;
  }

  return `${core}\n\nFor this validation turn, update the brief and question list from the user's latest evidence. Keep answered questions answered. Ask no more than one new high-leverage question in reply. readyForDirections becomes true when the product category can be compared without another answer materially changing the problem frame.`;
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
      temperature: 0.15,
      reasoning_effort: mode === "prototype" ? "medium" : "low",
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