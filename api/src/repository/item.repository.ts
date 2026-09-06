import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  items,
  type Item,
  type NewItem,
  type UpdateItem,
} from "@/database/schemas/item.schema";
import type { Repository } from "./repository.interface";

export interface ItemRepository extends Repository<Item, NewItem, UpdateItem> {
  findByInventoryId(inventoryId: number): Promise<Item[]>;
}

async function findAll(): Promise<Item[]> {
  return db.select().from(items);
}

async function findById(id: number): Promise<Item | undefined> {
  const [row] = await db.select().from(items).where(eq(items.id, id));
  return row;
}

async function findByInventoryId(inventoryId: number): Promise<Item[]> {
  return db.select().from(items).where(eq(items.inventoryId, inventoryId));
}

async function create(data: NewItem): Promise<Item> {
  const [row] = await db.insert(items).values(data).returning();
  return row;
}

async function update(
  id: number,
  data: UpdateItem,
): Promise<Item | undefined> {
  const [row] = await db
    .update(items)
    .set(data)
    .where(eq(items.id, id))
    .returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(items)
    .where(eq(items.id, id))
    .returning({ id: items.id });
  return deleted.length > 0;
}

export const itemRepository: ItemRepository = {
  findAll,
  findById,
  findByInventoryId,
  create,
  update,
  remove,
};
