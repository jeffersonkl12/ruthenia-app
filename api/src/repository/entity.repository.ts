import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  entities,
  type Entity,
  type NewEntity,
  type UpdateEntity,
} from "@/database/schemas/entity.schema";
import type { Repository } from "./repository.interface";

export interface EntityRepository
  extends Repository<Entity, NewEntity, UpdateEntity> {
  findByPartyId(partyId: number): Promise<Entity[]>;
  findByKingdomId(kingdomId: number): Promise<Entity[]>;
}

async function findAll(): Promise<Entity[]> {
  return db.select().from(entities);
}

async function findById(id: number): Promise<Entity | undefined> {
  const [row] = await db.select().from(entities).where(eq(entities.id, id));
  return row;
}

async function findByPartyId(partyId: number): Promise<Entity[]> {
  return db.select().from(entities).where(eq(entities.partyId, partyId));
}

async function findByKingdomId(kingdomId: number): Promise<Entity[]> {
  return db.select().from(entities).where(eq(entities.kingdomId, kingdomId));
}

async function create(data: NewEntity): Promise<Entity> {
  const [row] = await db.insert(entities).values(data).returning();
  return row;
}

async function update(
  id: number,
  data: UpdateEntity,
): Promise<Entity | undefined> {
  const [row] = await db
    .update(entities)
    .set(data)
    .where(eq(entities.id, id))
    .returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(entities)
    .where(eq(entities.id, id))
    .returning({ id: entities.id });
  return deleted.length > 0;
}

export const entityRepository: EntityRepository = {
  findAll,
  findById,
  findByPartyId,
  findByKingdomId,
  create,
  update,
  remove,
};
