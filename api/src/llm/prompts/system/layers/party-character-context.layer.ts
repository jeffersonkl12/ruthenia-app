import { etaDynamicLayer } from "../dynamic.layer";

/**
 * Quarta camada do system prompt: dados gerais da party — nome, personagens
 * jogáveis e NPCs do grupo. Dinâmica — só aparece quando `ctx.party` é
 * fornecido a `systemPromptBuilder.build(ctx)`; hoje nenhum call site faz
 * isso ainda, então a camada renderiza vazia.
 */
export const partyCharacterContextLayer = etaDynamicLayer({
  id: "party-character-context",
  template: "party-character-context",
  select: (ctx) =>
    ctx.party
      ? {
          name: ctx.party.name,
          characters: ctx.party.characters,
          npcs: ctx.party.npcs,
        }
      : null,
});
