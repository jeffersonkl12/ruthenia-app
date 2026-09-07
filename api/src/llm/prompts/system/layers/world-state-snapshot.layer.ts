import { etaDynamicLayer } from "../dynamic.layer";

/**
 * Terceira camada do system prompt: retrato do estado atual do mundo (sessão,
 * localização e região correntes). Dinâmica — só aparece quando quem chama
 * `systemPromptBuilder.build(ctx)` fornece esses dados em `ctx`; hoje nenhum
 * call site faz isso ainda, então a camada renderiza vazia.
 */
export const worldStateSnapshotLayer = etaDynamicLayer({
  id: "world-state-snapshot",
  template: "world-state-snapshot",
  select: (ctx) => {
    const { session, location, region } = ctx;
    if (!session && !location && !region) return null;
    return { session, location, region };
  },
});
