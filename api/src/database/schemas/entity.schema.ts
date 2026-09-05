import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { parties } from "./party.schema";
import { kingdoms } from "./kingdom.schema";
import { regions } from "./region.schema";
import { locations } from "./location.schema";

export const entityGenderEnum = ["MALE", "FEMALE", "OTHER"] as const;

export const entityRaceEnum = ["HUMAN"] as const;

export const entitySocialStatusEnum = [
  "NOBLE",
  "COMMONER",
  "MERCHANT",
  "CLERGY",
  "SLAVE",
] as const;

export const entityHealthStatusEnum = [
  "HEALTHY",
  "SICK",
  "INJURED",
  "INCAPACITATED",
  "DEAD",
] as const;

export const entities = sqliteTable("entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender", { enum: entityGenderEnum }).notNull(),
  race: text("race", { enum: entityRaceEnum }).notNull(),
  socialStatus: text("social_status", {
    enum: entitySocialStatusEnum,
  }).notNull(),
  healthStatus: text("health_status", {
    enum: entityHealthStatusEnum,
  })
    .notNull()
    .default("HEALTHY"),
  isPlayer: integer("is_player", { mode: "boolean" }).notNull().default(false),
  occupation: text("occupation").notNull(),
  personality: text("personality").notNull(),
  appearance: text("appearance").notNull(),
  background: text("background").notNull(),
  kingdomId: integer("kingdom_id")
    .notNull()
    .references(() => kingdoms.id),
  partyId: integer("party_id").references(() => parties.id, {
    onDelete: "set null",
  }),
  currentRegionId: integer("current_region_id").references(
    () => regions.id,
    { onDelete: "set null" },
  ),
  currentLocationId: integer("current_location_id").references(
    () => locations.id,
    { onDelete: "set null" },
  ),
});

export const insertEntitySchema = createInsertSchema(entities, {
  age: (schema) => schema.nonnegative(),
});
export const selectEntitySchema = createSelectSchema(entities);
export const updateEntitySchema = createUpdateSchema(entities, {
  age: (schema) => schema.nonnegative(),
});

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type UpdateEntity = z.infer<typeof updateEntitySchema>;
