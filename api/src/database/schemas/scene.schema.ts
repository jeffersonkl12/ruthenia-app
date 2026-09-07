import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";

// Modo em que a cena está rodando: exploração/roleplay livre
// (`NARRATIVE`) ou combate por turnos (`COMBAT`).
export const sceneModeEnum = ["NARRATIVE", "COMBAT"] as const;

// Uma cena é o recorte narrativo mais granular dentro de uma sessão: o
// "onde e o quê" imediato que está sendo jogado (uma taverna, uma
// emboscada, um conselho). Serve para dar foco ao contexto passado à IA.
export const scenes = sqliteTable("scenes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  mode: text("mode", { enum: sceneModeEnum }).notNull().default("NARRATIVE"),
});

export const insertSceneSchema = createInsertSchema(scenes);
export const selectSceneSchema = createSelectSchema(scenes);
export const updateSceneSchema = createUpdateSchema(scenes);

export type Scene = typeof scenes.$inferSelect;
export type NewScene = typeof scenes.$inferInsert;
export type UpdateScene = z.infer<typeof updateSceneSchema>;
