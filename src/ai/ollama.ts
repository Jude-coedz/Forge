import { AIProviderError, type AIProvider, type GenerateJSONOptions } from "./provider";

type OllamaResponse = {
  message?: { content?: string };
};

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";

  constructor(
    private readonly model = import.meta.env.VITE_OLLAMA_MODEL || "qwen3:8b",
    private readonly endpoint = import.meta.env.VITE_OLLAMA_URL || "/ollama/api/chat",
  ) {}

  async generateJSON<T>({ messages, temperature = 0.2, signal }: GenerateJSONOptions): Promise<T> {
    let response: Response;

    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: "json",
          messages,
          options: { temperature },
        }),
      });
    } catch {
      throw new AIProviderError("Could not reach the local Ollama server.");
    }

    if (!response.ok) {
      throw new AIProviderError(`Ollama returned HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as OllamaResponse;
    const content = payload.message?.content?.trim();
    if (!content) throw new AIProviderError("Ollama returned an empty response.");

    try {
      return JSON.parse(content) as T;
    } catch {
      throw new AIProviderError("Ollama returned invalid JSON.");
    }
  }
}
