import {
  insertLocationSchema,
  updateLocationSchema,
  type Location,
} from "@/database/schemas/location.schema";
import { locationRepository } from "@/repository/location.repository";
import type { Service } from "./service.interface";

export interface LocationService extends Service<Location> {
  findByRegionId(regionId: number): Promise<Location[]>;
}

async function findAll(): Promise<Location[]> {
  return locationRepository.findAll();
}

async function findById(id: number): Promise<Location | undefined> {
  return locationRepository.findById(id);
}

async function findByRegionId(regionId: number): Promise<Location[]> {
  return locationRepository.findByRegionId(regionId);
}

async function create(data: unknown): Promise<Location> {
  const parsed = insertLocationSchema.parse(data);
  return locationRepository.create(parsed);
}

async function update(
  id: number,
  data: unknown,
): Promise<Location | undefined> {
  const parsed = updateLocationSchema.parse(data);
  return locationRepository.update(id, parsed);
}

async function remove(id: number): Promise<boolean> {
  return locationRepository.remove(id);
}

export const locationService: LocationService = {
  findAll,
  findById,
  findByRegionId,
  create,
  update,
  remove,
};
