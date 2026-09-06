import type { Inventory } from "@/database/schemas/inventory.schema";
import type { Item, NewItem } from "@/database/schemas/item.schema";
import { diceRoller } from "@/dice";
import { characterService } from "./character.service";
import { inventoryService } from "./inventory.service";
import { itemService } from "./item.service";

/** Dados de um item novo, sem `inventoryId` — o service resolve o inventário. */
export type NewItemInput = Omit<NewItem, "inventoryId">;

/** Os seis atributos de um personagem contra os quais se rola um teste. */
export const abilityNames = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;
export type AbilityName = (typeof abilityNames)[number];

/**
 * Resultado de um teste no estilo Dungeon World / PbtA:
 * - `STRONG_HIT` (10+): sucesso total, sem consequências.
 * - `WEAK_HIT` (7–9): sucesso com custo — o Mestre introduz uma complicação.
 * - `MISS` (6-): falha — o Mestre faz um Movimento contra o personagem, e
 *   ele marca 1 XP (`markXp`).
 */
export type MoveOutcome = "STRONG_HIT" | "WEAK_HIT" | "MISS";

/** Rolagem de 2d6 + modificador já classificada em `MoveOutcome`. */
export interface MoveRoll {
  /** Os dois d6 individuais. */
  rolls: number[];
  /** Soma crua dos 2d6, antes do modificador. */
  diceTotal: number;
  /** Modificador aplicado (do atributo, ou cru quando testado à mão). */
  modifier: number;
  /** `diceTotal + modifier` — o número que decide o resultado. */
  total: number;
  outcome: MoveOutcome;
  /** `true` sse `outcome === "MISS"`: o personagem marca 1 XP. */
  markXp: boolean;
}

/** `MoveRoll` de um teste feito contra um atributo de um personagem real. */
export interface AbilityCheck extends MoveRoll {
  ability: AbilityName;
  /** Valor do atributo no personagem no momento do teste. */
  score: number;
}

/**
 * Facade de ações de jogo.
 *
 * Orquestra `characterService`/`inventoryService`/`itemService` e o módulo de
 * dados (`@/dice`) por trás de ações de alto nível — mexer em inventário e
 * resolver testes de atributo — sem quem chama precisar saber como
 * inventory/item se relacionam com a tabela de identidade (`entities`, ver
 * `inventory.schema.ts`/`character.schema.ts`) nem como o motor de dados
 * funciona por baixo.
 */
export interface EngineService {
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
  /**
   * Rola 2d6 + `modifier` e classifica em `MoveOutcome`. Não toca no banco —
   * serve para exercitar o sistema de dados com um modificador cru.
   */
  rollMove(modifier?: number): MoveRoll;
  /**
   * Testa um atributo de um personagem: carrega o personagem, converte o
   * valor do atributo em modificador (tabela Dungeon World) e rola
   * 2d6 + modificador.
   */
  checkAbility(
    characterId: number,
    ability: AbilityName,
  ): Promise<AbilityCheck>;
}

/**
 * Converte o valor de um atributo no modificador correspondente, pela tabela
 * do Dungeon World (não é a linear `(n-10)/2` do d20).
 */
export function abilityModifier(score: number): number {
  if (score <= 1) return -3;
  if (score <= 3) return -2;
  if (score <= 5) return -1;
  if (score <= 8) return 0;
  if (score <= 12) return 1;
  if (score <= 15) return 2;
  if (score <= 17) return 3;
  return 4;
}

/** Classifica o total de um teste nos três patamares PbtA. */
export function outcomeFor(total: number): MoveOutcome {
  if (total >= 10) return "STRONG_HIT";
  if (total >= 7) return "WEAK_HIT";
  return "MISS";
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

function rollMove(modifier = 0): MoveRoll {
  const { values, total: diceTotal } = diceRoller.roll("2d6");
  const total = diceTotal + modifier;
  const outcome = outcomeFor(total);
  return {
    rolls: values,
    diceTotal,
    modifier,
    total,
    outcome,
    markXp: outcome === "MISS",
  };
}

async function checkAbility(
  characterId: number,
  ability: AbilityName,
): Promise<AbilityCheck> {
  const character = await characterService.findById(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const score = character[ability];
  const move = rollMove(abilityModifier(score));
  return { ...move, ability, score };
}

export const engineService: EngineService = {
  addItemToCharacter,
  moveItemToCharacter,
  rollMove,
  checkAbility,
};
