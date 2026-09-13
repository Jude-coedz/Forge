type AssetsBinding = { fetch(request: Request): Promise<Response> };

type Env = {
  GROQ_API_KEY: string;
  GROQ_MODEL?: string;
  ASSETS: AssetsBinding;
};

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["productName", "problem", "targetUser", "workaround", "jobToBeDone", "constraints", "evidence", "unknowns", "theses", "whyRecommended"],
  properties: {
    productName: { type: "string" },
    problem: itemSchema(),
    targetUser: itemSchema(),
    workaround: itemSchema(),
    jobToBeDone: itemSchema(),
    constraints: itemSchema(),
    evidence: itemSchema(),
    unknowns: itemSchema(),
    theses: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        required: ["title", "description", "pros", "risks", "score", "recommended"],
        properties: {
          title: { type: "string" }, description: { type: "string" },
          pros: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
          risks: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
          score: { type: "integer", minimum: 0, maximum: 100 },
          recommended: { type: "boolean" }
        }
      }
    },
    whyRecommended: { type: "string" }
  }
};

function itemSchema() {
  return {
    type: "object", additionalProperties: false,
    required: ["body", "confidence", "assumption", "evidence"],
    properties: {
      body: { type: "string" },
      confidence: { type: "string", enum: ["high", "medium", "needs-validation"] },
      assumption: { type: "boolean" },
      evidence: { type: "array", items: { type: "string" }, maxItems: 4 }
    }
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!env.GROQ_API_KEY) return json({ error: "Forge AI is not configured yet." }, 503);

  const body = (await request.json().catch(() => null)) as { source?: unknown } | null;
  const source = typeof body?.source === "string" ? body.source.trim() : "";
  if (source.length < 40) return json({ error: "Give Forge more source material before analysis." }, 400);
  if (source.length > 30000) return json({ error: "This source is too large for one analysis pass." }, 413);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || "qwen/qwen3.8-27b",
      temperature: 0.15,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: "Act as Forge, a rigorous product-thinking partner. Analyze only supplied evidence. Separate evidence from assumptions, identify important unknowns, propose three materially different product directions, recommend exactly one, explain the tradeoff, and do not invent customer evidence or write a full spec yet." },
        { role: "user", content: `Analyze this product source and expose the questions the builder has not answered yet:\n\n${source}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "forge_product_analysis", strict: true, schema: analysisSchema }
      }
    })
  });

  if (!response.ok) {
    console.error("Groq analysis failed", response.status, response.headers.get("x-request-id"));
    return json({ error: "Forge could not complete the AI analysis. Try again." }, 502);
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string; refusal?: string | null } }> };
  const message = payload.choices?.[0]?.message;
  if (message?.refusal) return json({ error: "Forge could not analyze that source." }, 422);
  if (!message?.content) return json({ error: "Forge received an empty model response." }, 502);

  try {
    return json(JSON.parse(message.content));
  } catch {
    return json({ error: "Forge received an invalid model response." }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/forge/analyze") return handleAnalyze(request, env);
    return env.ASSETS.fetch(request);
  }
};
