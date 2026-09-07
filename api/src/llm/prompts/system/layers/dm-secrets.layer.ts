import { etaDynamicLayer } from "../dynamic.layer";

/**
 * Sexta camada do system prompt: segredos e notas do mestre — meta-
 * informação que o jogador nunca deve saber diretamente. Dinâmica — só
 * aparece quando `ctx.dmSecrets` é fornecido a
 * `systemPromptBuilder.build(ctx)`; hoje nenhum call site faz isso ainda.
 */
export const dmSecretsLayer = etaDynamicLayer({
  id: "dm-secrets",
  template: "dm-secrets",
  select: (ctx) => (ctx.dmSecrets ? { ...ctx.dmSecrets } : null),
});
