import type { Conversation } from "../types";

export type ForgeTurnMode = "chat" | "lock-thesis" | "prototype";

export interface ForgeReasoningProvider {
  readonly name: string;
  runTurn(conversation: Conversation, message: string, mode?: ForgeTurnMode, signal?: AbortSignal): Promise<unknown>;
}

export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}
