import { integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const entities = sqliteTable("entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
});

export type EntityRow = typeof entities.$inferSelect;
