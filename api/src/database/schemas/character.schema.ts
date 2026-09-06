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

export const characterGenderEnum = ["MALE", "FEMALE", "OTHER"] as const;

export const characterRaceEnum = ["HUMAN"] as const;

export const characterSocialStatusEnum = [
  "NOBLE",
  "COMMONER",
  "MERCHANT",
  "CLERGY",
  "SLAVE",
] as const;

export const characterHealthStatusEnum = [
  "HEALTHY",
  "SICK",
  "INJURED",
  "INCAPACITATED",
  "DEAD",
] as const;

export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender", { enum: characterGenderEnum }).notNull(),
  race: text("race", { enum: characterRaceEnum }).notNull(),
  socialStatus: text("social_status", {
    enum: characterSocialStatusEnum,
  }).notNull(),
  healthStatus: text("health_status", {
    enum: characterHealthStatusEnum,
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

export const insertCharacterSchema = createInsertSchema(characters, {
  age: (schema) => schema.nonnegative(),
});
export const selectCharacterSchema = createSelectSchema(characters);
export const updateCharacterSchema = createUpdateSchema(characters, {
  age: (schema) => schema.nonnegative(),
});

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type UpdateCharacter = z.infer<typeof updateCharacterSchema>;
