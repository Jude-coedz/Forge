import worker from "../../worker/index";

declare const process: {
  env: Record<string, string | undefined>;
};

export const config = {
  runtime: "edge",
};

const missingAssets = {
  fetch: async () => new Response("Not found.", { status: 404 }),
};

export default function handler(request: Request) {
  return worker.fetch(request, {
    Gemini_key: process.env.Gemini_key ?? "",
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    ASSETS: missingAssets,
  });
}
