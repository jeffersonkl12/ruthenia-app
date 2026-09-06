import {
  insertInventorySchema,
  updateInventorySchema,
  type Inventory,
} from "@/database/schemas/inventory.schema";
import { inventoryRepository } from "@/repository/inventory.repository";
import { characterRepository } from "@/repository/character.repository";
import type { Service } from "./service.interface";

export interface InventoryService extends Service<Inventory> {
  findByCharacterId(characterId: number): Promise<Inventory | undefined>;
}

async function findAll(): Promise<Inventory[]> {
  return inventoryRepository.findAll();
}

async function findById(id: number): Promise<Inventory | undefined> {
  return inventoryRepository.findById(id);
}

async function findByCharacterId(
  characterId: number,
): Promise<Inventory | undefined> {
  return inventoryRepository.findByCharacterId(characterId);
}

async function create(data: unknown): Promise<Inventory> {
  const parsed = insertInventorySchema.parse(data);

  const character = await characterRepository.findById(parsed.characterId);
  if (!character) {
    throw new Error(`Character ${parsed.characterId} not found`);
  }

  const existing = await inventoryRepository.findByCharacterId(
    parsed.characterId,
  );
  if (existing) {
    throw new Error(`Character ${parsed.characterId} already has an inventory`);
  }

  return inventoryRepository.create(parsed);
}

async function update(
  id: number,
  data: unknown,
): Promise<Inventory | undefined> {
  const parsed = updateInventorySchema.parse(data);

  if (parsed.characterId !== undefined) {
    const character = await characterRepository.findById(parsed.characterId);
    if (!character) {
      throw new Error(`Character ${parsed.characterId} not found`);
    }

    const existing = await inventoryRepository.findByCharacterId(
      parsed.characterId,
    );
    if (existing && existing.id !== id) {
      throw new Error(
        `Character ${parsed.characterId} already has an inventory`,
      );
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
  findByCharacterId,
  create,
  update,
  remove,
};
