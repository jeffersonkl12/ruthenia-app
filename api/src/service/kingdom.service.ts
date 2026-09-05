import {
  insertKingdomSchema,
  updateKingdomSchema,
  type Kingdom,
} from "@/database/schemas/kingdom.schema";
import { kingdomRepository } from "@/repository/kingdom.repository";
import type { Service } from "./service.interface";

export interface KingdomService extends Service<Kingdom> {}

async function findAll(): Promise<Kingdom[]> {
  return kingdomRepository.findAll();
}

async function findById(id: number): Promise<Kingdom | undefined> {
  return kingdomRepository.findById(id);
}

async function create(data: unknown): Promise<Kingdom> {
  const parsed = insertKingdomSchema.parse(data);
  return kingdomRepository.create(parsed);
}

async function update(
  id: number,
  data: unknown,
): Promise<Kingdom | undefined> {
  const parsed = updateKingdomSchema.parse(data);
  return kingdomRepository.update(id, parsed);
}

async function remove(id: number): Promise<boolean> {
  return kingdomRepository.remove(id);
}

export const kingdomService: KingdomService = {
  findAll,
  findById,
  create,
  update,
  remove,
};
