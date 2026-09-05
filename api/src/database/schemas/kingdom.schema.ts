import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";

export const kingdomStatusEnum = ["PEACE", "CIVIL_WAR", "CRISIS"] as const;

export const kingdoms = sqliteTable("kingdoms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  status: text("status", { enum: kingdomStatusEnum })
    .notNull()
    .default("PEACE"),
});

export const insertKingdomSchema = createInsertSchema(kingdoms);
export const selectKingdomSchema = createSelectSchema(kingdoms);
export const updateKingdomSchema = createUpdateSchema(kingdoms);

export type Kingdom = typeof kingdoms.$inferSelect;
export type NewKingdom = typeof kingdoms.$inferInsert;
export type UpdateKingdom = z.infer<typeof updateKingdomSchema>;
