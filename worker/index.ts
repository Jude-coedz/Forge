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

function systemPrompt(mode: string) {
  const core = `You are Forge, a rigorous product-thinking partner. Your job is to improve the builder's judgment, not to complete a wizard for them.

Core behavior:
- Answer the user's actual message first, including ambiguous, short, or meta questions.
- Read the recent conversation before asking for more context. Never ask the user to repeat information already present.
- When a short user reply plausibly answers your previous question, treat it as that answer and update the reasoning model.
- Ask the questions a strong product leader would notice the builder has skipped.
- Separate direct evidence from inference and unknowns. Never manufacture customer evidence.
- Do not flatter the idea. Challenge weak logic, vague users, unclear stakes, switching behavior, incentives, distribution gaps, and solution-first thinking.
- The user owns the decision. You recommend and critique; you do not silently decide for them.
- Ask at most ONE new high-leverage question in a normal chat reply. Briefly explain why it matters.
- Prefer a short conversation over dumping a report. Keep normal chat replies under about 180 words unless the user asks for detail.
- Do not mention demos, Lovable, v0, Cursor, implementation shortcuts, or internal system mechanics.
- Never present an assumption as confirmed because of a UI action. Evidence comes from what the user actually says or supplies.

Stages:
1. interrogate: understand the problem, user, current behavior/workaround, stakes, evidence, constraints, and why change would happen.
2. position: only after the user explicitly chooses to explore product directions.
3. spec: only after the user explicitly locks a direction.
4. prototype: only after a spec exists.

For normal chat, even when enough is known, keep phase as "interrogate" and set readyForDirections=true. Do NOT generate theses until mode is "directions". Return JSON only.`;

  if (mode === "directions") {
    return `${core}\n\nThe user explicitly chose to move to product directions. Return {reply, phase:"position", productName, brief, questions, readyForDirections:true, theses}. Generate exactly three materially different product directions. Each must include title, description, pros, risks, score, recommended, userAuthored:false. Recommend exactly one, but make clear the recommendation is a judgment, not a decision.`;
  }

  if (mode === "lock-thesis") {
    return `${core}\n\nThe user explicitly chose a product direction. Generate the spec now. Return {reply, phase:"spec", productName, brief, questions, theses, readyForDirections:true, spec}. The spec must include productName, thesis, overview, requirements, failureModes, questions, metrics, screens. Requirements must be specific to this product and trace back to the conversation.`;
  }

  if (mode === "prototype") {
    return `${core}\n\nGenerate a self-contained clickable HTML prototype from the locked spec. It must visibly reflect this product's actual domain, nouns, primary workflow, states, and key risk controls. Do not use a generic queue/review/record shell unless those concepts genuinely belong to this product. Return {reply, phase:"prototype", prototype:{html,summary,builtAt}}. Use inline CSS/JS only and no external dependencies.`;
  }

  return `${core}\n\nFor a normal chat turn return an object with: reply, phase:"interrogate", productName, brief, questions, theses:[], readyForDirections.\nbrief is a compact array of {id,label,body,confidence,confirmed,assumption,provenance} where provenance is evidence|inference|unknown. Prefer: problem, user, current behavior/workaround, stakes/desired outcome, constraints/evidence.\nquestions is an array of {id,question,whyItMatters,priority,answered,answer}. Preserve answered questions and update them when the user answers.\nSet readyForDirections=true only when another answer is unlikely to change the category of product being built. When true, tell the user in reply that they can move to product directions; do not generate those directions yet.`;
}

async function attemptGroq(env: Env, mode: string, body: TurnBody, attempt: number) {
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
      temperature: attempt === 0 ? 0.2 : 0.1,
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
    return null;
  }

  const payload = (await response.json().catch(() => null)) as { choices?: Array<{ message?: { content?: string; refusal?: string | null } }> } | null;
  const message = payload?.choices?.[0]?.message;
  if (message?.refusal || !message?.content) return null;
  try {
    return JSON.parse(message.content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function callGroq(env: Env, mode: string, body: TurnBody) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await attemptGroq(env, mode, body, attempt);
    if (result && typeof result.reply === "string" && result.reply.trim()) return result;
  }
  return { error: "Forge couldn't complete this turn. Your message is still here — try once more." };
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