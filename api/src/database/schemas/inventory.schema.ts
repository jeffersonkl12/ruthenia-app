import { integer, sqliteTable } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { characters } from "./character.schema";

export const inventories = sqliteTable("inventories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .unique()
    .references(() => characters.id, { onDelete: "cascade" }),
});

export const insertInventorySchema = createInsertSchema(inventories);
export const selectInventorySchema = createSelectSchema(inventories);
export const updateInventorySchema = createUpdateSchema(inventories);

export type Inventory = typeof inventories.$inferSelect;
export type NewInventory = typeof inventories.$inferInsert;
export type UpdateInventory = z.infer<typeof updateInventorySchema>;
