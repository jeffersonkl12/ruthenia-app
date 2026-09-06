import type { Inventory } from "@/database/schemas/inventory.schema";
import type { Item, NewItem } from "@/database/schemas/item.schema";
import { characterService } from "./character.service";
import { inventoryService } from "./inventory.service";
import { itemService } from "./item.service";

/** Dados de um item novo, sem `inventoryId` — a engine resolve o inventário. */
export type NewItemInput = Omit<NewItem, "inventoryId">;

/**
 * Facade de inventário.
 *
 * Orquestra `characterService`/`inventoryService`/`itemService` por trás de
 * ações de alto nível ("dar item a alguém", "mover item pra outro
 * personagem"), sem quem chama precisar saber como inventory/item se
 * relacionam com a tabela de identidade (`entities`) — ver
 * `inventory.schema.ts`/`character.schema.ts` para esse detalhe.
 */
export interface InventoryEngine {
  /**
   * Adiciona um item ao inventário de um personagem. Cria o inventário do
   * personagem se ele ainda não tiver um.
   */
  addItemToCharacter(characterId: number, item: NewItemInput): Promise<Item>;
  /**
   * Move um item existente para o inventário de outro personagem, criando o
   * inventário de destino se ele ainda não existir.
   */
  moveItemToCharacter(
    itemId: number,
    targetCharacterId: number,
  ): Promise<Item>;
}

/** Busca o inventário do personagem, criando um novo se ainda não existir. */
async function getOrCreateInventory(characterId: number): Promise<Inventory> {
  const existing = await inventoryService.findByEntityId(characterId);
  if (existing) {
    return existing;
  }
  return inventoryService.create({ entityId: characterId });
}

async function addItemToCharacter(
  characterId: number,
  item: NewItemInput,
): Promise<Item> {
  const character = await characterService.findById(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const inventory = await getOrCreateInventory(characterId);
  return itemService.create({ ...item, inventoryId: inventory.id });
}

async function moveItemToCharacter(
  itemId: number,
  targetCharacterId: number,
): Promise<Item> {
  const item = await itemService.findById(itemId);
  if (!item) {
    throw new Error(`Item ${itemId} not found`);
  }

  const targetCharacter = await characterService.findById(targetCharacterId);
  if (!targetCharacter) {
    throw new Error(`Character ${targetCharacterId} not found`);
  }

  const targetInventory = await getOrCreateInventory(targetCharacterId);
  const moved = await itemService.update(itemId, {
    inventoryId: targetInventory.id,
  });

  if (!moved) {
    throw new Error(`Failed to move item ${itemId}`);
  }

  return moved;
}

export const inventoryEngine: InventoryEngine = {
  addItemToCharacter,
  moveItemToCharacter,
};
