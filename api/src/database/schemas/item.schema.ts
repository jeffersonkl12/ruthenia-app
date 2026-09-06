import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { inventories } from "./inventory.schema";

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  inventoryId: integer("inventory_id")
    .notNull()
    .references(() => inventories.id, { onDelete: "cascade" }),
});

export const insertItemSchema = createInsertSchema(items);
export const selectItemSchema = createSelectSchema(items);
export const updateItemSchema = createUpdateSchema(items);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type UpdateItem = z.infer<typeof updateItemSchema>;
