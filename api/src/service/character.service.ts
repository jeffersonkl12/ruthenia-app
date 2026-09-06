import {
  insertCharacterSchema,
  updateCharacterSchema,
  type Character,
} from "@/database/schemas/character.schema";
import { characterRepository } from "@/repository/character.repository";
import { partyRepository } from "@/repository/party.repository";
import type { Service } from "./service.interface";

export interface CharacterService extends Service<Character> {
  findByKingdomId(kingdomId: number): Promise<Character[]>;
}

async function findAll(): Promise<Character[]> {
  return characterRepository.findAll();
}

async function findById(id: number): Promise<Character | undefined> {
  return characterRepository.findById(id);
}

async function findByKingdomId(kingdomId: number): Promise<Character[]> {
  return characterRepository.findByKingdomId(kingdomId);
}

async function create(data: unknown): Promise<Character> {
  const parsed = insertCharacterSchema.parse(data);
  return characterRepository.create(parsed);
}

async function update(
  id: number,
  data: unknown,
): Promise<Character | undefined> {
  const before = await characterRepository.findById(id);
  const parsed = updateCharacterSchema.parse(data);
  const after = await characterRepository.update(id, parsed);

  if (before?.partyId && before.partyId !== after?.partyId) {
    await deletePartyIfEmpty(before.partyId);
  }

  return after;
}

async function remove(id: number): Promise<boolean> {
  const before = await characterRepository.findById(id);
  const removed = await characterRepository.remove(id);

  if (removed && before?.partyId) {
    await deletePartyIfEmpty(before.partyId);
  }

  return removed;
}

async function deletePartyIfEmpty(partyId: number): Promise<void> {
  const remainingMembers = await characterRepository.findByPartyId(partyId);
  if (remainingMembers.length === 0) {
    await partyRepository.remove(partyId);
  }
}

export const characterService: CharacterService = {
  findAll,
  findById,
  findByKingdomId,
  create,
  update,
  remove,
};
