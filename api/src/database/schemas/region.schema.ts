import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { kingdoms } from "./kingdom.schema";

export const regionStatusEnum = [
  "STABLE",
  "UNREST",
  "OCCUPIED",
  "DEVASTATED",
] as const;

export const regionBiomeEnum = [
  "FOREST",
  "MOUNTAINS",
  "PLAINS",
  "DESERT",
  "SWAMP",
  "COAST",
  "TUNDRA",
] as const;

export const regions = sqliteTable("regions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  status: text("status", { enum: regionStatusEnum })
    .notNull()
    .default("STABLE"),
  wealth: integer("wealth").notNull().default(0),
  infrastructure: integer("infrastructure").notNull().default(0),
  biome: text("biome", { enum: regionBiomeEnum }).notNull(),
  kingdomId: integer("kingdom_id")
    .notNull()
    .references(() => kingdoms.id),
});

export const insertRegionSchema = createInsertSchema(regions, {
  wealth: (schema) => schema.nonnegative(),
  infrastructure: (schema) => schema.nonnegative(),
});
export const selectRegionSchema = createSelectSchema(regions);
export const updateRegionSchema = createUpdateSchema(regions, {
  wealth: (schema) => schema.nonnegative(),
  infrastructure: (schema) => schema.nonnegative(),
});

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;
export type UpdateRegion = z.infer<typeof updateRegionSchema>;
