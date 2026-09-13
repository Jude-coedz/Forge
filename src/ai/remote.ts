import type { Conversation } from "../types";
import { AIProviderError, type ForgeReasoningProvider, type ForgeTurnMode } from "./provider";

const DISCOVERY_GUIDE = [
  "Separate the customer problem from solution ideas.",
  "Prefer concrete behavior and outcomes over opinions.",
  "Ask about the riskiest assumption first.",
  "Consider value, usability, feasibility, and viability risk.",
  "Keep normal chat to one useful insight and one question.",
];

function compactConversation(conversation: Conversation) {
  return {
    phase: conversation.phase,
    productName: conversation.productName,
    discoveryGuide: DISCOVERY_GUIDE,
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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function transient(status: number) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export class RemoteReasoningProvider implements ForgeReasoningProvider {
  readonly name = "forge-api";

  constructor(private readonly endpoint = "/api/forge/turn") {}

  async runTurn(conversation: Conversation, message: string, mode: ForgeTurnMode = "chat", signal?: AbortSignal) {
    let lastError = "Could not reach Forge's reasoning service.";

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({ mode, message, conversation: compactConversation(conversation) }),
        });
      } catch {
        if (attempt === 0 && !signal?.aborted) {
          await wait(350);
          continue;
        }
        throw new AIProviderError(lastError);
      }

      if (response.ok) return response.json();

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      lastError = payload?.error || `Forge reasoning failed with status ${response.status}.`;
      if (attempt === 0 && transient(response.status) && !signal?.aborted) {
        await wait(400);
        continue;
      }
      throw new AIProviderError(lastError);
    }

    throw new AIProviderError(lastError);
  }
}
