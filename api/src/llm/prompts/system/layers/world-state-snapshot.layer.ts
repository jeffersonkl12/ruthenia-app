import { etaDynamicLayer } from "../dynamic.layer";

/**
 * Terceira camada do system prompt: retrato do estado atual do mundo (reino,
 * região e localização correntes). Dinâmica — só aparece quando `ctx` traz
 * esses dados; o `chat.controller` os fornece via
 * `promptContextService.buildContext`, mas renderiza vazia quando não há
 * sessão/posição resolvida.
 */
export const worldStateSnapshotLayer = etaDynamicLayer({
  id: "world-state-snapshot",
  template: "world-state-snapshot",
  select: (ctx) => {
    const { kingdom, location, region } = ctx;
    if (!kingdom && !location && !region) return null;
    return { kingdom, location, region };
  },
});
