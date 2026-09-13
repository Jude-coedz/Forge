import type { Conversation } from "../types";
import { AIProviderError, type ForgeReasoningProvider, type ForgeTurnMode } from "./provider";

const PRODUCT_GUIDE = [
  "Treat chat as input to a durable product model, not as the product itself.",
  "Separate customer opportunities from solution ideas.",
  "Prefer concrete behavior and outcomes over opinions.",
  "Preserve evidence, assumptions, open decisions, and why decisions were made.",
  "Reduce the riskiest assumption across value, usability, feasibility, and viability.",
  "If the user cannot answer a question, convert the unknown into a validation task instead of blocking progress.",
];

function compactConversation(conversation: Conversation) {
  return {
    phase: conversation.phase,
    productName: conversation.productName,
    productGuide: PRODUCT_GUIDE,
    sources: conversation.sources,
    brief: conversation.brief,
    productModel: conversation.productModel,
    questions: conversation.questions,
    theses: conversation.theses,
    selectedThesis: conversation.selectedThesis,
    thesisLocked: conversation.thesisLocked,
    spec: conversation.spec,
    prototype: conversation.prototype,
    evalReport: conversation.evalReport,
    messages: conversation.messages.slice(-12).map(({ role, text }) => ({ role, text })),
  };
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function transient(status: number) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

const RETRY_DELAYS = [700, 1600, 3200];

export class RemoteReasoningProvider implements ForgeReasoningProvider {
  readonly name = "forge-api";

  constructor(private readonly endpoint = "/api/forge/turn") {}

  async runTurn(conversation: Conversation, message: string, mode: ForgeTurnMode = "chat", signal?: AbortSignal) {
    let lastError = "Could not reach Forge's reasoning service.";

    for (let attempt = 0; attempt < RETRY_DELAYS.length + 1; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({ mode, message, conversation: compactConversation(conversation) }),
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
