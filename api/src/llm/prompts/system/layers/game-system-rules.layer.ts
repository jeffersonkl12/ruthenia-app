import { TemplatePrompt } from "@/llm/prompts/system.prompt";
import type { StaticLayer } from "../layer.interface";

/**
 * Segunda camada do system prompt: regras gerais do sistema de RPG (como o
 * mestre deve gerir a sessão). Conteúdo fixo em
 * `prompts/templates/game-system-rules.md`.
 */
const gameSystemRulesTemplate = TemplatePrompt.fromFile(
  "system.game-system-rules",
  "game-system-rules",
);

export const gameSystemRulesLayer: StaticLayer = {
  id: "game-system-rules",
  kind: "static",
  render: () => gameSystemRulesTemplate.render(),
};
