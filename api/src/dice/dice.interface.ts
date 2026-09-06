/**
 * Entrada de uma rolagem: notação de dados ("4d6L", "2d20H+3", "1d100") ou um
 * número simples de lados (`20` vira `1d20`).
 *
 * Ficamos só com essas duas formas — e não com o objeto de opções específico
 * de alguma lib — porque notação de dados é o formato universal que qualquer
 * motor de rolagem entende. É o que sobrevive se a lib por baixo for trocada.
 */
export type DiceRollInput = string | number;

/** Registro de uma rolagem individual dentro de uma expressão combinada. */
export interface DiceRollRecord {
  /** Notação normalizada dessa rolagem (ex.: "4d6L"). */
  notation: string;
  /** Descrição legível por humanos do que foi rolado. */
  description: string[];
  /** Valores finais de cada dado, depois de modificadores. */
  rolls: number[];
  /** Valores originais, antes de modificadores (drop/reroll/explode/...). */
  initialRolls: number[];
  /** Total dessa rolagem individual (já com a aritmética aplicada). */
  total: number;
}

/** Resultado de uma ou mais rolagens combinadas. */
export interface DiceRollResult {
  /** Total combinado de todas as rolagens. */
  total: number;
  /** Valores individuais de todos os dados rolados, achatados numa lista só. */
  values: number[];
  /** Registro detalhado de cada rolagem da expressão. */
  rolls: DiceRollRecord[];
}

/** Detalhe de erro de uma notação inválida. */
export interface DiceValidationError {
  message: string;
  /** Posição (0-indexed) do caractere que quebrou o parse, quando conhecida. */
  position?: number;
}

/** Resultado de validar uma notação sem executar a rolagem. */
export type DiceValidation =
  | { valid: true }
  | { valid: false; error: DiceValidationError };

/**
 * Contrato do sistema de rolagem de dados.
 *
 * Qualquer motor de dados por baixo (hoje `@randsum/roller`, potencialmente
 * outro amanhã) implementa isto — o resto do sistema depende só desta
 * interface, nunca do SDK concreto. Ver `randsum.roller.ts` para a
 * implementação atual e `index.ts` para o ponto único de troca.
 */
export interface DiceRoller {
  /**
   * Rola uma ou mais expressões de dados e combina o total.
   * @throws {DiceNotationError} se alguma notação for inválida.
   * @throws {DiceRollError} se os parâmetros forem inválidos por outro motivo.
   */
  roll(...inputs: DiceRollInput[]): DiceRollResult;
  /** Valida uma notação sem rolar, reportando o motivo/posição do erro. */
  validate(notation: string): DiceValidation;
  /** `value` é uma expressão de dados reconhecível? */
  isValidNotation(value: string): boolean;
  /**
   * Descrição legível por humanos de uma expressão, sem executá-la.
   * @throws {DiceNotationError} se a notação for inválida.
   */
  describe(input: DiceRollInput): string[];
}
