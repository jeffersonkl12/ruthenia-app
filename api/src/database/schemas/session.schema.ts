import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { kingdoms } from "./kingdom.schema";

// Modo em que a campanha está rodando: exploração/roleplay livre
// (`NARRATIVE`) ou combate por turnos (`BATTLE`).
export const sessionModeEnum = ["NARRATIVE", "COMBAT"] as const;

// Representa a sessão instanciada de um jogo: o recorte "ao vivo" de uma
// partida, vinculado ao kingdom que serve de raiz do mundo jogado (ver
// `world.service.ts`, que trata o kingdom-raiz como o mundo).
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  mode: text("mode", { enum: sessionModeEnum })
    .notNull()
    .default("NARRATIVE"),
  kingdomId: integer("kingdom_id")
    .notNull()
    .references(() => kingdoms.id),
});

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);
export const updateSessionSchema = createUpdateSchema(sessions);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type UpdateSession = z.infer<typeof updateSessionSchema>;
