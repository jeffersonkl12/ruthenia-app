import { agentFactory, type Agent, type ModelRequest } from "@/llm";

export interface PooledAgentSpec {
  model: ModelRequest;
}

/**
 * Cache de agentes por config de modelo (provedor + modelo + temperatura +
 * maxTokens).
 *
 * Compilar o grafo LangGraph e instanciar o chat model a cada requisição HTTP
 * seria desperdício. O grafo do `BaseAgent` **não depende do system prompt** —
 * este entra por invocação (`AgentInput.systemPrompt`), remontado a cada
 * mensagem a partir do estado do mundo. A única coisa que exige um agente novo
 * é a config do modelo, então a chave do cache é só ela: o keyspace fica
 * limitado ao punhado de combinações de modelo em uso, sem agentes fantasma.
 *
 * O cache guarda a `Promise<Agent>` para que requisições concorrentes com a
 * mesma chave compartilhem a mesma criação.
 */
export class AgentPool {
  private static instance: AgentPool;

  private readonly agents = new Map<string, Promise<Agent>>();

  private constructor() {}

  public static getInstance(): AgentPool {
    if (!AgentPool.instance) {
      AgentPool.instance = new AgentPool();
    }
    return AgentPool.instance;
  }

  public get(spec: PooledAgentSpec): Promise<Agent> {
    const key = AgentPool.keyOf(spec);
    let agent = this.agents.get(key);
    if (!agent) {
      agent = agentFactory
        .create({
          name: `librechat:${spec.model.provider ?? "default"}`,
          model: spec.model,
        })
        .catch((error: unknown) => {
          // Não deixa uma criação falha "grudar" no cache.
          this.agents.delete(key);
          throw error;
        });
      this.agents.set(key, agent);
    }
    return agent;
  }

  public clear(): void {
    this.agents.clear();
  }

  private static keyOf({ model }: PooledAgentSpec): string {
    return [
      model.provider ?? "default",
      model.model ?? "default",
      model.temperature ?? "default",
      model.maxTokens ?? "default",
    ].join("|");
  }
}

export const agentPool = AgentPool.getInstance();
