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
import { regions } from "./region.schema";

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  regionId: integer("region_id")
    .notNull()
    .references(() => regions.id),
  parentId: integer("parent_id").references(
    (): AnySQLiteColumn => locations.id,
  ),
  type: text("type").notNull(),
  description: text("description"),
});

export const insertLocationSchema = createInsertSchema(locations);
export const selectLocationSchema = createSelectSchema(locations);
export const updateLocationSchema = createUpdateSchema(locations);

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;
