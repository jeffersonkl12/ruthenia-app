import { TemplatePrompt } from "@/llm/prompts/system.prompt";
import type { StaticLayer } from "../layer.interface";

/**
 * Primeira camada do system prompt: quem é o agente e as regras que ele deve
 * seguir sempre. Conteúdo fixo em `prompts/templates/identity.md`.
 */
const identityTemplate = TemplatePrompt.fromFile("system.identity", "identity");

export const identityLayer: StaticLayer = {
  id: "identity",
  kind: "static",
  render: () => identityTemplate.render(),
};
