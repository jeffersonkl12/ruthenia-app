import { etaDynamicLayer } from "../dynamic.layer";

/**
 * Quarta camada do system prompt: dados gerais da party — nome, líder do
 * grupo (sempre o personagem do jogador, nunca um NPC) e NPCs do grupo.
 * Dinâmica — só aparece quando `ctx.party` está presente; o `chat.controller`
 * o preenche via `promptContextService.buildContext`, mas renderiza vazia
 * enquanto não houver party com líder resolvido.
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
