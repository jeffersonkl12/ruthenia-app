export * from "./dice.error";
export * from "./dice.interface";
export * from "./randsum.roller";

import { RandsumDiceRoller } from "./randsum.roller";
import type { DiceRoller } from "./dice.interface";

/**
 * Instância única do roller usada pelo resto do sistema.
 *
 * Pra trocar de lib de dados no futuro, basta trocar a classe instanciada
 * aqui — todo o resto do código depende só de {@link DiceRoller}.
 */
export const diceRoller: DiceRoller = new RandsumDiceRoller();
