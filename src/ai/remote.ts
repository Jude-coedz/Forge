import type { Conversation } from "../types";
import { AIProviderError, type ForgeReasoningProvider, type ForgeTurnMode } from "./provider";

function compactConversation(conversation: Conversation, mode: ForgeTurnMode) {
  const base = {
    productName: conversation.productName,
    stage: conversation.stage,
    productModel: conversation.productModel,
    theses: conversation.theses,
    selectedThesis: conversation.selectedThesis,
    thesisLocked: conversation.thesisLocked,
  };

  if (mode === "lock-thesis") {
    return {
      ...base,
      recentMessages: conversation.messages.slice(-4).map(({ role, text }) => ({ role, text })),
    };
  }

  return {
    ...base,
    recentMessages: conversation.messages.slice(-4).map(({ role, text }) => ({ role, text })),
  };
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function transient(status: number) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

const RETRY_DELAYS = [800, 1800, 3600];

export class RemoteReasoningProvider implements ForgeReasoningProvider {
  readonly name = "forge-api";

  constructor(private readonly endpoint = "/api/forge/turn") {}

  async runTurn(conversation: Conversation, message: string, mode: ForgeTurnMode = "chat", signal?: AbortSignal) {
    let lastError = "Forge could not reach its reasoning service.";

    for (let attempt = 0; attempt < RETRY_DELAYS.length + 1; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({ mode, message, conversation: compactConversation(conversation, mode) }),
        });
      } catch {
        if (attempt < RETRY_DELAYS.length && !signal?.aborted) {
          await wait(RETRY_DELAYS[attempt]);
          continue;
        }
        throw new AIProviderError(lastError);
      }

      if (response.ok) return response.json();

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      lastError = payload?.error || `Forge reasoning failed with status ${response.status}.`;
      if (attempt < RETRY_DELAYS.length && transient(response.status) && !signal?.aborted) {
        await wait(RETRY_DELAYS[attempt]);
        continue;
      }

      throw new AIProviderError(lastError);
    }

    throw new AIProviderError(lastError);
  }
}
