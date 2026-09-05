import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { kingdoms } from "./kingdom.schema";

export const parties = sqliteTable("parties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  kingdomId: integer("kingdom_id")
    .notNull()
    .references(() => kingdoms.id),
});

export const insertPartySchema = createInsertSchema(parties);
export const selectPartySchema = createSelectSchema(parties);
export const updatePartySchema = createUpdateSchema(parties);

export type Party = typeof parties.$inferSelect;
export type NewParty = typeof parties.$inferInsert;
export type UpdateParty = z.infer<typeof updatePartySchema>;
