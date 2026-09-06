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

type ItemType = Item["type"];
type ItemEquipSlot = NonNullable<Item["equipSlot"]>;

/** Slots que cada tipo de item pode ocupar quando equipado. */
const EQUIP_SLOTS_BY_TYPE: Record<ItemType, readonly ItemEquipSlot[]> = {
  WEAPON: ["MAIN_HAND", "OFF_HAND", "TWO_HANDED"],
  ARMOR: ["HEAD", "CHEST", "LEGS", "HANDS", "FEET"],
  TOOL: [],
};

/**
 * Garante que `type`, `equipped` e `equipSlot` descrevem um estado possível:
 * o slot precisa pertencer ao tipo, e uma arma/armadura equipada precisa
 * dizer em qual slot está.
 */
function assertEquipCoherent(
  type: ItemType,
  equipped: boolean,
  equipSlot: ItemEquipSlot | null | undefined,
): void {
  if (equipSlot != null && !EQUIP_SLOTS_BY_TYPE[type].includes(equipSlot)) {
    throw new Error(
      `Item of type ${type} cannot use equip slot ${equipSlot}`,
    );
  }

  if (equipped && type !== "TOOL" && equipSlot == null) {
    throw new Error(
      `An equipped ${type} item must specify which equip slot it occupies`,
    );
  }
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

  assertEquipCoherent(parsed.type, parsed.equipped ?? false, parsed.equipSlot);

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

  const touchesEquip =
    parsed.type !== undefined ||
    parsed.equipped !== undefined ||
    parsed.equipSlot !== undefined;

  if (touchesEquip) {
    const current = await itemRepository.findById(id);
    if (!current) {
      return undefined;
    }
    assertEquipCoherent(
      parsed.type ?? current.type,
      parsed.equipped ?? current.equipped,
      parsed.equipSlot !== undefined ? parsed.equipSlot : current.equipSlot,
    );
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
