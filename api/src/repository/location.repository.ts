import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  locations,
  type Location,
  type NewLocation,
  type UpdateLocation,
} from "@/database/schemas/location.schema";
import type { Repository } from "./repository.interface";

export interface LocationRepository
  extends Repository<Location, NewLocation, UpdateLocation> {
  findByRegionId(regionId: number): Promise<Location[]>;
}

async function findAll(): Promise<Location[]> {
  return db.select().from(locations);
}

async function findById(id: number): Promise<Location | undefined> {
  const [row] = await db.select().from(locations).where(eq(locations.id, id));
  return row;
}

async function findByRegionId(regionId: number): Promise<Location[]> {
  return db.select().from(locations).where(eq(locations.regionId, regionId));
}

async function create(data: NewLocation): Promise<Location> {
  const [row] = await db.insert(locations).values(data).returning();
  return row;
}

async function update(
  id: number,
  data: UpdateLocation,
): Promise<Location | undefined> {
  const [row] = await db
    .update(locations)
    .set(data)
    .where(eq(locations.id, id))
    .returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(locations)
    .where(eq(locations.id, id))
    .returning({ id: locations.id });
  return deleted.length > 0;
}

export const locationRepository: LocationRepository = {
  findAll,
  findById,
  findByRegionId,
  create,
  update,
  remove,
};
