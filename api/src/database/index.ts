import type { LibSQLTransaction } from "drizzle-orm/libsql";
import { Database } from "./client.database";

const instance = Database.getInstance();

export const db = instance.orm;
export const client = instance.client;
export type DrizzleDatabase = typeof db;

/**
 * Um `db` normal ou o `tx` recebido dentro de `db.transaction(async (tx) => ...)`.
 * Permite que funções de repositório (ex.: {@link EntityRepository}) rodem tanto
 * soltas quanto dentro da transação de um repositório "filho" (ver
 * `character.repository.ts`), sem duplicar a query em dois lugares.
 */
export type DbExecutor = DrizzleDatabase | LibSQLTransaction<any>;

export { Database };
export * as schema from "./schemas";
