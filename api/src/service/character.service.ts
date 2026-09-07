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
  const parsed = updateCharacterSchema.parse(data);
  if ("partyId" in parsed) {
    await assertNotPartyLeader(id, "reassigned to a different party");
  }

  const before = await characterRepository.findById(id);
  const after = await characterRepository.update(id, parsed);

  if (before?.partyId && before.partyId !== after?.partyId) {
    await deletePartyIfEmpty(before.partyId);
  }

  return after;
}

async function remove(id: number): Promise<boolean> {
  await assertNotPartyLeader(id, "deleted");

  const before = await characterRepository.findById(id);
  const removed = await characterRepository.remove(id);

  if (removed && before?.partyId) {
    await deletePartyIfEmpty(before.partyId);
  }

  return removed;
}

/**
 * Impede editar/apagar um personagem que hoje é líder de uma party por essas
 * vias genéricas — trocar de líder ou desfazer uma party é responsabilidade
 * de `partyService`, não algo que deva acontecer como efeito colateral de
 * `characterService.update`/`remove`.
 */
async function assertNotPartyLeader(
  characterId: number,
  action: string,
): Promise<void> {
  const party = await partyRepository.findByLeaderId(characterId);
  if (party) {
    throw new Error(
      `Character ${characterId} is the leader of party ${party.id} and cannot be ${action}`,
    );
  }
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
