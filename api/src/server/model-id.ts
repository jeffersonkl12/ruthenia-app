/**
 * Traduz o `model` recebido da LibreChat (ex.: `"anthropic/claude-sonnet-5"`)
 * no par provedor/modelo. Sem `/`, o texto inteiro é o modelo e o provedor
 * fica a cargo do default do `llmConfig`.
 *
 * O nome do modelo pode conter `/` (ex.: `"openrouter/auto"`), por isso o split
 * é só no **primeiro** separador.
 */
export function parseModelId(id: string): { provider?: string; model: string } {
  const trimmed = id.trim();
  const slash = trimmed.indexOf("/");
  if (slash === -1) {
    return { model: trimmed };
  }
  return {
    provider: trimmed.slice(0, slash),
    model: trimmed.slice(slash + 1),
  };
}
