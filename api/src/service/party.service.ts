import {
  insertPartySchema,
  updatePartySchema,
  type Party,
} from "@/database/schemas/party.schema";
import type { Character } from "@/database/schemas/character.schema";
import { partyRepository } from "@/repository/party.repository";
import { characterRepository } from "@/repository/character.repository";
import { characterService } from "./character.service";
import type { Service } from "./service.interface";

export interface PartyService extends Service<Party> {
  addMember(
    partyId: number,
    characterId: number,
  ): Promise<Character | undefined>;
  removeMember(
    partyId: number,
    characterId: number,
  ): Promise<Character | undefined>;
  findByKingdomId(kingdomId: number): Promise<Party[]>;
  /**
   * Define o líder da party — sempre o personagem do jogador
   * (`isPlayer: true`), que já precisa ser membro da party.
   */
  setLeader(partyId: number, characterId: number): Promise<Party | undefined>;
}

async function findAll(): Promise<Party[]> {
  return partyRepository.findAll();
}

async function findById(id: number): Promise<Party | undefined> {
  return partyRepository.findById(id);
}

async function findByKingdomId(kingdomId: number): Promise<Party[]> {
  return partyRepository.findByKingdomId(kingdomId);
}

async function create(data: unknown): Promise<Party> {
  const parsed = insertPartySchema.parse(data);
  return partyRepository.create(parsed);
}

async function update(id: number, data: unknown): Promise<Party | undefined> {
  const parsed = updatePartySchema.parse(data);
  return partyRepository.update(id, parsed);
}

async function remove(id: number): Promise<boolean> {
  return partyRepository.remove(id);
}

async function addMember(
  partyId: number,
  characterId: number,
): Promise<Character | undefined> {
  const party = await partyRepository.findById(partyId);
  if (!party) {
    throw new Error(`Party ${partyId} not found`);
  }

  const character = await characterRepository.findById(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  if (character.isPlayer && party.leaderId && party.leaderId !== characterId) {
    throw new Error(
      `Party ${partyId} already has a leader (character ${party.leaderId}) — a party can only have one player character`,
    );
  }

  return characterService.update(characterId, { partyId });
}

async function removeMember(
  partyId: number,
  characterId: number,
): Promise<Character | undefined> {
  const character = await characterRepository.findById(characterId);
  if (!character || character.partyId !== partyId) {
    throw new Error(
      `Character ${characterId} is not a member of party ${partyId}`,
    );
  }

  const party = await partyRepository.findById(partyId);
  if (party?.leaderId === characterId) {
    throw new Error(
      `Character ${characterId} is the leader of party ${partyId} and cannot be removed as a member`,
    );
  }

  return characterService.update(characterId, { partyId: null });
}

async function setLeader(
  partyId: number,
  characterId: number,
): Promise<Party | undefined> {
  const party = await partyRepository.findById(partyId);
  if (!party) {
    throw new Error(`Party ${partyId} not found`);
  }

  const character = await characterRepository.findById(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  if (character.partyId !== partyId) {
    throw new Error(
      `Character ${characterId} is not a member of party ${partyId}`,
    );
  }

  if (!character.isPlayer) {
    throw new Error(
      `Character ${characterId} is not a player character — only the player's character can lead a party`,
    );
  }

  return partyRepository.update(partyId, { leaderId: characterId });
}

export const partyService: PartyService = {
  findAll,
  findById,
  findByKingdomId,
  create,
  update,
  remove,
  addMember,
  removeMember,
  setLeader,
};
