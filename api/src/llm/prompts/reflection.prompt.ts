import { TemplatePrompt } from "./system.prompt";

/**
 * Rubrica do subagente de reflexão de estado narrativo (pós-turno).
 * Consumida por `@/llm/agents/state-reflector` via
 * `@/service/state-reflection.service`.
 */
export const REFLECTION_PROMPT = TemplatePrompt.fromFile(
  "state-reflection",
  "state-reflection",
);
