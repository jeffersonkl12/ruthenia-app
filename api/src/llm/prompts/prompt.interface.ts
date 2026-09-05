/** Variáveis de interpolação de um prompt (`{{chave}}`). */
export type PromptVars = Record<string, string | number | boolean>;

/**
 * Unidade reutilizável de prompt. Um `PromptModule` sabe se renderizar a partir
 * de um template com placeholders `{{chave}}`, mantendo o texto versionável e
 * testável isoladamente.
 */
export interface PromptModule {
  /** Identificador estável (ex.: "system.base", "system.narrator"). */
  readonly id: string;
  /** Template cru, com placeholders `{{chave}}`. */
  readonly template: string;
  /** Renderiza o template aplicando as variáveis fornecidas. */
  render(vars?: PromptVars): string;
}
