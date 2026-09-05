import {
  insertRegionSchema,
  updateRegionSchema,
  type Region,
} from "@/database/schemas/region.schema";
import { regionRepository } from "@/repository/region.repository";
import type { Service } from "./service.interface";

const crisisStatuses = ["UNREST", "OCCUPIED", "DEVASTATED"] as const;

export interface RegionService extends Service<Region> {
  generateRandomCrisis(id: number): Promise<Region | undefined>;
  findByKingdomId(kingdomId: number): Promise<Region[]>;
}

async function findAll(): Promise<Region[]> {
  return regionRepository.findAll();
}

async function findById(id: number): Promise<Region | undefined> {
  return regionRepository.findById(id);
}

async function findByKingdomId(kingdomId: number): Promise<Region[]> {
  return regionRepository.findByKingdomId(kingdomId);
}

async function create(data: unknown): Promise<Region> {
  const parsed = insertRegionSchema.parse(data);
  return regionRepository.create(parsed);
}

async function update(id: number, data: unknown): Promise<Region | undefined> {
  const parsed = updateRegionSchema.parse(data);
  return regionRepository.update(id, parsed);
}

async function remove(id: number): Promise<boolean> {
  return regionRepository.remove(id);
}

async function generateRandomCrisis(id: number): Promise<Region | undefined> {
  const status =
    crisisStatuses[Math.floor(Math.random() * crisisStatuses.length)];
  return regionRepository.update(id, { status });
}

export const regionService: RegionService = {
  findAll,
  findById,
  findByKingdomId,
  create,
  update,
  remove,
  generateRandomCrisis,
};
