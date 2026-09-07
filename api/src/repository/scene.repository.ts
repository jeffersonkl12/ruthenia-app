import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  scenes,
  type Scene,
  type NewScene,
  type UpdateScene,
} from "@/database/schemas/scene.schema";
import type { Repository } from "./repository.interface";

export interface SceneRepository
  extends Repository<Scene, NewScene, UpdateScene> {}

async function findAll(): Promise<Scene[]> {
  return db.select().from(scenes);
}

async function findById(id: number): Promise<Scene | undefined> {
  const [row] = await db.select().from(scenes).where(eq(scenes.id, id));
  return row;
}

async function create(data: NewScene): Promise<Scene> {
  const [row] = await db.insert(scenes).values(data).returning();
  return row;
}

async function update(
  id: number,
  data: UpdateScene,
): Promise<Scene | undefined> {
  const [row] = await db
    .update(scenes)
    .set(data)
    .where(eq(scenes.id, id))
    .returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(scenes)
    .where(eq(scenes.id, id))
    .returning({ id: scenes.id });
  return deleted.length > 0;
}

export const sceneRepository: SceneRepository = {
  findAll,
  findById,
  create,
  update,
  remove,
};
