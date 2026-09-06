import {
  insertItemSchema,
  updateItemSchema,
  type Item,
} from "@/database/schemas/item.schema";
import { itemRepository } from "@/repository/item.repository";
import { inventoryRepository } from "@/repository/inventory.repository";
import type { Service } from "./service.interface";

export interface ItemService extends Service<Item> {
  findByInventoryId(inventoryId: number): Promise<Item[]>;
}

async function findAll(): Promise<Item[]> {
  return itemRepository.findAll();
}

async function findById(id: number): Promise<Item | undefined> {
  return itemRepository.findById(id);
}

async function findByInventoryId(inventoryId: number): Promise<Item[]> {
  return itemRepository.findByInventoryId(inventoryId);
}

async function create(data: unknown): Promise<Item> {
  const parsed = insertItemSchema.parse(data);

  const inventory = await inventoryRepository.findById(parsed.inventoryId);
  if (!inventory) {
    throw new Error(`Inventory ${parsed.inventoryId} not found`);
  }

  return itemRepository.create(parsed);
}

async function update(id: number, data: unknown): Promise<Item | undefined> {
  const parsed = updateItemSchema.parse(data);

  if (parsed.inventoryId !== undefined) {
    const inventory = await inventoryRepository.findById(parsed.inventoryId);
    if (!inventory) {
      throw new Error(`Inventory ${parsed.inventoryId} not found`);
    }
  }

  return itemRepository.update(id, parsed);
}

async function remove(id: number): Promise<boolean> {
  return itemRepository.remove(id);
}

export const itemService: ItemService = {
  findAll,
  findById,
  findByInventoryId,
  create,
  update,
  remove,
};
