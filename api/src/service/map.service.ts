import type { Character } from "@/database/schemas/character.schema";
import type { Location, NewLocation } from "@/database/schemas/location.schema";
import { locationService } from "./location.service";
import { regionService } from "./region.service";
import { characterService } from "./character.service";

export interface MapService {
  createLocation(data: NewLocation): Promise<Location>;
  moveCharacterToLocation(
    characterId: number,
    locationId: number,
  ): Promise<Character>;
  moveCharacterToRegion(
    characterId: number,
    regionId: number,
  ): Promise<Character>;
}

async function createLocation(data: NewLocation): Promise<Location> {
  const region = await regionService.findById(data.regionId);
  if (!region) {
    throw new Error(`Region ${data.regionId} not found`);
  }

  return locationService.create(data);
}

async function moveCharacterToLocation(
  characterId: number,
  locationId: number,
): Promise<Character> {
  const character = await characterService.findById(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const location = await locationService.findById(locationId);
  if (!location) {
    throw new Error(`Location ${locationId} not found`);
  }

  const moved = await characterService.update(characterId, {
    currentLocationId: location.id,
    currentRegionId: location.regionId,
  });

  if (!moved) {
    throw new Error(`Failed to move character ${characterId}`);
  }

  return moved;
}

async function moveCharacterToRegion(
  characterId: number,
  regionId: number,
): Promise<Character> {
  const character = await characterService.findById(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const region = await regionService.findById(regionId);
  if (!region) {
    throw new Error(`Region ${regionId} not found`);
  }

  const moved = await characterService.update(characterId, {
    currentRegionId: region.id,
    currentLocationId: null,
  });

  if (!moved) {
    throw new Error(`Failed to move character ${characterId}`);
  }

  return moved;
}

export const mapService: MapService = {
  createLocation,
  moveCharacterToLocation,
  moveCharacterToRegion,
};
