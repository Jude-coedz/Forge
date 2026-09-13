type AssetsBinding = { fetch(request: Request): Promise<Response> };

type Env = {
  GROQ_API_KEY: string;
  GROQ_MODEL?: string;
  ASSETS: AssetsBinding;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/forge/analyze") {
      return handleAnalyze(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleAnalyze(_request: Request, _env: Env): Promise<Response> {
  return new Response(JSON.stringify({ error: "Not implemented yet." }), {
    status: 501,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
