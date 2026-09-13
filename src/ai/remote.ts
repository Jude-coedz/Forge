import { AIProviderError, type ProductAnalysisProvider } from "./provider";

export class RemoteAnalysisProvider implements ProductAnalysisProvider {
  readonly name = "forge-api";

  constructor(private readonly endpoint = "/api/forge/analyze") {}

  async analyzeSource(source: string, signal?: AbortSignal): Promise<unknown> {
    let response: Response;

    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({ source }),
      });
    } catch {
      throw new AIProviderError("Could not reach the Forge analysis API.");
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new AIProviderError(payload?.error || `Forge analysis failed with status ${response.status}.`);
    }

    return response.json();
  }
}
