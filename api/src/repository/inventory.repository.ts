import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  inventories,
  type Inventory,
  type NewInventory,
  type UpdateInventory,
} from "@/database/schemas/inventory.schema";
import type { Repository } from "./repository.interface";

export interface InventoryRepository
  extends Repository<Inventory, NewInventory, UpdateInventory> {
  findByCharacterId(characterId: number): Promise<Inventory | undefined>;
}

async function findAll(): Promise<Inventory[]> {
  return db.select().from(inventories);
}

async function findById(id: number): Promise<Inventory | undefined> {
  const [row] = await db
    .select()
    .from(inventories)
    .where(eq(inventories.id, id));
  return row;
}

async function findByCharacterId(
  characterId: number,
): Promise<Inventory | undefined> {
  const [row] = await db
    .select()
    .from(inventories)
    .where(eq(inventories.characterId, characterId));
  return row;
}

async function create(data: NewInventory): Promise<Inventory> {
  const [row] = await db.insert(inventories).values(data).returning();
  return row;
}

async function update(
  id: number,
  data: UpdateInventory,
): Promise<Inventory | undefined> {
  const [row] = await db
    .update(inventories)
    .set(data)
    .where(eq(inventories.id, id))
    .returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(inventories)
    .where(eq(inventories.id, id))
    .returning({ id: inventories.id });
  return deleted.length > 0;
}

export const inventoryRepository: InventoryRepository = {
  findAll,
  findById,
  findByCharacterId,
  create,
  update,
  remove,
};
