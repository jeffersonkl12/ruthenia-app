import type {
  PartyCharacterSummary,
  SystemPromptContext,
} from "@/llm/prompts/system/layer.interface";
import type { Character } from "@/database/schemas/character.schema";
import type { Party } from "@/database/schemas/party.schema";
import type { Session } from "@/database/schemas/session.schema";
import { sessionService } from "./session.service";
import { partyService } from "./party.service";
import { characterService } from "./character.service";
import { characterRepository } from "@/repository/character.repository";
import { locationService } from "./location.service";
import { regionService } from "./region.service";
import { kingdomService } from "./kingdom.service";

type WorldStateSnapshotContext = Pick<
  SystemPromptContext,
  "kingdom" | "location" | "region"
>;

type PartyCharacterContext = Pick<SystemPromptContext, "party">;

export interface PromptContextService {
  /**
   * Monta o recorte de {@link SystemPromptContext} consumido pela camada
   * `world-state-snapshot`: reino da sessão e localização/região atuais.
   */
  buildWorldStateSnapshot(
    sessionId: number,
  ): Promise<WorldStateSnapshotContext>;
  /**
   * Monta o recorte de {@link SystemPromptContext} consumido pela camada
   * `party-character-context`: nome da party, líder e NPCs.
   */
  buildPartyCharacterContext(sessionId: number): Promise<PartyCharacterContext>;
}

/**
 * Resolve a sessão e a party "ativa" dela.
 *
 * Uma sessão não referencia uma party diretamente, só um kingdom
 * (`sessions.kingdomId`); assumimos a primeira party encontrada para esse
 * kingdom como a party ativa da sessão — simplificação razoável hoje (jogo
 * single-player, um kingdom clonado por `worldService.startCampaign`
 * normalmente carrega uma única party), mas não é uma regra imposta pelo
 * schema.
 */
async function resolveSessionAndParty(
  sessionId: number,
): Promise<{ session: Session; party: Party | undefined }> {
  const session = await sessionService.findById(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const [party] = await partyService.findByKingdomId(session.kingdomId);
  return { session, party };
}

async function buildWorldStateSnapshot(
  sessionId: number,
): Promise<WorldStateSnapshotContext> {
  const { session, party } = await resolveSessionAndParty(sessionId);

  const ctx: WorldStateSnapshotContext = {};

  const kingdom = await kingdomService.findById(session.kingdomId);
  if (kingdom) {
    ctx.kingdom = { name: kingdom.name, status: kingdom.status };
  }

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
      ctx.region = {
        name: region.name,
        description: region.description,
        biome: region.biome,
        status: region.status,
        wealth: region.wealth,
        infrastructure: region.infrastructure,
      };
    }
  }

  if (leader.currentLocationId) {
    const location = await locationService.findById(leader.currentLocationId);
    if (location) {
      ctx.location = {
        name: location.name,
        type: location.type,
        description: location.description,
      };
    }
  }

  return ctx;
}

function toPartyCharacterSummary(character: Character): PartyCharacterSummary {
  return {
    name: character.name,
    occupation: character.occupation,
    age: character.age,
    gender: character.gender,
    race: character.race,
    socialStatus: character.socialStatus,
    healthStatus: character.healthStatus,
    personality: character.personality,
    appearance: character.appearance,
    background: character.background,
  };
}

async function buildPartyCharacterContext(
  sessionId: number,
): Promise<PartyCharacterContext> {
  const { party } = await resolveSessionAndParty(sessionId);
  if (!party?.leaderId) {
    return {};
  }

  const members = await characterRepository.findByPartyId(party.id);
  const leader = members.find((member) => member.id === party.leaderId);
  if (!leader) {
    return {};
  }

  const npcs = members.filter((member) => member.id !== party.leaderId);

  return {
    party: {
      name: party.name,
      leader: toPartyCharacterSummary(leader),
      npcs: npcs.map(toPartyCharacterSummary),
    },
  };
}

export const promptContextService: PromptContextService = {
  buildWorldStateSnapshot,
  buildPartyCharacterContext,
};
