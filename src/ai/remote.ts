import type { Conversation } from "../types";
import { AIProviderError, type ForgeReasoningProvider, type ForgeTurnMode } from "./provider";

function compactConversation(conversation: Conversation) {
  return {
    phase: conversation.phase,
    productName: conversation.productName,
    sources: conversation.sources,
    brief: conversation.brief,
    questions: conversation.questions,
    theses: conversation.theses,
    selectedThesis: conversation.selectedThesis,
    thesisLocked: conversation.thesisLocked,
    spec: conversation.spec,
    messages: conversation.messages.slice(-14).map(({ role, text }) => ({ role, text })),
  };
}

export class RemoteReasoningProvider implements ForgeReasoningProvider {
  readonly name = "forge-api";

  constructor(private readonly endpoint = "/api/forge/turn") {}

  async runTurn(conversation: Conversation, message: string, mode: ForgeTurnMode = "chat", signal?: AbortSignal) {
    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({ mode, message, conversation: compactConversation(conversation) }),
      });
    } catch {
      throw new AIProviderError("Could not reach Forge's reasoning service.");
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new AIProviderError(payload?.error || `Forge reasoning failed with status ${response.status}.`);
    }

    return response.json();
  }
}
