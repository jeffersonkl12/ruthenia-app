import { initChatModel } from "langchain/chat_models/universal";
import { llmConfig } from "@/llm/config";
import { ModelCreationError } from "@/llm/errors";
import { providerRegistry } from "./provider.registry";
import type {
  ChatModel,
  ModelRequest,
  ResolvedModelRequest,
} from "./provider.interface";

/**
 * Fábrica de chat models.
 *
 * Único ponto do sistema acoplado aos SDKs de provedor: recebe uma
 * {@link ModelRequest} agnóstica, resolve defaults via `llmConfig` +
 * `providerRegistry` e delega ao `initChatModel` da LangChain a instanciação
 * lazy do pacote correto (`@langchain/openai`, `@langchain/anthropic`, ...).
 */
export class ModelFactory {
  private static instance: ModelFactory;

  private constructor() {}

  public static getInstance(): ModelFactory {
    if (!ModelFactory.instance) {
      ModelFactory.instance = new ModelFactory();
    }
    return ModelFactory.instance;
  }

  /** Faz o merge da requisição com os defaults e valida a credencial. */
  public resolve(request: ModelRequest = {}): ResolvedModelRequest {
    const providerInput = request.provider ?? llmConfig.values.defaultProvider;
    const { provider, model } = providerRegistry.resolveModel(
      providerInput,
      request.model ?? llmConfig.values.defaultModel ?? undefined,
    );

    const apiKey = providerRegistry.assertConfigured(provider, request.apiKey);

    return {
      provider,
      model,
      temperature: request.temperature ?? llmConfig.values.defaultTemperature,
      maxTokens: request.maxTokens ?? llmConfig.values.defaultMaxTokens,
      apiKey,
    };
  }

  /** Instancia o chat model pronto para uso nos agentes/grafos. */
  public async create(request: ModelRequest = {}): Promise<ChatModel> {
    const resolved = this.resolve(request);
    const meta = providerRegistry.get(resolved.provider);

    try {
      return await initChatModel(resolved.model, {
        modelProvider: meta.initChatModelProvider,
        temperature: resolved.temperature,
        maxTokens: resolved.maxTokens ?? undefined,
        apiKey: resolved.apiKey,
      });
    } catch (cause) {
      throw new ModelCreationError(
        `Falha ao criar o modelo ${resolved.provider}:${resolved.model}.`,
        { cause },
      );
    }
  }
}

export const modelFactory = ModelFactory.getInstance();
