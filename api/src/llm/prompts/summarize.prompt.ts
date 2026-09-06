import { TemplatePrompt } from "./system.prompt";

/**
 * Prompt usado pelo nó de sumarização do {@link BaseAgent} para condensar
 * mensagens que saem da janela recente em um resumo contínuo.
 * Conteúdo em `prompts/templates/summarize.md`.
 */
export const SUMMARIZE_PROMPT = TemplatePrompt.fromFile(
  "summarize",
  "summarize",
);
