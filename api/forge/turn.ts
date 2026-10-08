import worker from "../../worker/index";

declare const process: {
  env: Record<string, string | undefined>;
};

// Gemini structured reasoning is a real backend workload. Running it in Vercel's
// Edge runtime caused gateway timeouts because the entire completion was awaited
// without sending a response. The Node runtime has an explicit execution budget.
export const maxDuration = 120;

const missingAssets = {
  fetch: async () => new Response("Not found.", { status: 404 }),
};

// Vercel Node.js Functions accept the standard Web Request/Response API.
export default {
  fetch(request: Request) {
    return worker.fetch(request, {
      Gemini_key: process.env.Gemini_key ?? "",
      Gemini_Key: process.env.Gemini_Key ?? "",
      GEMINI_MODEL: process.env.GEMINI_MODEL,
      ASSETS: missingAssets,
    });
  },
};
