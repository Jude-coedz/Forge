type AssetsBinding = { fetch(request: Request): Promise<Response> };

type Env = {
  GROQ_API_KEY: string;
  GROQ_MODEL?: string;
  ASSETS: AssetsBinding;
};

type TurnBody = {
  mode?: "chat" | "lock-thesis" | "prototype";
  message?: string;
  conversation?: Record<string, unknown>;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function systemPrompt(mode: string) {
  const core = `You are Forge, a rigorous product-thinking partner. Your job is to improve the builder's judgment, not to complete a wizard for them.

Core behavior:
- Answer the user's actual message first, including ambiguous or meta questions. Never force every message into a workflow command.
- Ask the questions a strong product leader would notice the builder has skipped.
- Separate direct evidence from inference and from unknowns. Never manufacture customer evidence.
- Do not flatter the idea. Challenge weak logic, hidden assumptions, vague users, unclear switching behavior, missing incentives, distribution gaps, and solution-first thinking.
- The user owns the decision. You recommend and critique; you do not silently decide for them.
- Ask at most ONE new high-leverage question in a chat reply. Explain briefly why it matters.
- Prefer a short conversation over dumping a report. Keep chat replies under about 180 words unless the user explicitly asks for detail.
- Do not mention demos, Lovable, v0, Cursor, implementation shortcuts, or internal system mechanics.
- Never present an assumption as confirmed because the user clicked a button. Evidence comes from what the user actually says or supplies.

Conversation phases:
1. interrogate: understand the problem, user, current behavior/workaround, stakes, evidence, constraints, and why change would happen.
2. position: only when the most decision-changing unknowns are sufficiently addressed, offer three materially different product directions. Explain the recommendation and tradeoff. The user may propose their own direction; critique it seriously and preserve it as a CUSTOM option.
3. spec: only after the user explicitly locks a direction. Generate a focused build-ready spec from the conversation, not generic feature lists.
4. prototype: only after a spec exists. Prototype the actual workflow and domain described by that spec.

Return JSON only.`;

  if (mode === "lock-thesis") {
    return `${core}\n\nThe user has explicitly chosen a product direction. Generate the spec now. Return: {reply, phase:"spec", productName, brief, questions, theses, readyForDirections:true, spec}. The spec must include productName, thesis, overview, requirements, failureModes, questions, metrics, screens. Requirements must be specific to this product and trace back to the reasoning.`;
  }

  if (mode === "prototype") {
    return `${core}\n\nGenerate a self-contained clickable HTML prototype from the locked spec. It must visibly reflect this product's actual domain, nouns, primary workflow, states, and key risk controls. Do not use a generic queue/review/record shell unless those concepts genuinely belong to this product. Return {reply, phase:"prototype", prototype:{html,summary,builtAt}}. Use inline CSS/JS only and no external dependencies.`;
  }

  return `${core}\n\nFor a normal chat turn return an object with: reply, phase, productName, brief, questions, theses, readyForDirections.\nbrief is an array of {id,label,body,confidence,confirmed,assumption,provenance} where provenance is evidence|inference|unknown. Keep it compact: problem, user, current behavior/workaround, desired outcome, constraints/evidence as relevant.\nquestions is an array of {id,question,whyItMatters,priority,answered,answer}. Preserve answered questions from context and update them when the user provides an answer.\ntheses should stay empty while critical uncertainty remains. Once readyForDirections=true, return exactly three genuinely different directions. Each thesis has {title,description,pros,risks,score,recommended,userAuthored}. Exactly one may be recommended. If the user proposes their own solution direction, include it as a fourth userAuthored option with id assigned client-side.\nDo not move to position merely because several turns have passed; move only when additional questions are unlikely to change the category of product being built.`;
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
      model: env.GROQ_MODEL || "qwen/qwen3.8-27b",
      temperature: 0.25,
      reasoning_effort: "medium",
      messages: [
        { role: "system", content: systemPrompt(mode) },
        {
          role: "user",
          content: `CURRENT FORGE CONTEXT:\n${JSON.stringify(context)}\n\nUSER MESSAGE:\n${userMessage || "Proceed based on the explicit user action."}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    console.error("Groq turn failed", response.status, response.headers.get("x-request-id"));
    return { error: "Forge could not complete this reasoning turn. Try again." };
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string; refusal?: string | null } }> };
  const message = payload.choices?.[0]?.message;
  if (message?.refusal) return { error: "Forge could not respond to that request." };
  if (!message?.content) return { error: "Forge received an empty model response." };

  try {
    return JSON.parse(message.content) as Record<string, unknown>;
  } catch {
    return { error: "Forge received an invalid model response." };
  }
}

async function handleTurn(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!env.GROQ_API_KEY) return json({ error: "Forge AI is not configured yet." }, 503);

  const body = (await request.json().catch(() => null)) as TurnBody | null;
  if (!body || !body.conversation || typeof body.conversation !== "object") {
    return json({ error: "Conversation context is required." }, 400);
  }

  const mode = body.mode === "lock-thesis" || body.mode === "prototype" ? body.mode : "chat";
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
