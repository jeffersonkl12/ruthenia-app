import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  characters,
  type Character,
  type NewCharacter,
  type UpdateCharacter,
} from "@/database/schemas/character.schema";
import type { Repository } from "./repository.interface";

export interface CharacterRepository
  extends Repository<Character, NewCharacter, UpdateCharacter> {
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

async function create(data: NewCharacter): Promise<Character> {
  const [row] = await db.insert(characters).values(data).returning();
  return row;
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

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(characters)
    .where(eq(characters.id, id))
    .returning({ id: characters.id });
  return deleted.length > 0;
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
