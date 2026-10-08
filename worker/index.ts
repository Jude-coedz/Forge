type AssetsBinding = { fetch(request: Request): Promise<Response> };

type Env = {
  Gemini_key?: string;
  Gemini_Key?: string;
  GEMINI_MODEL?: string;
  ASSETS: AssetsBinding;
};

type TurnMode = "chat" | "research" | "stress-test" | "directions" | "lock-thesis" | "prototype";

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

const researchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    signals: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          stance: { type: "string", enum: ["supports", "challenges", "context"] },
        },
        required: ["title", "detail", "stance"],
      },
    },
    alternatives: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          relevance: { type: "string" },
        },
        required: ["name", "description", "relevance"],
      },
    },
    unresolved: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" },
    },
    sources: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          url: { type: "string" },
        },
        required: ["title", "url"],
      },
    },
  },
  required: ["summary", "signals", "alternatives", "unresolved"],
};

const stressTestSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    thesis: { type: "string" },
    strongestCounterargument: { type: "string" },
    recommendation: { type: "string", enum: ["investigate", "reframe", "proceed-to-test"] },
    recommendationReason: { type: "string" },
    findings: {
      type: "array", minItems: 3, maxItems: 4,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          id: { type: "string" },
          risk: { type: "string", enum: ["value", "usability", "feasibility", "viability"] },
          title: { type: "string" },
          assumption: { type: "string" },
          whyItMatters: { type: "string" },
          falsification: { type: "string" },
          fastestTest: { type: "string" },
          evidenceState: { type: "string", enum: ["missing", "partial", "contested"] },
        },
        required: ["id", "risk", "title", "assumption", "whyItMatters", "falsification", "fastestTest", "evidenceState"],
      },
    },
    firstExperiment: {
      type: "object", additionalProperties: false,
      properties: {
        hypothesis: { type: "string" },
        method: { type: "string" },
        successSignal: { type: "string" },
        stopSignal: { type: "string" },
      },
      required: ["hypothesis", "method", "successSignal", "stopSignal"],
    },
  },
  required: ["thesis", "strongestCounterargument", "recommendation", "recommendationReason", "findings", "firstExperiment"],
};

const prototypeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    html: { type: "string" },
    summary: { type: "string" },
    screens: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
  },
  required: ["html", "summary", "screens"],
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
  if (mode === "stress-test") {
    return {
      type: "json_schema",
      json_schema: {
        name: "forge_adversarial_stress_test",
        strict: true,
        schema: {
          type: "object", additionalProperties: false,
          properties: { reply: { type: "string" }, stressTest: stressTestSchema },
          required: ["reply", "stressTest"],
        },
      },
    };
  }

  if (mode === "research") {
    return {
      type: "json_schema",
      json_schema: {
        name: "forge_grounded_market_research",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            research: researchSchema,
          },
          required: ["reply", "research"],
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
            productName: { type: "string" },
            theses: { type: "array", items: thesisSchema, minItems: 3, maxItems: 3 },
          },
          required: ["reply", "productName", "theses"],
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
            spec: specSchema,
          },
          required: ["reply", "productName", "spec"],
        },
      },
    };
  }

  if (mode === "prototype") {
    return {
      type: "json_schema",
      json_schema: {
        name: "forge_working_prototype",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            prototype: prototypeSchema,
          },
          required: ["reply", "prototype"],
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

Forge is experienced as one continuous thinking workspace, not a visible multi-step wizard. The Product Model is internal memory. Do not make the user manage the model, learn a product-management framework, or navigate stages in order to get value.

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
- Do not put a question in the conversational reply by default. The interface can surface one decision-changing open question separately from the Product Model.
- Maintain at most one highest-value open decision when an answer would materially change the product mechanism, scope, permissions, economics, or core user.
- If the user likely cannot know the answer, preserve it as an assumption or validation task instead of asking.
- Never block useful progress merely because context is incomplete.
- Prefer a useful synthesis, recommendation, or explicit assumption over asking for more context.
- Leave unknown Product Model string fields empty. Never fill them with placeholders such as "not clear yet", "unknown", or "TBD".`;

  if (mode === "research") {
    return `${core}

The user has explicitly asked Forge to research the current market around the product hypothesis.

Use Google Search grounding. This is product validation research, not a generic market report.

RESEARCH GOALS
- Find current products, workflows, or substitutes that already address the same problem or desired outcome.
- Look for concrete signals that support, challenge, or add important context to the problem.
- Identify where the user's proposed opportunity appears differentiated, redundant, or still unproven.
- Surface contradictions and uncomfortable evidence rather than trying to validate the idea.
- Preserve uncertainty. Search results can show that alternatives or discussions exist; they do not prove willingness to pay or market size.
- Do not invent TAM, demand, customer frequency, revenue, adoption, or willingness to switch.
- Prefer primary sources, official product pages, credible reporting, and direct community evidence when relevant.
- Only include source URLs that were actually surfaced by Google Search during this interaction.

OUTPUT
- summary: 2-4 sentences on what the external evidence changes about the product hypothesis.
- signals: 2-6 concrete findings, each marked supports, challenges, or context.
- alternatives: up to 6 directly relevant products or substitutes, with why each matters to this idea.
- unresolved: the most important things web research still cannot prove.
- sources: useful URLs actually used when they are available. Do not fail the research output if source metadata is incomplete.
- reply: a concise 1-3 sentence conversational takeaway. Do not repeat the whole report.`;
  }

  if (mode === "stress-test") {
    return `${core}

FORGE STRESS TEST. You are an adversarial senior product leader, not an idea cheerleader.
Your task is to expose what could make THIS SPECIFIC IDEA fail before its user invests in implementation.

- Start with the user's actual desired outcome, workaround, switching friction and constraints.
- Produce 3 to 4 distinct decision-changing, falsifiable assumptions. Vary across desirability, usability, feasibility, or viability only where relevant.
- Do NOT invent studies, interviews, market demand, adoption statistics, prices, or engineering capabilities.
- Look for the non-obvious second-order failure: even if the feature technically works, will the desired business/user outcome occur?
- For every finding, say exactly what needs to be true, why it matters, what observation would falsify it, and a low-cost test a real person could run.
- Evidence states must reflect ACTUAL input/research: missing when not evidenced; partial only if some real evidence was supplied; contested when known contradictory signals are present.
- Rank findings in descending order of how badly being wrong would undermine the entire product.
- The first experiment must test the highest-consequence uncertain assumption and state observable success AND stopping signals; never invent numeric cutoffs.
- recommendation can be "proceed-to-test" (not "validated"), "investigate", or "reframe". Explain the tradeoff and what could change the recommendation.
- The strongest counterargument should be uncomfortable, specific and credible. Avoid vague "there could be competition" phrases.
- Do not automatically suggest an AI assistant, generic dashboard or marketplace.
- Reply in one short sentence. All substantial reasoning belongs in structured output.
`;
  }

  if (mode === "directions") {
    return `${core}

The user has explicitly chosen to compare product directions. Do not block this step because some assumptions remain unresolved. Preserve those unknowns and account for them in the risks.

Generate exactly three materially different product directions. They must differ in product mechanism or workflow, not merely feature scope. For each, explain the product in plain language, why it could win, and its biggest risks. Recommend exactly one based on the current evidence. Mark exactly one option recommended=true. Update the Product Model with the direction decision still open until the user chooses.`;
  }

  if (mode === "lock-thesis") {
    return `${core}

The user wants a product prototype. They may have selected one of three alternative mechanisms OR may be prototyping the original idea directly from an adversarial stress test. Do not require a directions comparison when none exists. Generate a concise Build Brief, not a giant PRD.
If the request is to prototype the current idea, preserve that idea's actual mechanism and make the smallest possible workflow that can test the highest-risk assumption.

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

  if (mode === "prototype") {
    return `${core}

The user has locked the Build Brief and explicitly asked Forge to create a working prototype.

Generate one self-contained HTML document that demonstrates the riskiest and most important V1 workflow from the locked brief.

PROTOTYPE RULES
- The prototype must be interactive, not a static mockup. Navigation, buttons, form inputs, toggles, tabs, dialogs, confirmations, empty states, and state changes should work with inline JavaScript where relevant.
- Use only inline HTML, CSS, SVG, and JavaScript. Do not use external libraries, remote fonts, remote images, fetch calls, APIs, iframes, analytics, or network requests.
- Keep all data local and ephemeral. The prototype must not submit forms or contact external services.
- Build 2-6 coherent views or states that prove the product's core mechanism. Do not create a generic SaaS dashboard unless the chosen product direction genuinely requires one.
- Reflect the primary user, chosen direction, P0 requirements, explicit non-goals, and important failure modes from the Build Brief.
- Use realistic interface copy derived from the brief. Do not invent customer evidence, integrations, payments, or operational capabilities that the brief does not support.
- Make the prototype visually polished enough to evaluate the workflow: strong hierarchy, deliberate spacing, responsive layout, clear active/disabled/success/error states, and restrained motion.
- Prefer one memorable interaction that communicates the product mechanism over decorative effects.
- The HTML string must start with <!doctype html> and contain no Markdown fences.
- The summary should explain what workflow the prototype tests and what is intentionally not simulated.
- screens should list the main views/states included in the prototype.`;
  }

  return `${core}

For this turn, update the Product Model from the user's latest input.

On the first idea:
- produce a useful working model immediately;
- infer only what the input reasonably supports;
- preserve uncertainty as assumptions;
- create one open decision only if resolving it would materially change what gets built;
- do not ask the user to repeat information already present in their input;
- do not respond with a generic request for "more context."

If multiple plausible problems remain, preserve that ambiguity as one open decision instead of prematurely declaring one "the core problem".

The reply must be concise: 1-3 sentences. State Forge's current interpretation and the most important implication. Do not repeat the whole Product Model and do not end with a generic question.`;
}

async function callGemini(env: Env, mode: TurnMode, body: TurnBody) {
  const context = body.conversation ?? {};
  const geminiKey = env.Gemini_key || env.Gemini_Key || "";
  const userMessage = typeof body.message === "string" ? body.message.trim() : "";
  const model = env.GEMINI_MODEL || "gemini-3.8-flash";

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiKey,
    },
    body: JSON.stringify({
      model,
      store: false,
      system_instruction: systemPrompt(mode),
      input: `CURRENT FORGE CONTEXT:\n${JSON.stringify(context)}\n\nUSER INPUT:\n${userMessage || "Proceed based on the explicit user action."}`,
      generation_config: {
        thinking_level: mode === "chat" ? "low" : mode === "prototype" ? "high" : mode === "research" ? "medium" : "medium",
        max_output_tokens: mode === "prototype" ? 24000 : mode === "chat" ? 6000 : 10000,
      },
      ...(mode === "research" ? { tools: [{ type: "google_search" }, { type: "url_context" }] } : {}),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: structuredFormat(mode).json_schema.schema,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Gemini turn failed", response.status, response.headers.get("x-request-id"), detail.slice(0, 400));
    const safeDetail = detail
      .replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]")
      .slice(0, 220);

    return {
      error: response.status === 429
        ? "Forge is busy right now. Your work is saved. Retry in a moment."
        : `Forge could not complete this reasoning step (Gemini ${response.status}). ${safeDetail || "Your work is saved."}`,
    };
  }

  const payload = (await response.json()) as {
    status?: string;
    steps?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (payload.status === "failed" || payload.status === "cancelled") {
    return { error: "Gemini could not complete this reasoning step. Your work is saved." };
  }

  const outputText = payload.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("");

  if (!outputText) return { error: "Forge received an empty model response." };

  try {
    return JSON.parse(outputText) as Record<string, unknown>;
  } catch {
    return { error: "Forge received an invalid structured response." };
  }
}

async function handleTurn(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!env.Gemini_key && !env.Gemini_Key) return json({ error: "Forge AI is not configured yet." }, 503);

  const body = (await request.json().catch(() => null)) as TurnBody | null;
  if (!body || !body.conversation || typeof body.conversation !== "object") {
    return json({ error: "Project context is required." }, 400);
  }

  const mode: TurnMode =
    body.mode === "research" || body.mode === "stress-test" || body.mode === "directions" || body.mode === "lock-thesis" || body.mode === "prototype"
      ? body.mode
      : "chat";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (mode === "chat" && !message) return json({ error: "Message is required." }, 400);
  if (message.length > 30000) return json({ error: "This input is too large for one reasoning step." }, 413);

  const result = await callGemini(env, mode, body);
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
