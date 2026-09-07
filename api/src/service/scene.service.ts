import {
  insertSceneSchema,
  updateSceneSchema,
  type Scene,
} from "@/database/schemas/scene.schema";
import { sceneRepository } from "@/repository/scene.repository";
import type { Service } from "./service.interface";

export interface SceneService extends Service<Scene> {}

async function findAll(): Promise<Scene[]> {
  return sceneRepository.findAll();
}

async function findById(id: number): Promise<Scene | undefined> {
  return sceneRepository.findById(id);
}

async function create(data: unknown): Promise<Scene> {
  const parsed = insertSceneSchema.parse(data);
  return sceneRepository.create(parsed);
}

async function update(
  id: number,
  data: unknown,
): Promise<Scene | undefined> {
  const parsed = updateSceneSchema.parse(data);
  return sceneRepository.update(id, parsed);
}

async function remove(id: number): Promise<boolean> {
  return sceneRepository.remove(id);
}

export const sceneService: SceneService = {
  findAll,
  findById,
  create,
  update,
  remove,
};
