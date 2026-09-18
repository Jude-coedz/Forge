import type { Conversation } from "../types";

export type ForgeTurnMode = "chat" | "directions" | "lock-thesis";

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
