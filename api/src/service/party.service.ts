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

  return characterService.update(characterId, { partyId: null });
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
};
