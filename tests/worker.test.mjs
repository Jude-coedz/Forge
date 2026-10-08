import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const transformed = await build({
  entryPoints: ["worker/index.ts"],
  platform: "node",
  format: "esm",
  bundle: true,
  write: false,
});
const source = transformed.outputFiles[0].text;
const worker = (await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"))).default;
const endpoint = "http://localhost/api/forge/turn";
const env = { Gemini_key: "test-placeholder-not-a-real-key", ASSETS: { fetch: async () => new Response("asset") } };

function body(mode = "chat") {
  return new Request(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode,
      message: "Freelancers need a better way to follow up on late invoices.",
      conversation: { productModel: {}, recentMessages: [] },
    }),
  });
}
function geminiReply(reply) {
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] }, finishReason: "STOP" }],
  }), { status: 200 });
}
const frame = {
  reply: "The risk is whether freelancers will use another tool.",
  productName: "InvoiceFollowup",
  productModel: {
    summary: "Follow up on late invoices",
    primaryUser: "Freelancers",
    opportunity: "Late payments",
    currentWorkaround: "Manual messages",
    desiredOutcome: "Timely payment",
  },
};

test("GET health endpoint reports configuration without exposing a secret", async () => {
  const response = await worker.fetch(new Request(endpoint), env);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.runtime, "node");
  assert.equal(data.configured, true);
  assert.ok(!JSON.stringify(data).includes(env.Gemini_key));
});

test("initial idea uses short Gemini model and structured response", async () => {
  const original = globalThis.fetch;
  let inspected;
  globalThis.fetch = async (url, init) => {
    inspected = { url, body: JSON.parse(init.body) };
    return geminiReply(frame);
  };
  try {
    const response = await worker.fetch(body(), env);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.productModel.primaryUser, "Freelancers");
    assert.match(inspected.url, /gemini-3\.5-flash-lite/);
    assert.equal(inspected.body.generationConfig.responseFormat.text.mimeType, "application/json");
    assert.equal(inspected.body.generationConfig.thinkingConfig.thinkingLevel, "low");
    assert.equal(inspected.body.generationConfig.responseFormat.text.schema.properties.productModel.required.length, 5);
  } finally { globalThis.fetch = original; }
});

test("transient upstream failure falls back to another model once", async () => {
  const original = globalThis.fetch;
  const models = [];
  globalThis.fetch = async (url) => {
    models.push(url);
    return models.length === 1
      ? new Response("temporary failure", { status: 503 })
      : geminiReply(frame);
  };
  try {
    const response = await worker.fetch(body(), env);
    assert.equal(response.status, 200);
    assert.equal(models.length, 2);
    assert.match(models[0], /flash-lite/);
    assert.match(models[1], /gemini-3\.5-flash:generateContent/);
  } finally { globalThis.fetch = original; }
});

test("authorization errors do not trigger an expensive fallback", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response("Invalid key", { status: 403 });
  };
  try {
    const response = await worker.fetch(body(), env);
    const data = await response.json();
    assert.equal(response.status, 502);
    assert.equal(calls, 1);
    assert.match(data.error, /not authorized/);
    assert.ok(!JSON.stringify(data).includes(env.Gemini_key));
  } finally { globalThis.fetch = original; }
});

test("missing Gemini environment is a clear configuration failure", async () => {
  const response = await worker.fetch(body(), { Gemini_key: "", ASSETS: env.ASSETS });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not configured/);
});
