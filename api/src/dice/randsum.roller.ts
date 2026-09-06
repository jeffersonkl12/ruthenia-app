import {
  isDiceNotation,
  NotationParseError,
  optionsToDescription,
  RandsumError,
  roll as randsumRoll,
  validateNotation,
  type RollArgument,
  type RollRecord,
} from "@randsum/roller";
import { DiceError, DiceNotationError, DiceRollError } from "./dice.error";
import type {
  DiceRoller,
  DiceRollInput,
  DiceRollRecord,
  DiceRollResult,
  DiceValidation,
} from "./dice.interface";

function toDiceRollRecord(record: RollRecord): DiceRollRecord {
  return {
    notation: record.notation,
    description: record.description,
    rolls: record.rolls,
    initialRolls: record.initialRolls,
    total: record.total,
  };
}

/**
 * Traduz um erro do `@randsum/roller` para a hierarquia própria de
 * {@link DiceError}. `roll()` relata tanto notação inválida quanto opções
 * inválidas através do mesmo `ValidationError` genérico (confirmado
 * empiricamente — não dá pra diferenciar pela classe da exceção nesse ponto),
 * então essa função só cobre o caso residual; a distinção real de "isso é
 * notação inválida" acontece proativamente em {@link RandsumDiceRoller.roll}
 * via `isDiceNotation`, antes mesmo de chamar a lib.
 */
function wrapError(cause: unknown): DiceError {
  if (cause instanceof NotationParseError) {
    return new DiceNotationError(cause.message, { cause });
  }
  if (cause instanceof RandsumError) {
    return new DiceRollError(cause.message, { cause });
  }
  throw cause;
}

/**
 * Implementação de {@link DiceRoller} sobre `@randsum/roller`.
 *
 * Único arquivo do módulo que importa a lib concreta — trocar de motor de
 * dados no futuro significa escrever uma nova classe aqui do lado e apontar
 * `index.ts` pra ela, sem tocar em mais nada que consome {@link DiceRoller}.
 */
export class RandsumDiceRoller implements DiceRoller {
  roll(...inputs: DiceRollInput[]): DiceRollResult {
    for (const input of inputs) {
      if (typeof input === "string" && !isDiceNotation(input)) {
        throw new DiceNotationError(`"${input}" is not valid dice notation`);
      }
    }

    try {
      const result = randsumRoll(...(inputs as RollArgument[]));
      return {
        total: result.total,
        values: result.values as number[],
        rolls: result.rolls.map(toDiceRollRecord),
      };
    } catch (cause) {
      throw wrapError(cause);
    }
  }

  validate(notation: string): DiceValidation {
    const result = validateNotation(notation);
    if (result.valid) {
      return { valid: true };
    }
    return {
      valid: false,
      error: {
        message: result.error.message,
        position: result.error.position,
      },
    };
  }

  isValidNotation(value: string): boolean {
    return isDiceNotation(value);
  }

  describe(input: DiceRollInput): string[] {
    if (typeof input === "number") {
      return optionsToDescription({ sides: input });
    }

    const validation = validateNotation(input);
    if (!validation.valid) {
      throw new DiceNotationError(validation.error.message);
    }
    return validation.description.flat();
  }
}
