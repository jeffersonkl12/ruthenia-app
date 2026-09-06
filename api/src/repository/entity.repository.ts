import { eq } from "drizzle-orm";
import { db, type DbExecutor } from "@/database";
import { entities, type EntityRow } from "@/database/schemas/entity.schema";

/**
 * Repositório da tabela de identidade (`entities`).
 *
 * Não é um repositório de domínio: `entities` só existe para gerar/liberar
 * ids compartilhados por tabelas que "herdam" dela (padrão ECS / class-table
 * inheritance). Por isso a interface não estende {@link Repository} — não há
 * `findAll`/`findById`/`update` nem sentido em expor essa tabela via API.
 *
 * Ambos os métodos aceitam um `executor` opcional (o `db` global por
 * padrão) para que uma tabela "filha" — ex. `character.repository.ts` —
 * possa mintar/liberar o id dentro da própria transação da sua escrita.
 */
export interface EntityRepository {
  create(executor?: DbExecutor): Promise<EntityRow>;
  remove(id: number, executor?: DbExecutor): Promise<boolean>;
}

async function create(executor: DbExecutor = db): Promise<EntityRow> {
  const [row] = await executor.insert(entities).values({}).returning();
  return row;
}

async function remove(id: number, executor: DbExecutor = db): Promise<boolean> {
  const deleted = await executor
    .delete(entities)
    .where(eq(entities.id, id))
    .returning({ id: entities.id });
  return deleted.length > 0;
}

export const entityRepository: EntityRepository = { create, remove };
