export interface ProductAnalysisProvider {
  readonly name: string;
  analyzeSource(source: string, signal?: AbortSignal): Promise<unknown>;
}

export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}
