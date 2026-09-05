/**
 * Erro base de todo o ecossistema de LLM/agentes.
 *
 * Centraliza a hierarquia para que as camadas superiores (HTTP, workers, CLI)
 * consigam distinguir falhas de domínio de LLM de qualquer outra falha com um
 * único `instanceof LlmError`.
 */
export class LlmError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    // `new.target` garante o nome correto mesmo nas subclasses.
    this.name = new.target.name;
  }
}

/** Provedor solicitado não existe no {@link ProviderRegistry}. */
export class UnknownProviderError extends LlmError {}

/** Provedor existe, mas não há API key configurada para ele. */
export class ProviderNotConfiguredError extends LlmError {}

/** Falha ao instanciar o chat model junto ao SDK do provedor. */
export class ModelCreationError extends LlmError {}

/** Falha durante a execução do grafo de um agente. */
export class AgentInvocationError extends LlmError {}
