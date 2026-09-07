import {
  coerceMessageLikeToMessage,
  HumanMessage,
  RemoveMessage,
  SystemMessage,
  type BaseMessage,
  type BaseMessageChunk,
} from "@langchain/core/messages";
import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { AgentInvocationError, LlmError } from "@/llm/errors";
import type { ChatModel } from "@/llm/providers";
import { SUMMARIZE_PROMPT } from "@/llm/prompts";
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
 * Quantas mensagens anteriores (além da atual) ficam de fora da sumarização e
 * são enviadas ao modelo na íntegra. Tudo o que passa disso é condensado em
 * `state.summary` pelo nó `summarize` — ver {@link BaseAgent.summarizeHistory}.
 */
const RECENT_MESSAGE_WINDOW = 10;

/** Rótulo legível do papel de uma mensagem, para o texto passado à sumarização. */
function roleLabel(message: BaseMessage): string {
  switch (message.getType()) {
    case "human":
      return "Usuário";
    case "ai":
      return "Assistente";
    case "system":
      return "Sistema";
    default:
      return message.getType();
  }
}

/**
 * Agente base: um grafo LangGraph de dois nós.
 *
 * ```
 * START ──▶ summarize (condensa histórico antigo) ──▶ agent (chama o modelo) ──▶ END
 * ```
 *
 * `summarize` mantém a janela de contexto enviada ao modelo limitada às últimas
 * {@link RECENT_MESSAGE_WINDOW} mensagens anteriores mais a atual: tudo o que
 * ultrapassa essa janela é incorporado a `state.summary` (via LLM) e removido de
 * `state.messages` com `RemoveMessage`, para que a conversa não cresça sem
 * limite — nem no que é reenviado a cada chamada, nem no que fica persistido
 * quando o checkpointer está ligado.
 *
 * Fora isso, o grafo é deliberadamente mínimo. A evolução (ferramentas,
 * roteamento condicional, subgrafos do narrador) acontece adicionando nós e
 * arestas, sem alterar o contrato {@link Agent}.
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
      .addNode("summarize", (state) => this.summarizeHistory(state))
      .addNode("agent", (state) => this.callModel(state))
      .addEdge(START, "summarize")
      .addEdge("summarize", "agent")
      .addEdge("agent", END)
      .compile({
        checkpointer: spec.enableMemory ? new MemorySaver() : undefined,
      });
  }

  /**
   * Nó `summarize`: se houver mais que {@link RECENT_MESSAGE_WINDOW} mensagens
   * antes da atual, resume as mais antigas para `state.summary` e as remove de
   * `state.messages`. Não faz nada (retorna `{}`) quando a janela ainda cabe.
   */
  private async summarizeHistory(state: AgentState): Promise<AgentStateUpdate> {
    const { messages } = state;
    const keepFrom = messages.length - (RECENT_MESSAGE_WINDOW + 1);
    if (keepFrom <= 0) {
      return {};
    }

    const toArchive = messages.slice(0, keepFrom);
    const summary = await this.summarize(toArchive, state.summary);

    return {
      summary,
      messages: toArchive.map(
        (message) => new RemoveMessage({ id: message.id as string }),
      ),
    };
  }

  /** Chama o modelo para condensar `messages` no resumo contínuo da conversa. */
  private async summarize(
    messages: BaseMessage[],
    previousSummary: string,
  ): Promise<string> {
    const transcript = messages
      .map((message) => `${roleLabel(message)}: ${message.text}`)
      .join("\n");

    const prompt = SUMMARIZE_PROMPT.render({
      previousSummary: previousSummary
        ? `Resumo anterior:\n${previousSummary}`
        : "",
      transcript,
    });

    const response = await this.model.invoke([new HumanMessage(prompt)]);
    return response.text.trim();
  }

  /** Nó `agent`: injeta o system prompt + resumo e chama o modelo. */
  private async callModel(state: AgentState): Promise<AgentStateUpdate> {
    const history: BaseMessage[] = [];
    if (state.systemPrompt) {
      history.push(new SystemMessage(state.systemPrompt));
    }
    if (state.summary) {
      history.push(
        new SystemMessage(`Resumo da conversa até aqui:\n${state.summary}`),
      );
    }
    history.push(...state.messages);

    const response = await this.model.invoke(history);
    return { messages: [response] };
  }

  private buildInitialState(input: AgentInput): AgentStateUpdate {
    return {
      messages: input.messages.map(coerceMessageLikeToMessage),
      systemPrompt: input.systemPrompt ?? this.spec.systemPrompt ?? "",
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

    for await (const [chunk, metadata] of stream) {
      // O nó `summarize` também chama o modelo; sem este filtro seus tokens
      // vazariam para o stream junto com a resposta real do nó `agent`.
      const nodeName = (metadata as { langgraph_node?: string } | undefined)
        ?.langgraph_node;
      if (nodeName && nodeName !== "agent") continue;

      const text = chunk?.text ?? "";
      if (text) yield { content: text };
    }
  }
}
