import type {
  PartyCharacterSummary,
  SceneContext,
  SceneMode,
  SystemPromptContext,
} from "@/llm/prompts/system/layer.interface";
import type { Character } from "@/database/schemas/character.schema";
import type { Party } from "@/database/schemas/party.schema";
import type { Scene } from "@/database/schemas/scene.schema";
import type { Session } from "@/database/schemas/session.schema";
import { sessionService } from "./session.service";
import { partyService } from "./party.service";
import { characterService } from "./character.service";
import { characterRepository } from "@/repository/character.repository";
import { locationService } from "./location.service";
import { regionService } from "./region.service";
import { kingdomService } from "./kingdom.service";
import { sceneService } from "./scene.service";

type WorldStateSnapshotContext = Pick<
  SystemPromptContext,
  "kingdom" | "location" | "region"
>;

type PartyCharacterContext = Pick<SystemPromptContext, "party">;

type SceneContextSlice = Pick<SystemPromptContext, "scene">;

export interface PromptContextService {
  /**
   * Monta o {@link SystemPromptContext} completo de uma sessão — o objeto que
   * `systemPromptBuilder.build(ctx)` consome para renderizar todas as camadas
   * `dynamic` (`world-state-snapshot`, `party-character-context`,
   * `scene-context`). `dm-secrets` fica de fora: ainda não há storage pra ele.
   *
   * A sessão/party/líder são resolvidos uma única vez e reaproveitados pelos
   * três recortes.
   */
  buildContext(sessionId: number): Promise<SystemPromptContext>;
  /**
   * Recorte consumido por `world-state-snapshot`: reino da sessão e
   * região/localização atuais (derivadas da posição do líder da party).
   */
  buildWorldStateSnapshot(
    sessionId: number,
  ): Promise<WorldStateSnapshotContext>;
  /**
   * Recorte consumido por `party-character-context`: nome da party, líder e
   * NPCs do grupo.
   */
  buildPartyCharacterContext(sessionId: number): Promise<PartyCharacterContext>;
  /**
   * Recorte consumido por `scene-context`: a cena única do jogo (nome,
   * descrição, modo), o nome/descrição da sessão e os NPCs presentes na
   * mesma localização que o grupo.
   */
  buildSceneContext(sessionId: number): Promise<SceneContextSlice>;
}

/** Estado da sessão resolvido uma vez e compartilhado entre os builders. */
interface ResolvedSession {
  session: Session;
  /**
   * Party "ativa" da sessão. Uma sessão não referencia uma party direto, só
   * um kingdom (`sessions.kingdomId`); assumimos a primeira party do kingdom
   * — simplificação razoável hoje (single-player, um kingdom clonado por
   * `worldService.startCampaign` carrega uma única party), não uma regra do
   * schema.
   */
  party: Party | undefined;
  /** Líder da party (o personagem do jogador), se já existir. */
  leader: Character | undefined;
}

async function resolveSession(sessionId: number): Promise<ResolvedSession> {
  const session = await sessionService.findById(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const [party] = await partyService.findByKingdomId(session.kingdomId);
  const leader = party?.leaderId
    ? await characterService.findById(party.leaderId)
    : undefined;

  return { session, party, leader };
}

async function worldStateFrom({
  session,
  leader,
}: ResolvedSession): Promise<WorldStateSnapshotContext> {
  const ctx: WorldStateSnapshotContext = {};

  const kingdom = await kingdomService.findById(session.kingdomId);
  if (kingdom) {
    ctx.kingdom = { name: kingdom.name, status: kingdom.status };
  }

  if (leader?.currentRegionId) {
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

  if (leader?.currentLocationId) {
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

async function partyFrom({
  party,
  leader,
}: ResolvedSession): Promise<PartyCharacterContext> {
  if (!party || !leader) {
    return {};
  }

  const members = await characterRepository.findByPartyId(party.id);
  const npcs = members.filter((member) => member.id !== leader.id);

  return {
    party: {
      name: party.name,
      leader: toPartyCharacterSummary(leader),
      npcs: npcs.map(toPartyCharacterSummary),
    },
  };
}

/**
 * `scenes.mode` (`NARRATIVE | COMBAT`) → `SceneMode` do prompt
 * (`COMBAT | DIALOGUE | EXPLORATION`). Enquanto os dois vocabulários não
 * são unificados, `NARRATIVE` é tratado como `EXPLORATION`.
 */
const SCENE_MODE_BY_DB: Record<Scene["mode"], SceneMode> = {
  NARRATIVE: "EXPLORATION",
  COMBAT: "COMBAT",
};

async function sceneFrom({
  session,
  party,
  leader,
}: ResolvedSession): Promise<SceneContextSlice> {
  // O jogo tem uma única cena, atualizada continuamente — pegamos a primeira
  // (e única) linha de `scenes`.
  const [scene] = await sceneService.findAll();
  if (!scene) {
    return {};
  }

  const ctx: SceneContext = {
    mode: SCENE_MODE_BY_DB[scene.mode],
    name: scene.name,
    description: scene.description,
    session: { name: session.name, description: session.description },
  };

  if (leader?.currentLocationId) {
    const present = await characterRepository.findByLocationId(
      leader.currentLocationId,
    );
    // Só NPCs "ambiente": tira o próprio líder e quem já está na party
    // (esses aparecem em `party-character-context`).
    const nearby = present.filter(
      (character) =>
        character.id !== leader.id && character.partyId !== party?.id,
    );
    if (nearby.length) {
      ctx.nearbyNpcs = nearby.map((character) => ({
        name: character.name,
        occupation: character.occupation,
        appearance: character.appearance,
      }));
    }
  }

  return { scene: ctx };
}

async function buildContext(
  sessionId: number,
): Promise<SystemPromptContext> {
  const resolved = await resolveSession(sessionId);

  const [worldState, party, scene] = await Promise.all([
    worldStateFrom(resolved),
    partyFrom(resolved),
    sceneFrom(resolved),
  ]);

  return { ...worldState, ...party, ...scene };
}

async function buildWorldStateSnapshot(
  sessionId: number,
): Promise<WorldStateSnapshotContext> {
  return worldStateFrom(await resolveSession(sessionId));
}

async function buildPartyCharacterContext(
  sessionId: number,
): Promise<PartyCharacterContext> {
  return partyFrom(await resolveSession(sessionId));
}

async function buildSceneContext(
  sessionId: number,
): Promise<SceneContextSlice> {
  return sceneFrom(await resolveSession(sessionId));
}

export const promptContextService: PromptContextService = {
  buildContext,
  buildWorldStateSnapshot,
  buildPartyCharacterContext,
  buildSceneContext,
};
