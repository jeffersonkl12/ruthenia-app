import { llmConfig } from "@/llm/config";
import type { ProviderName } from "@/llm/config";
import {
  ProviderNotConfiguredError,
  UnknownProviderError,
} from "@/llm/errors";
import type { ProviderMetadata } from "./provider.interface";

/**
 * Catálogo curado de provedores. Adicionar um provedor novo = uma entrada aqui
 * + o pacote `@langchain/<provedor>` instalado. Nada mais no código muda (OCP).
 *
 * `defaultModel`/`recommendedModels` são uma referência, não uma trava: o
 * registry aceita qualquer string de modelo (política "curado + aberto").
 */
const PROVIDER_CATALOG: readonly ProviderMetadata[] = [
  {
    name: "openai",
    label: "OpenAI (ChatGPT)",
    aliases: ["chatgpt", "gpt", "openai"],
    initChatModelProvider: "openai",
    envVar: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
    recommendedModels: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
  },
  {
    name: "anthropic",
    label: "Anthropic (Claude)",
    aliases: ["claude", "anthropic"],
    initChatModelProvider: "anthropic",
    envVar: "ANTHROPIC_API_KEY",
    defaultModel: "claude-sonnet-5",
    recommendedModels: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"],
  },
  {
    name: "google-genai",
    label: "Google (Gemini)",
    aliases: ["gemini", "google", "google-genai"],
    initChatModelProvider: "google-genai",
    envVar: "GOOGLE_API_KEY",
    defaultModel: "gemini-2.0-flash",
    recommendedModels: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ],
  },
  {
    name: "deepseek",
    label: "DeepSeek",
    aliases: ["deepseek"],
    initChatModelProvider: "deepseek",
    envVar: "DEEPSEEK_API_KEY",
    defaultModel: "deepseek-chat",
    recommendedModels: ["deepseek-chat", "deepseek-reasoner"],
  },
] as const;

/**
 * Registro central de provedores de LLM.
 *
 * Responsável por: listar provedores, resolver nome/apelido -> metadados,
 * escolher o modelo efetivo e garantir que há credencial antes de instanciar.
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;

  private readonly byName = new Map<ProviderName, ProviderMetadata>();
  private readonly aliasIndex = new Map<string, ProviderName>();

  private constructor() {
    for (const meta of PROVIDER_CATALOG) {
      this.byName.set(meta.name, meta);
      this.aliasIndex.set(meta.name.toLowerCase(), meta.name);
      for (const alias of meta.aliases) {
        this.aliasIndex.set(alias.toLowerCase(), meta.name);
      }
    }
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /** Todos os provedores do catálogo. */
  public list(): ProviderMetadata[] {
    return [...this.byName.values()];
  }

  /** `true` se o nome/apelido resolve para um provedor conhecido. */
  public has(nameOrAlias: string): boolean {
    return this.aliasIndex.has(nameOrAlias.trim().toLowerCase());
  }

  /** Metadados do provedor. Lança {@link UnknownProviderError} se desconhecido. */
  public get(nameOrAlias: string): ProviderMetadata {
    const canonical = this.aliasIndex.get(nameOrAlias.trim().toLowerCase());
    if (!canonical) {
      throw new UnknownProviderError(
        `Provedor desconhecido: "${nameOrAlias}". ` +
          `Conhecidos: ${this.list()
            .map((p) => p.name)
            .join(", ")}.`,
      );
    }
    // `canonical` veio do índice, então a chave existe no mapa.
    return this.byName.get(canonical) as ProviderMetadata;
  }

  /**
   * Resolve o par provedor/modelo efetivo.
   * `requestedModel` é usado como veio (aberto); na ausência, cai no
   * `defaultModel` do provedor.
   */
  public resolveModel(
    nameOrAlias: string,
    requestedModel?: string,
  ): { provider: ProviderName; model: string } {
    const meta = this.get(nameOrAlias);
    const model = requestedModel?.trim() || meta.defaultModel;
    return { provider: meta.name, model };
  }

  /**
   * Garante que há credencial para o provedor.
   * Lança {@link ProviderNotConfiguredError} se não houver `explicitKey` nem
   * variável de ambiente correspondente.
   */
  public assertConfigured(
    provider: ProviderName,
    explicitKey?: string,
  ): string {
    const key = explicitKey?.trim() || llmConfig.apiKeyFor(provider);
    if (!key) {
      const meta = this.byName.get(provider) as ProviderMetadata;
      throw new ProviderNotConfiguredError(
        `Provedor "${provider}" sem credencial. ` +
          `Defina ${meta.envVar} no ambiente ou passe apiKey na requisição.`,
      );
    }
    return key;
  }
}

export const providerRegistry = ProviderRegistry.getInstance();
