/**
 * Uma camada do system prompt.
 *
 * O system prompt do agente é montado empilhando camadas em ordem (ver
 * {@link SystemPromptBuilder}). Cada camada é **`static` ou `dynamic`, nunca as
 * duas coisas**:
 *
 * - `static`: texto fixo (identidade, regras inegociáveis). Renderiza sem
 *   contexto, pelo interpolador simples `{{chave}}` ({@link TemplatePrompt},
 *   arquivos `.md`); o resultado nunca muda entre requisições.
 * - `dynamic`: texto derivado do estado do mundo (party, location, NPCs, modo da
 *   sessão). Recebe um {@link SystemPromptContext} e é renderizada a cada build,
 *   via template Eta (`.eta`, laços/condicionais) — ver {@link etaDynamicLayer}.
 *
 * Adicionar uma camada = criar o módulo dela + incluí-la em
 * `SYSTEM_PROMPT_LAYERS` (`system-prompt.config.ts`), na posição desejada.
 */
export type LayerKind = "static" | "dynamic";

/**
 * Estado do mundo entregue às camadas `dynamic` no momento do build.
 *
 * Vazio nesta fase (só existe a camada `identity`, que é `static`). Ganha campos
 * opcionais — `party`, `location`, `npcs`, `session`, ... — conforme as camadas
 * dinâmicas forem entrando.
 */
export interface SystemPromptContext {
  [key: string]: unknown;
}

interface BaseLayer {
  /** Id estável e único, ex.: `"identity"`. Usado em logs e depuração. */
  readonly id: string;
  readonly kind: LayerKind;
}

/** Camada de conteúdo fixo, renderizada sem contexto. */
export interface StaticLayer extends BaseLayer {
  readonly kind: "static";
  render(): string;
}

/** Camada derivada do estado do mundo; retornar `""` a omite do prompt final. */
export interface DynamicLayer extends BaseLayer {
  readonly kind: "dynamic";
  render(ctx: SystemPromptContext): string | Promise<string>;
}

export type SystemPromptLayer = StaticLayer | DynamicLayer;
