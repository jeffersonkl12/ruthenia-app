import type { SystemPromptContext } from "@/llm/prompts/system/layer.interface";
import { sessionService } from "./session.service";
import { partyService } from "./party.service";
import { characterService } from "./character.service";
import { locationService } from "./location.service";
import { regionService } from "./region.service";

type WorldStateSnapshotContext = Pick<
  SystemPromptContext,
  "session" | "location" | "region"
>;

export interface PromptContextService {
  /**
   * Monta o recorte de {@link SystemPromptContext} consumido pela camada
   * `world-state-snapshot`: sessão, e localização/região atuais.
   */
  buildWorldStateSnapshot(
    sessionId: number,
  ): Promise<WorldStateSnapshotContext>;
}

/**
 * Localização/região "atual" não existe no nível de sessão nem de party — só
 * em `characters.currentLocationId`/`currentRegionId`. Por isso resolvemos a
 * partir do personagem líder da party da sessão. Uma sessão não referencia
 * uma party diretamente, só um kingdom (`sessions.kingdomId`); assumimos a
 * primeira party encontrada para esse kingdom como a party ativa da sessão —
 * simplificação razoável hoje (jogo single-player, um kingdom clonado por
 * `worldService.startCampaign` normalmente carrega uma única party), mas não
 * é uma regra imposta pelo schema.
 */
async function buildWorldStateSnapshot(
  sessionId: number,
): Promise<WorldStateSnapshotContext> {
  const session = await sessionService.findById(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const ctx: WorldStateSnapshotContext = {
    session: { name: session.name, mode: session.mode },
  };

  const [party] = await partyService.findByKingdomId(session.kingdomId);
  if (!party?.leaderId) {
    return ctx;
  }

  const leader = await characterService.findById(party.leaderId);
  if (!leader) {
    return ctx;
  }

  if (leader.currentRegionId) {
    const region = await regionService.findById(leader.currentRegionId);
    if (region) {
      ctx.region = { name: region.name, biome: region.biome };
    }
  }

  if (leader.currentLocationId) {
    const location = await locationService.findById(leader.currentLocationId);
    if (location) {
      ctx.location = { name: location.name, type: location.type };
    }
  }

  return ctx;
}

export const promptContextService: PromptContextService = {
  buildWorldStateSnapshot,
};
