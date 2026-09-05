import type { initChatModel } from "langchain/chat_models/universal";
import type { ProviderName } from "@/llm/config";

/**
 * Tipo do chat model retornado pela fábrica. É o retorno cru do `initChatModel`
 * (um `ConfigurableModel`), que expõe `invoke`/`stream`/`bindTools` e serve
 * tanto para os agentes atuais quanto para reconfiguração em runtime no futuro.
 */
export type ChatModel = Awaited<ReturnType<typeof initChatModel>>;

/**
 * Metadados de um provedor no catálogo. Descreve *como* falar com ele sem
 * acoplar o resto do código ao SDK específico.
 */
export interface ProviderMetadata {
  /** Nome canônico (chave do registry). */
  name: ProviderName;
  /** Rótulo legível para UI/logs. */
  label: string;
  /** Apelidos aceitos na resolução (ex.: "claude", "chatgpt", "gemini"). */
  aliases: string[];
  /** String passada em `initChatModel({ modelProvider })`. */
  initChatModelProvider: string;
  /** Nome da variável de ambiente que carrega a API key deste provedor. */
  envVar: string;
  /** Modelo usado quando a requisição não especifica um. */
  defaultModel: string;
  /** Lista curada de modelos recomendados (não é uma restrição — ver registry). */
  recommendedModels: string[];
}

/**
 * Requisição de modelo feita pelas camadas superiores. Todos os campos são
 * opcionais: o que faltar é preenchido a partir de `llmConfig` e do catálogo.
 */
export interface ModelRequest {
  /** Nome canônico ou apelido; default = `llmConfig.defaultProvider`. */
  provider?: ProviderName | string;
  /** Qualquer string de modelo; default = modelo padrão do provedor. */
  model?: string;
  /** Temperatura de amostragem (0–2). */
  temperature?: number;
  /** Teto de tokens de saída. */
  maxTokens?: number;
  /** Override explícito da API key (tem prioridade sobre o ambiente). */
  apiKey?: string;
}

/** Requisição de modelo após merge com defaults e validação. */
export interface ResolvedModelRequest {
  provider: ProviderName;
  model: string;
  temperature: number;
  maxTokens: number | null;
  apiKey: string;
}
