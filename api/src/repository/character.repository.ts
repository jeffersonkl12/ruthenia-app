import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  characters,
  type Character,
  type NewCharacterInput,
  type UpdateCharacter,
} from "@/database/schemas/character.schema";
import { entityRepository } from "./entity.repository";
import type { Repository } from "./repository.interface";

export interface CharacterRepository
  extends Repository<Character, NewCharacterInput, UpdateCharacter> {
  findByPartyId(partyId: number): Promise<Character[]>;
  findByKingdomId(kingdomId: number): Promise<Character[]>;
}

async function findAll(): Promise<Character[]> {
  return db.select().from(characters);
}

async function findById(id: number): Promise<Character | undefined> {
  const [row] = await db.select().from(characters).where(eq(characters.id, id));
  return row;
}

async function findByPartyId(partyId: number): Promise<Character[]> {
  return db.select().from(characters).where(eq(characters.partyId, partyId));
}

async function findByKingdomId(kingdomId: number): Promise<Character[]> {
  return db
    .select()
    .from(characters)
    .where(eq(characters.kingdomId, kingdomId));
}

/**
 * Cria a `entity` dona do id e a linha de `characters` na mesma transação:
 * se o insert em `characters` falhar (ex.: `kingdomId` inválido), a
 * `entity` recém-criada é revertida junto — nunca fica um id órfão.
 */
async function create(data: NewCharacterInput): Promise<Character> {
  return db.transaction(async (tx) => {
    const entity = await entityRepository.create(tx);
    const [row] = await tx
      .insert(characters)
      .values({ ...data, id: entity.id })
      .returning();
    return row;
  });
}

async function update(
  id: number,
  data: UpdateCharacter,
): Promise<Character | undefined> {
  const [row] = await db
    .update(characters)
    .set(data)
    .where(eq(characters.id, id))
    .returning();
  return row;
}

/**
 * `characters.id` é FK de `entities.id` com `ON DELETE CASCADE`, então
 * remover a entity é o que de fato apaga a linha de character (e, em
 * cascata, seu inventory/items) — a exclusão sempre acontece pela raiz.
 */
async function remove(id: number): Promise<boolean> {
  return entityRepository.remove(id);
}

export const characterRepository: CharacterRepository = {
  findAll,
  findById,
  findByPartyId,
  findByKingdomId,
  create,
  update,
  remove,
};
