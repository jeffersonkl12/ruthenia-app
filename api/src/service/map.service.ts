import type { Entity } from "@/database/schemas/entity.schema";
import type { Location, NewLocation } from "@/database/schemas/location.schema";
import { locationService } from "./location.service";
import { regionService } from "./region.service";
import { entityService } from "./entity.service";

export interface MapService {
  createLocation(data: NewLocation): Promise<Location>;
  moveEntityToLocation(entityId: number, locationId: number): Promise<Entity>;
  moveEntityToRegion(entityId: number, regionId: number): Promise<Entity>;
}

async function createLocation(data: NewLocation): Promise<Location> {
  const region = await regionService.findById(data.regionId);
  if (!region) {
    throw new Error(`Region ${data.regionId} not found`);
  }

  return locationService.create(data);
}

async function moveEntityToLocation(
  entityId: number,
  locationId: number,
): Promise<Entity> {
  const entity = await entityService.findById(entityId);
  if (!entity) {
    throw new Error(`Entity ${entityId} not found`);
  }

  const location = await locationService.findById(locationId);
  if (!location) {
    throw new Error(`Location ${locationId} not found`);
  }

  const moved = await entityService.update(entityId, {
    currentLocationId: location.id,
    currentRegionId: location.regionId,
  });

  if (!moved) {
    throw new Error(`Failed to move entity ${entityId}`);
  }

  return moved;
}

async function moveEntityToRegion(
  entityId: number,
  regionId: number,
): Promise<Entity> {
  const entity = await entityService.findById(entityId);
  if (!entity) {
    throw new Error(`Entity ${entityId} not found`);
  }

  const region = await regionService.findById(regionId);
  if (!region) {
    throw new Error(`Region ${regionId} not found`);
  }

  const moved = await entityService.update(entityId, {
    currentRegionId: region.id,
    currentLocationId: null,
  });

  if (!moved) {
    throw new Error(`Failed to move entity ${entityId}`);
  }

  return moved;
}

export const mapService: MapService = {
  createLocation,
  moveEntityToLocation,
  moveEntityToRegion,
};
