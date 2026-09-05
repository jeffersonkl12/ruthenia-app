import { createHash } from "node:crypto";
import { agentFactory, type Agent, type ModelRequest } from "@/llm";

export interface PooledAgentSpec {
  model: ModelRequest;
  systemPrompt: string;
}

/**
 * Cache de agentes por (provedor + modelo + temperatura + system prompt).
 *
 * Compilar o grafo LangGraph e instanciar o chat model a cada requisição HTTP
 * seria desperdício — a LibreChat reenvia o histórico inteiro toda vez, mas a
 * configuração do agente muda pouco. O cache guarda a `Promise<Agent>` para que
 * requisições concorrentes com a mesma chave compartilhem a mesma criação.
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
          systemPrompt: spec.systemPrompt,
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

  private static keyOf({ model, systemPrompt }: PooledAgentSpec): string {
    const promptHash = createHash("sha1")
      .update(systemPrompt)
      .digest("hex")
      .slice(0, 12);
    return [
      model.provider ?? "default",
      model.model ?? "default",
      model.temperature ?? "default",
      model.maxTokens ?? "default",
      promptHash,
    ].join("|");
  }
}

export const agentPool = AgentPool.getInstance();
