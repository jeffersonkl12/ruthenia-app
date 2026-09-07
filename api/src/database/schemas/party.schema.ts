import {
  integer,
  sqliteTable,
  text,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { kingdoms } from "./kingdom.schema";
import { characters } from "./character.schema";

export const parties = sqliteTable("parties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  kingdomId: integer("kingdom_id")
    .notNull()
    .references(() => kingdoms.id),
  /**
   * Personagem líder da party — sempre o personagem do jogador
   * (`characters.isPlayer: true`), nunca um NPC; sem multiplayer, nunca mais
   * de um personagem jogável por party. Nullable porque toda party hoje é
   * criada antes do personagem líder existir (ver `partyService.setLeader`).
   * Referência circular com `characters.partyId` — mesmo padrão de thunk
   * tipado usado em `locations.parentId`.
   */
  leaderId: integer("leader_id")
    .unique()
    .references((): AnySQLiteColumn => characters.id, {
      onDelete: "cascade",
    }),
});

export const insertPartySchema = createInsertSchema(parties);
export const selectPartySchema = createSelectSchema(parties);
export const updatePartySchema = createUpdateSchema(parties);

export type Party = typeof parties.$inferSelect;
export type NewParty = typeof parties.$inferInsert;
export type UpdateParty = z.infer<typeof updatePartySchema>;
