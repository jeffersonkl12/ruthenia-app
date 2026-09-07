import type { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import type { ModelRequest } from "@/llm/providers";
import type { AgentState } from "./agent.state";

/**
 * Especificação declarativa de um agente. É o "molde" que a
 * {@link AgentFactory} usa para montar um {@link Agent} concreto.
 */
export interface AgentSpec {
  /** Nome curto do agente (usado em logs e como thread_id padrão). */
  name: string;
  /** Seleção dinâmica de provedor/modelo/parâmetros. */
  model?: ModelRequest;
  /** Instrução de sistema aplicada a toda invocação. */
  systemPrompt?: string;
  /** Liga o checkpointer em memória (histórico por `threadId`). */
  enableMemory?: boolean;
}

/** Entrada de uma invocação do agente. */
export interface AgentInput {
  /** Mensagens da rodada (`{ role, content }` ou instâncias de `BaseMessage`). */
  messages: BaseMessageLike[];
  /**
   * Instrução de sistema desta rodada. Sobrescreve a do {@link AgentSpec}
   * (que fica só como fallback). É por invocação porque o system prompt do
   * jogo é remontado a cada mensagem a partir do estado do mundo, enquanto o
   * agente e seu grafo permanecem estáveis — ver `AgentPool`.
   */
  systemPrompt?: string;
  /** Identifica a conversa quando `enableMemory` está ativo. */
  threadId?: string;
  /** Metadados mesclados no estado do grafo. */
  metadata?: Record<string, unknown>;
}

/** Resultado de `Agent.invoke`. */
export interface AgentResult {
  /** Texto da resposta final do agente. */
  content: string;
  /** Histórico completo de mensagens após a execução. */
  messages: BaseMessage[];
  /** Estado bruto final do grafo (para depuração/inspeção). */
  state: AgentState;
}

/** Fragmento emitido por `Agent.stream`. */
export interface AgentStreamChunk {
  /** Pedaço de texto gerado pelo modelo. */
  content: string;
}

/**
 * Contrato estável de um agente, independente de como o grafo interno é
 * construído. As camadas superiores dependem só disto.
 */
export interface Agent {
  readonly name: string;
  invoke(input: AgentInput): Promise<AgentResult>;
  stream(input: AgentInput): AsyncGenerator<AgentStreamChunk>;
}
