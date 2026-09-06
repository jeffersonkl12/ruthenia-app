import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

/**
 * Estado compartilhado do grafo do agente.
 *
 * Estende o `MessagesAnnotation` (canal `messages` com reducer de append,
 * que também entende `RemoveMessage` para remoção por id) com:
 * - `systemPrompt`: instrução de sistema da sessão (sobrescrita a cada update);
 * - `summary`: resumo contínuo das mensagens que já saíram da janela recente
 *   (ver {@link BaseAgent}, que a mantém atualizada e trunca `messages`);
 * - `metadata`: bolsa de contexto arbitrário, acumulada via merge raso.
 *
 * Novos canais (ferramentas, cena atual, memória do mundo) entram aqui à medida
 * que o agente evolui, sem quebrar os nós existentes.
 */
export const AgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  systemPrompt: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  summary: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  metadata: Annotation<Record<string, unknown>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
export type AgentStateUpdate = typeof AgentStateAnnotation.Update;
