import {
  SECTION_SEPARATOR,
  SYSTEM_PROMPT_LAYERS,
} from "./system-prompt.config";
import type {
  SystemPromptContext,
  SystemPromptLayer,
} from "./layer.interface";

/**
 * Monta o system prompt do agente empilhando camadas em ordem.
 *
 * Camadas `static` renderizam sem contexto; camadas `dynamic` recebem o
 * {@link SystemPromptContext} da requisição. Camadas que renderizam vazio são
 * descartadas. O resultado é uma única string, pronta para virar `systemPrompt`
 * de um `AgentSpec`.
 *
 * `build` já é assíncrono e recebe contexto — nenhuma camada dinâmica futura
 * exige mudar esta assinatura.
 */
export class SystemPromptBuilder {
  constructor(private readonly layers: readonly SystemPromptLayer[]) {}

  public async build(ctx: SystemPromptContext = {}): Promise<string> {
    const parts: string[] = [];
    for (const layer of this.layers) {
      const rendered =
        layer.kind === "static" ? layer.render() : await layer.render(ctx);
      const text = rendered.trim();
      if (text) parts.push(text);
    }
    return parts.join(SECTION_SEPARATOR);
  }
}

/** Builder padrão, ligado às camadas de {@link SYSTEM_PROMPT_LAYERS}. */
export const systemPromptBuilder = new SystemPromptBuilder(SYSTEM_PROMPT_LAYERS);
