import type { SpecDoc } from "../types";

export function specToMarkdown(spec: SpecDoc) {
  const requirements = spec.requirements
    .map((r) => {
      const acceptance = r.criteria.map((c) => `- ${c}`).join("\n");
      return `### ${r.id} · ${r.name}\n${r.story}\n\nPriority: ${r.priority}\nWhy it exists: ${r.source}\n\nAcceptance criteria:\n${acceptance}`;
    })
    .join("\n\n");

  const nonGoals = spec.nonGoals.map((item) => `- ${item}`).join("\n");
  const risks = spec.failureModes
    .map((item) => `- **${item.title}** (${item.severity}): ${item.containment}`)
    .join("\n");
  const validation = spec.validationPlan
    .map((item) => `- **${item.risk}** — ${item.assumption}\n  Test: ${item.test}\n  Signal: ${item.successSignal}`)
    .join("\n");
  const metrics = spec.metrics.map((item) => `- **${item.name}:** ${item.target}`).join("\n");
  const questions = spec.questions.map((item) => `- ${item}`).join("\n");

  return `# ${spec.productName} — Build Brief

## Product direction
${spec.thesis}

## V1
${spec.overview}

## Not in V1
${nonGoals || "- None specified"}

## Requirements

${requirements}

## Risks
${risks || "- None specified"}

## Validation
${validation || "- No validation work specified"}

## Success signals
${metrics || "- No success signals specified"}

## Open questions
${questions || "- None"}`;
}

export function builderPrompt(spec: SpecDoc) {
  const requirements = spec.requirements
    .filter((r) => r.priority === "P0")
    .map((r) => `- ${r.name}: ${r.story}\n  Acceptance: ${r.criteria.join("; ")}`)
    .join("\n");

  const nonGoals = spec.nonGoals.map((item) => `- ${item}`).join("\n");

  return `Build ${spec.productName} from this product brief.

Product direction:
${spec.thesis}

V1 intent:
${spec.overview}

Must-have requirements:
${requirements}

Do not build:
${nonGoals || "- Anything outside the stated V1"}

Do not invent new scope. Preserve the product decisions above. If an implementation choice changes user behavior, adds scope, or violates an acceptance criterion, call it out before proceeding.`;
}
