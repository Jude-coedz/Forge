import worker from "../../worker/index";

declare const process: { env: Record<string, string | undefined> };

// Edge can send response chunks immediately. We send JSON whitespace keepalives
// while the upstream model is running so the connection never idles waiting
// for an entire structured Gemini response.
export const config = { runtime: "edge" };

const assets = { fetch: async () => new Response("Not found.", { status: 404 }) };

export default function handler(request: Request): Response {
  const environment = {
    Gemini_key: process.env.Gemini_key ?? "",
    Gemini_Key: process.env.Gemini_Key ?? "",
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    ASSETS: assets,
  };

  if (request.method === "GET") {
    return Response.json({
      status: "ok",
      provider: "gemini",
      runtime: "edge-streaming",
      configured: Boolean(environment.Gemini_key || environment.Gemini_Key),
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const emit = (value: string) => {
        if (!closed) controller.enqueue(encoder.encode(value));
      };

      // Leading whitespace is valid JSON. It starts the response immediately,
      // without inventing a progress percentage or changing the client contract.
      emit(" \n");
      const heartbeat = setInterval(() => emit(" \n"), 6000);
      Promise.resolve()
        .then(() => worker.fetch(request, environment))
        .then((response) => response.text())
        .then((body) => emit(body || JSON.stringify({
          error: "The reasoning service returned an empty response.",
          code: "EMPTY_BACKEND_RESPONSE",
        })))
        .catch((error) => {
          console.error("forge.edge.unhandled", error instanceof Error ? error.name : "unknown");
          emit(JSON.stringify({
            error: "Forge could not complete the reasoning request. Your input is saved.",
            code: "STREAM_FAILED",
          }));
        })
        .finally(() => {
          clearInterval(heartbeat);
          closed = true;
          controller.close();
        });
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
