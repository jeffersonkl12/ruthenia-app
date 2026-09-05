import {
  coerceMessageLikeToMessage,
  SystemMessage,
  type BaseMessage,
  type BaseMessageChunk,
} from "@langchain/core/messages";
import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { AgentInvocationError, LlmError } from "@/llm/errors";
import type { ChatModel } from "@/llm/providers";
import {
  AgentStateAnnotation,
  type AgentState,
  type AgentStateUpdate,
} from "./agent.state";
import type {
  Agent,
  AgentInput,
  AgentResult,
  AgentSpec,
  AgentStreamChunk,
} from "./agent.interface";

/**
 * Agente base: um grafo LangGraph de nó único.
 *
 * ```
 * START ──▶ agent (chama o modelo) ──▶ END
 * ```
 *
 * É deliberadamente mínimo. A evolução (ferramentas, roteamento condicional,
 * subgrafos do narrador) acontece adicionando nós e arestas neste grafo, sem
 * alterar o contrato {@link Agent}.
 */
export class BaseAgent implements Agent {
  public readonly name: string;

  /** Grafo já compilado; tipo inferido do `compile()` no construtor. */
  private readonly graph;

  constructor(
    private readonly spec: AgentSpec,
    private readonly model: ChatModel,
  ) {
    this.name = spec.name;

    this.graph = new StateGraph(AgentStateAnnotation)
      .addNode("agent", (state) => this.callModel(state))
      .addEdge(START, "agent")
      .addEdge("agent", END)
      .compile({
        checkpointer: spec.enableMemory ? new MemorySaver() : undefined,
      });
  }

  /** Nó `agent`: injeta o system prompt e chama o modelo. */
  private async callModel(state: AgentState): Promise<AgentStateUpdate> {
    const history = state.systemPrompt
      ? [new SystemMessage(state.systemPrompt), ...state.messages]
      : state.messages;

    const response = await this.model.invoke(history);
    return { messages: [response] };
  }

  private buildInitialState(input: AgentInput): AgentStateUpdate {
    return {
      messages: input.messages.map(coerceMessageLikeToMessage),
      systemPrompt: this.spec.systemPrompt ?? "",
      metadata: input.metadata ?? {},
    };
  }

  private runConfig(input: AgentInput) {
    return {
      configurable: { thread_id: input.threadId ?? this.spec.name },
    };
  }

  public async invoke(input: AgentInput): Promise<AgentResult> {
    try {
      const state = (await this.graph.invoke(
        this.buildInitialState(input),
        this.runConfig(input),
      )) as AgentState;

      const messages = state.messages;
      const last: BaseMessage | undefined = messages[messages.length - 1];

      return { content: last?.text ?? "", messages, state };
    } catch (cause) {
      if (cause instanceof LlmError) throw cause;
      throw new AgentInvocationError(
        `Falha ao executar o agente "${this.name}".`,
        { cause },
      );
    }
  }

  public async *stream(input: AgentInput): AsyncGenerator<AgentStreamChunk> {
    let stream: AsyncIterable<[BaseMessageChunk, unknown]>;
    try {
      stream = (await this.graph.stream(this.buildInitialState(input), {
        ...this.runConfig(input),
        streamMode: "messages",
      })) as AsyncIterable<[BaseMessageChunk, unknown]>;
    } catch (cause) {
      if (cause instanceof LlmError) throw cause;
      throw new AgentInvocationError(
        `Falha ao iniciar o stream do agente "${this.name}".`,
        { cause },
      );
    }

    for await (const [chunk] of stream) {
      const text = chunk?.text ?? "";
      if (text) yield { content: text };
    }
  }
}
