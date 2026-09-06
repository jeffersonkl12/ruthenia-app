import {
  insertInventorySchema,
  updateInventorySchema,
  type Inventory,
} from "@/database/schemas/inventory.schema";
import { inventoryRepository } from "@/repository/inventory.repository";
import type { Service } from "./service.interface";

export interface InventoryService extends Service<Inventory> {
  findByEntityId(entityId: number): Promise<Inventory | undefined>;
}

async function findAll(): Promise<Inventory[]> {
  return inventoryRepository.findAll();
}

async function findById(id: number): Promise<Inventory | undefined> {
  return inventoryRepository.findById(id);
}

async function findByEntityId(entityId: number): Promise<Inventory | undefined> {
  return inventoryRepository.findByEntityId(entityId);
}

// Sem checagem de existência do lado da entity aqui: a FK em
// inventories.entityId já garante isso no banco. A checagem de "já tem
// inventory" abaixo é sobre o invariante 1:1 em si, não sobre quem é o
// dono — não depende de saber o que é um character.
async function create(data: unknown): Promise<Inventory> {
  const parsed = insertInventorySchema.parse(data);

  const existing = await inventoryRepository.findByEntityId(parsed.entityId);
  if (existing) {
    throw new Error(`Entity ${parsed.entityId} already has an inventory`);
  }

  return inventoryRepository.create(parsed);
}

async function update(
  id: number,
  data: unknown,
): Promise<Inventory | undefined> {
  const parsed = updateInventorySchema.parse(data);

  if (parsed.entityId !== undefined) {
    const existing = await inventoryRepository.findByEntityId(parsed.entityId);
    if (existing && existing.id !== id) {
      throw new Error(`Entity ${parsed.entityId} already has an inventory`);
    }
  }

  return inventoryRepository.update(id, parsed);
}

async function remove(id: number): Promise<boolean> {
  return inventoryRepository.remove(id);
}

export const inventoryService: InventoryService = {
  findAll,
  findById,
  findByEntityId,
  create,
  update,
  remove,
};
