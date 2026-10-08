import type { Conversation } from "../types";
import { AIProviderError, type ForgeReasoningProvider, type ForgeTurnMode } from "./provider";

function compactConversation(conversation: Conversation, mode: ForgeTurnMode) {
  const base = {
    productName: conversation.productName,
    stage: conversation.stage,
    productModel: conversation.productModel,
    research: conversation.research,
    stressTest: conversation.stressTest,
    theses: conversation.theses,
    selectedThesis: conversation.selectedThesis,
    thesisLocked: conversation.thesisLocked,
  };

  if (mode === "prototype") {
    return {
      ...base,
      spec: conversation.spec,
      recentMessages: conversation.messages.slice(-4).map(({ role, text }) => ({ role, text })),
    };
  }

  return {
    ...base,
    recentMessages: conversation.messages.slice(-4).map(({ role, text }) => ({ role, text })),
  };
}

export class RemoteReasoningProvider implements ForgeReasoningProvider {
  readonly name = "forge-api";

  constructor(private readonly endpoint = "/api/forge/turn") {}

  async runTurn(conversation: Conversation, message: string, mode: ForgeTurnMode = "chat", signal?: AbortSignal) {
    // Retries and model fallback are handled on the server. Retrying a gateway
    // timeout from the browser can multiply work and make a 30s fault a 90s fault.
    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          mode,
          message,
          conversation: compactConversation(conversation, mode),
        }),
      });
    } catch {
      throw new AIProviderError("Forge could not reach its reasoning service. Your input is saved.");
    }

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      code?: string;
    } | null;

    if (!response.ok) {
      throw new AIProviderError(
        payload?.error || (response.status === 504
          ? "The reasoning request timed out. Your input is saved."
          : "Reasoning failed (HTTP " + response.status + "). Your input is saved."),
      );
    }
    if (!payload || typeof payload !== "object") {
      throw new AIProviderError("Forge received an invalid response. Your input is saved.");
    }
    // Edge streaming starts with HTTP 200 to avoid gateway idle timeouts.
    // The final JSON may still carry a backend error.
    if (typeof payload.error === "string") {
      throw new AIProviderError(payload.error);
    }
    return payload;
  }
}
