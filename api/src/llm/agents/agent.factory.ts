import { modelFactory } from "@/llm/providers";
import { BASE_SYSTEM_PROMPT } from "@/llm/prompts";
import { BaseAgent } from "./base.agent";
import type { Agent, AgentSpec } from "./agent.interface";

/**
 * Fábrica de agentes.
 *
 * Faz a fiação assíncrona que o construtor do {@link BaseAgent} não pode fazer:
 * cria o chat model via {@link modelFactory} e injeta no agente. É o ponto de
 * entrada para as camadas superiores criarem agentes dinâmicos.
 */
export class AgentFactory {
  private static instance: AgentFactory;

  private constructor() {}

  public static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }

  /** Cria um agente a partir da especificação. */
  public async create(spec: AgentSpec): Promise<Agent> {
    const model = await modelFactory.create(spec.model ?? {});
    return new BaseAgent(spec, model);
  }

  /**
   * Atalho: agente base com o prompt de sistema padrão.
   * Útil como ponto de partida enquanto o narrador não existe.
   */
  public async createDefault(
    overrides: Partial<AgentSpec> = {},
  ): Promise<Agent> {
    return this.create({
      name: "ruthenia-base",
      systemPrompt: BASE_SYSTEM_PROMPT.render(),
      ...overrides,
    });
  }
}

export const agentFactory = AgentFactory.getInstance();
