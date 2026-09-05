import "dotenv/config";
import { z } from "zod";
import { LlmError } from "@/llm/errors";
import {
  PROVIDER_NAMES,
  type LlmConfigValues,
  type ProviderName,
} from "./llm.config.interface";

/**
 * Variável de ambiente exportada porém vazia (`FOO=`) é tratada como ausente —
 * caso comum em shells e CI. Sem isso, `""` falharia na validação em vez de
 * cair no default.
 */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalKey = z.preprocess(emptyToUndefined, z.string().min(1).optional());

/**
 * Schema do ambiente. Tudo é opcional exceto os defaults com valor de fallback:
 * a ausência de uma API key só vira erro quando aquele provedor for realmente
 * usado (checado no `ProviderRegistry.assertConfigured`).
 */
const envSchema = z.object({
  LLM_DEFAULT_PROVIDER: z.preprocess(
    emptyToUndefined,
    z.enum(PROVIDER_NAMES).default("openai"),
  ),
  LLM_DEFAULT_MODEL: optionalKey,
  LLM_DEFAULT_TEMPERATURE: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).max(2).default(0.7),
  ),
  LLM_DEFAULT_MAX_TOKENS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional(),
  ),
  OPENAI_API_KEY: optionalKey,
  ANTHROPIC_API_KEY: optionalKey,
  GOOGLE_API_KEY: optionalKey,
  DEEPSEEK_API_KEY: optionalKey,
});

/**
 * Singleton de configuração de LLM.
 *
 * Segue o mesmo padrão de `Database` (construtor privado + `getInstance`): a
 * validação do ambiente roda uma única vez, na primeira importação, e falha
 * cedo e alto se o ambiente estiver inválido.
 */
export class LlmConfig {
  private static instance: LlmConfig;

  public readonly values: LlmConfigValues;

  private constructor() {
    this.values = LlmConfig.load();
  }

  public static getInstance(): LlmConfig {
    if (!LlmConfig.instance) {
      LlmConfig.instance = new LlmConfig();
    }
    return LlmConfig.instance;
  }

  /** API key configurada para o provedor, ou `null` se ausente. */
  public apiKeyFor(provider: ProviderName): string | null {
    return this.values.apiKeys[provider];
  }

  private static load(): LlmConfigValues {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new LlmError(
        `Configuração de LLM inválida:\n${z.prettifyError(parsed.error)}`,
      );
    }

    const env = parsed.data;
    return {
      defaultProvider: env.LLM_DEFAULT_PROVIDER,
      defaultModel: env.LLM_DEFAULT_MODEL ?? null,
      defaultTemperature: env.LLM_DEFAULT_TEMPERATURE,
      defaultMaxTokens: env.LLM_DEFAULT_MAX_TOKENS ?? null,
      apiKeys: {
        openai: env.OPENAI_API_KEY ?? null,
        anthropic: env.ANTHROPIC_API_KEY ?? null,
        "google-genai": env.GOOGLE_API_KEY ?? null,
        deepseek: env.DEEPSEEK_API_KEY ?? null,
      },
    };
  }
}

export const llmConfig = LlmConfig.getInstance();
