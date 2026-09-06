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
import { entities } from "./entity.schema";

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
  // PK compartilhada com `entities` (padrão ECS/class-table inheritance):
  // todo Character é uma Entity. Quem gera o id é sempre `entities`, nunca
  // esta tabela — por isso sem autoIncrement aqui.
  id: integer("id")
    .primaryKey()
    .references(() => entities.id, { onDelete: "cascade" }),
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
  // Atributos básicos (padrão d20). Default 10 = humano médio, mantém
  // seed/clone funcionando sem precisar informar os seis toda vez.
  strength: integer("strength").notNull().default(10),
  dexterity: integer("dexterity").notNull().default(10),
  constitution: integer("constitution").notNull().default(10),
  intelligence: integer("intelligence").notNull().default(10),
  wisdom: integer("wisdom").notNull().default(10),
  charisma: integer("charisma").notNull().default(10),
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

// `id` fica de fora dos dois: é sempre gerado internamente pelo repository
// (via `entityRepository.create()`), nunca informado por quem chama, e
// nunca reatribuível num update (quebraria o vínculo com a `entities`
// correspondente).
export const insertCharacterSchema = createInsertSchema(characters, {
  age: (schema) => schema.nonnegative(),
  strength: (schema) => schema.positive(),
  dexterity: (schema) => schema.positive(),
  constitution: (schema) => schema.positive(),
  intelligence: (schema) => schema.positive(),
  wisdom: (schema) => schema.positive(),
  charisma: (schema) => schema.positive(),
}).omit({ id: true });
export const selectCharacterSchema = createSelectSchema(characters);
export const updateCharacterSchema = createUpdateSchema(characters, {
  age: (schema) => schema.nonnegative(),
  strength: (schema) => schema.positive(),
  dexterity: (schema) => schema.positive(),
  constitution: (schema) => schema.positive(),
  intelligence: (schema) => schema.positive(),
  wisdom: (schema) => schema.positive(),
  charisma: (schema) => schema.positive(),
}).omit({ id: true });

export type Character = typeof characters.$inferSelect;
/** Forma crua de insert (com `id`), usada só dentro do repository. */
export type NewCharacter = typeof characters.$inferInsert;
/** Forma validada que o service recebe/repassa — sem `id`. */
export type NewCharacterInput = z.infer<typeof insertCharacterSchema>;
export type UpdateCharacter = z.infer<typeof updateCharacterSchema>;
