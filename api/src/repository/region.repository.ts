import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  regions,
  type Region,
  type NewRegion,
  type UpdateRegion,
} from "@/database/schemas/region.schema";
import type { Repository } from "./repository.interface";

export interface RegionRepository
  extends Repository<Region, NewRegion, UpdateRegion> {
  findByKingdomId(kingdomId: number): Promise<Region[]>;
}

async function findAll(): Promise<Region[]> {
  return db.select().from(regions);
}

async function findById(id: number): Promise<Region | undefined> {
  const [row] = await db.select().from(regions).where(eq(regions.id, id));
  return row;
}

async function findByKingdomId(kingdomId: number): Promise<Region[]> {
  return db.select().from(regions).where(eq(regions.kingdomId, kingdomId));
}

async function create(data: NewRegion): Promise<Region> {
  const [row] = await db.insert(regions).values(data).returning();
  return row;
}

async function update(
  id: number,
  data: UpdateRegion,
): Promise<Region | undefined> {
  const [row] = await db
    .update(regions)
    .set(data)
    .where(eq(regions.id, id))
    .returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(regions)
    .where(eq(regions.id, id))
    .returning({ id: regions.id });
  return deleted.length > 0;
}

export const regionRepository: RegionRepository = {
  findAll,
  findById,
  findByKingdomId,
  create,
  update,
  remove,
};
