import { llmConfig, LlmConfig } from "./config";
import { modelFactory, providerRegistry } from "./providers";
import { agentFactory } from "./agents";

/**
 * Facade do ecossistema de LLM. Reúne os singletons das subcamadas num único
 * ponto de acesso ergonômico:
 *
 * ```ts
 * import { llm } from "@/llm";
 * const agent = await llm.agents.create({ name: "x", model: { provider: "claude" } });
 * ```
 */
export class Llm {
  private static instance: Llm;

  public readonly config: LlmConfig = llmConfig;
  public readonly providers = providerRegistry;
  public readonly models = modelFactory;
  public readonly agents = agentFactory;

  private constructor() {}

  public static getInstance(): Llm {
    if (!Llm.instance) {
      Llm.instance = new Llm();
    }
    return Llm.instance;
  }
}

export const llm = Llm.getInstance();
