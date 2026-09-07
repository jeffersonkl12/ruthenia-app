import { etaDynamicLayer } from "../dynamic.layer";

/**
 * Quarta camada do system prompt: dados gerais da party — nome, líder do
 * grupo (sempre o personagem do jogador, nunca um NPC) e NPCs do grupo.
 * Dinâmica — só aparece quando `ctx.party` é fornecido a
 * `systemPromptBuilder.build(ctx)`; hoje nenhum call site faz isso ainda,
 * então a camada renderiza vazia.
 */
export const partyCharacterContextLayer = etaDynamicLayer({
  id: "party-character-context",
  template: "party-character-context",
  select: (ctx) =>
    ctx.party
      ? {
          name: ctx.party.name,
          leader: ctx.party.leader,
          npcs: ctx.party.npcs,
        }
      : null,
});
