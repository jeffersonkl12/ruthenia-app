import { Eta } from "eta";
import { PROMPT_TEMPLATES_DIR } from "@/llm/prompts/prompt.loader";

/**
 * Motor de template das camadas **dinâmicas** do system prompt.
 *
 * Camadas `static` continuam no interpolador simples `{{chave}}`
 * ({@link TemplatePrompt}, arquivos `.md`). Camadas `dynamic` precisam de laços e
 * condicionais para renderizar estruturas do mundo (lista de NPCs da location,
 * membros da party, etc.) — para isso usamos o Eta, com sintaxe estilo EJS:
 *
 * ```eta
 * ## Grupo
 * <% for (const m of it.members) { %>
 * - <%= m.name %> (<%= m.class %>, HP <%= m.hp %>)
 * <% } %>
 * ```
 *
 * Convenções nesta base:
 * - Templates dinâmicos ficam em `prompts/templates/*.eta` (mesma pasta dos
 *   `.md`; a extensão deixa claro qual motor renderiza o arquivo).
 * - `autoEscape: false`: o system prompt é texto/markdown puro, não HTML — não
 *   queremos `&` virar `&amp;`.
 * - Os dados chegam em `it` (padrão do Eta). Cada camada monta esse objeto a
 *   partir do contexto que **recebe**; o template não busca nada.
 */
export const eta = new Eta({
  views: PROMPT_TEMPLATES_DIR,
  defaultExtension: ".eta",
  autoEscape: false,
  cache: true,
});
