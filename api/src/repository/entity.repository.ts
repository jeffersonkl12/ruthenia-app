import { eq } from "drizzle-orm";
import { db } from "@/database";
import { entities, type EntityRow } from "@/database/schemas/entity.schema";

/**
 * Repositório da tabela de identidade (`entities`).
 *
 * Não é um repositório de domínio: `entities` só existe para gerar/liberar
 * ids compartilhados por tabelas que "herdam" dela (padrão ECS / class-table
 * inheritance). Por isso a interface não estende {@link Repository} — não há
 * `findAll`/`findById`/`update` nem sentido em expor essa tabela via API.
 */
export interface EntityRepository {
  create(): Promise<EntityRow>;
  remove(id: number): Promise<boolean>;
}

async function create(): Promise<EntityRow> {
  const [row] = await db.insert(entities).values({}).returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(entities)
    .where(eq(entities.id, id))
    .returning({ id: entities.id });
  return deleted.length > 0;
}

export const entityRepository: EntityRepository = { create, remove };
