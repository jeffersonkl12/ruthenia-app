import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  kingdoms,
  type Kingdom,
  type NewKingdom,
  type UpdateKingdom,
} from "@/database/schemas/kingdom.schema";
import type { Repository } from "./repository.interface";

export interface KingdomRepository
  extends Repository<Kingdom, NewKingdom, UpdateKingdom> {}

async function findAll(): Promise<Kingdom[]> {
  return db.select().from(kingdoms);
}

async function findById(id: number): Promise<Kingdom | undefined> {
  const [row] = await db.select().from(kingdoms).where(eq(kingdoms.id, id));
  return row;
}

async function create(data: NewKingdom): Promise<Kingdom> {
  const [row] = await db.insert(kingdoms).values(data).returning();
  return row;
}

async function update(
  id: number,
  data: UpdateKingdom,
): Promise<Kingdom | undefined> {
  const [row] = await db
    .update(kingdoms)
    .set(data)
    .where(eq(kingdoms.id, id))
    .returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(kingdoms)
    .where(eq(kingdoms.id, id))
    .returning({ id: kingdoms.id });
  return deleted.length > 0;
}

export const kingdomRepository: KingdomRepository = {
  findAll,
  findById,
  create,
  update,
  remove,
};
