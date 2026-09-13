export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateJSONOptions = {
  messages: AIMessage[];
  temperature?: number;
  signal?: AbortSignal;
};

export interface AIProvider {
  readonly name: string;
  generateJSON<T>(options: GenerateJSONOptions): Promise<T>;
}

export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}
