import { integer, sqliteTable } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { entities } from "./entity.schema";

export const inventories = sqliteTable("inventories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Referencia `entities`, não `characters`: qualquer tabela que "herdar"
  // de entities (compartilhar sua PK, ver character.schema.ts) já pode ser
  // dona de um inventory, sem precisar de uma FK específica por tipo. Hoje
  // só character usa esse id space, então na prática é só ele.
  entityId: integer("entity_id")
    .notNull()
    .unique()
    .references(() => entities.id, { onDelete: "cascade" }),
});

export const insertInventorySchema = createInsertSchema(inventories);
export const selectInventorySchema = createSelectSchema(inventories);
export const updateInventorySchema = createUpdateSchema(inventories);

export type Inventory = typeof inventories.$inferSelect;
export type NewInventory = typeof inventories.$inferInsert;
export type UpdateInventory = z.infer<typeof updateInventorySchema>;
