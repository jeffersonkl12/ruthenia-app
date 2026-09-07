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
 * `session`, `scene`, `location` e `region` alimentam a camada
 * `world-state-snapshot`; `party` alimenta a camada `party-character-context`.
 * Nenhum call site de `systemPromptBuilder.build()` popula esses campos ainda —
 * ficam `undefined` até a busca real (sessão ativa, party, personagens,
 * location/region atuais) ser implementada. Ganha mais campos opcionais —
 * modo da sessão, ... — conforme outras camadas dinâmicas forem entrando.
 *
 * Regra de domínio: uma party tem sempre **um único líder**, e esse líder é
 * sempre o personagem do jogador (`isPlayer: true`) — o jogo não é
 * multiplayer, então nunca há mais de um personagem jogável por party. Todos
 * os outros membros são NPCs (`isPlayer: false`).
 */
export interface SystemPromptContext {
  session?: { name: string; mode: "NARRATIVE" | "COMBAT" };
  scene?: { title: string; description?: string };
  location?: { name: string; type: string };
  region?: { name: string; biome: string };
  party?: {
    name: string;
    /** O personagem do jogador — único líder da party, nunca um NPC. */
    leader: PartyCharacterSummary;
    npcs: PartyCharacterSummary[];
  };
  [key: string]: unknown;
}

/** Resumo de um personagem (líder ou NPC) usado pela camada `party-character-context`. */
export interface PartyCharacterSummary {
  name: string;
  occupation: string;
  healthStatus: "HEALTHY" | "SICK" | "INJURED" | "INCAPACITATED" | "DEAD";
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
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
