import { etaDynamicLayer } from "../dynamic.layer";

/**
 * Terceira camada do system prompt: retrato do estado atual do mundo (sessão,
 * cena, localização e região correntes). Dinâmica — só aparece quando quem
 * chama `systemPromptBuilder.build(ctx)` fornece esses dados em `ctx`; hoje
 * nenhum call site faz isso ainda, então a camada renderiza vazia.
 */
export const worldStateSnapshotLayer = etaDynamicLayer({
  id: "world-state-snapshot",
  template: "world-state-snapshot",
  select: (ctx) => {
    const { session, scene, location, region } = ctx;
    if (!session && !scene && !location && !region) return null;
    return { session, scene, location, region };
  },
});
