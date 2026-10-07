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
    GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
    GROQ_MODEL: process.env.GROQ_MODEL,
    ASSETS: missingAssets,
  });
}
