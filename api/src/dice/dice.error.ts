/**
 * Erro base do sistema de rolagem de dados.
 *
 * Centraliza a hierarquia para que as camadas superiores consigam distinguir
 * falhas de rolagem de qualquer outra falha com um único `instanceof DiceError`,
 * sem nunca precisar conhecer os tipos de erro da lib usada por baixo.
 */
export class DiceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    // `new.target` garante o nome correto mesmo nas subclasses.
    this.name = new.target.name;
  }
}

/** Notação de dados inválida (sintaxe incorreta, ex.: "4x6"). */
export class DiceNotationError extends DiceError {}

/** Falha ao executar a rolagem (parâmetros nonsensicais, modificador inválido). */
export class DiceRollError extends DiceError {}
