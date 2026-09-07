import { etaDynamicLayer } from "../dynamic.layer";

/**
 * Quinta camada do system prompt: estado completo da cena atual — modo
 * (combate/diálogo/exploração) e detalhes específicos dele. Dinâmica — só
 * aparece quando `ctx.scene` é fornecido a `systemPromptBuilder.build(ctx)`;
 * hoje nenhum call site faz isso ainda, então a camada renderiza vazia.
 */
export const sceneContextLayer = etaDynamicLayer({
  id: "scene-context",
  template: "scene-context",
  select: (ctx) => (ctx.scene ? { ...ctx.scene } : null),
});
