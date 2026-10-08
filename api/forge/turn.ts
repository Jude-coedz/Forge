declare const process: { env: Record<string, string | undefined> };

// A long-running AI request must not use the Vercel Edge idle timeout.
export const maxDuration = 120;

const unavailableAssets = {
  fetch: async () => new Response("Not found.", { status: 404 }),
};

// Default function export is the most broadly compatible Vercel Node handler.
// A health check is intentionally independent of importing Gemini/worker code.
export default async function handler(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return Response.json({
      status: "ok",
      runtime: "node",
      provider: "gemini",
      configured: Boolean(process.env.Gemini_key || process.env.Gemini_Key),
    }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { default: worker } = await import("../../worker/index");
    return worker.fetch(request, {
      Gemini_key: process.env.Gemini_key ?? "",
      Gemini_Key: process.env.Gemini_Key ?? "",
      GEMINI_MODEL: process.env.GEMINI_MODEL,
      ASSETS: unavailableAssets,
    });
  } catch (error) {
    console.error("forge.function.failure", error instanceof Error ? error.name : "unknown");
    return Response.json({
      error: "The reasoning worker could not start. Your idea is saved.",
      code: "WORKER_INIT_FAILED",
    }, { status: 500 });
  }
}
