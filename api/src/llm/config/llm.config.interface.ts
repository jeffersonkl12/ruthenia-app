/**
 * Nomes canônicos dos provedores suportados nesta fase.
 *
 * O valor de cada item é exatamente a string que o `initChatModel` da LangChain
 * espera em `modelProvider` — por isso `google-genai` (Gemini) e não `google`.
 */
export const PROVIDER_NAMES = [
  "openai",
  "anthropic",
  "google-genai",
  "deepseek",
] as const;

export type ProviderName = (typeof PROVIDER_NAMES)[number];

/**
 * Configuração de LLM já validada e normalizada a partir do ambiente.
 * É a única fonte de verdade para defaults de provedor/modelo/parâmetros.
 */
export interface LlmConfigValues {
  /** Provedor usado quando a requisição não especifica um. */
  defaultProvider: ProviderName;
  /** Modelo global padrão; `null` delega a escolha ao provedor (via registry). */
  defaultModel: string | null;
  /** Temperatura padrão de amostragem (0–2). */
  defaultTemperature: number;
  /** Teto padrão de tokens de saída; `null` = sem limite explícito. */
  defaultMaxTokens: number | null;
  /** API key por provedor; `null` quando ausente no ambiente. */
  apiKeys: Record<ProviderName, string | null>;
}
