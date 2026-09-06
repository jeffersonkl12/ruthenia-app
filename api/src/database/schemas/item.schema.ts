import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { inventories } from "./inventory.schema";

export const itemTypeEnum = ["WEAPON", "ARMOR", "TOOL"] as const;

// Onde/como um item ocupa o corpo quando equipado. Slots de armadura
// (`HEAD`..`FEET`) e de arma (`MAIN_HAND`/`OFF_HAND`/`TWO_HANDED`) convivem no
// mesmo enum; a coerência entre `type` e slot é validada no `item.service.ts`.
export const itemEquipSlotEnum = [
  "HEAD",
  "CHEST",
  "LEGS",
  "HANDS",
  "FEET",
  "MAIN_HAND",
  "OFF_HAND",
  "TWO_HANDED",
] as const;

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: itemTypeEnum }).notNull(),
  description: text("description").notNull(),
  equipped: integer("equipped", { mode: "boolean" })
    .notNull()
    .default(false),
  // Nulo quando o item não está equipado (ou é um `TOOL`, que não ocupa
  // slot). `TWO_HANDED` representa armas de duas mãos (lança, espada gigante).
  equipSlot: text("equip_slot", { enum: itemEquipSlotEnum }),
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
