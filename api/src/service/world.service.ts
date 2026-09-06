import type { Kingdom } from "@/database/schemas/kingdom.schema";
import type { Region } from "@/database/schemas/region.schema";
import type { Location } from "@/database/schemas/location.schema";
import { kingdomService } from "./kingdom.service";
import { regionService } from "./region.service";
import { locationService } from "./location.service";
import { partyService } from "./party.service";
import { characterService } from "./character.service";

export interface WorldService {
  foundKingdom(
    kingdomData: unknown,
    regionData: Record<string, unknown>,
  ): Promise<{ kingdom: Kingdom; region: Region }>;
  cloneKingdom(kingdomId: number): Promise<Kingdom>;
}

async function foundKingdom(
  kingdomData: unknown,
  regionData: Record<string, unknown>,
): Promise<{ kingdom: Kingdom; region: Region }> {
  const kingdom = await kingdomService.create(kingdomData);
  const region = await regionService.create({
    ...regionData,
    kingdomId: kingdom.id,
  });
  return { kingdom, region };
}

async function cloneKingdom(kingdomId: number): Promise<Kingdom> {
  const sourceKingdom = await kingdomService.findById(kingdomId);
  if (!sourceKingdom) {
    throw new Error(`Kingdom ${kingdomId} not found`);
  }

  const clonedKingdom = await kingdomService.create({
    name: sourceKingdom.name,
    status: sourceKingdom.status,
  });

  const sourceRegions = await regionService.findByKingdomId(sourceKingdom.id);
  for (const sourceRegion of sourceRegions) {
    const clonedRegion = await regionService.create({
      name: sourceRegion.name,
      status: sourceRegion.status,
      wealth: sourceRegion.wealth,
      infrastructure: sourceRegion.infrastructure,
      biome: sourceRegion.biome,
      kingdomId: clonedKingdom.id,
    });

    await cloneLocationTree(sourceRegion.id, clonedRegion.id);
  }

  const clonedPartyIdByOriginalId = await clonePartiesForKingdom(
    sourceKingdom.id,
    clonedKingdom.id,
  );

  await cloneCharactersForKingdom(
    sourceKingdom.id,
    clonedKingdom.id,
    clonedPartyIdByOriginalId,
  );

  return clonedKingdom;
}

async function clonePartiesForKingdom(
  sourceKingdomId: number,
  clonedKingdomId: number,
): Promise<Map<number, number>> {
  const sourceParties = await partyService.findByKingdomId(sourceKingdomId);
  const clonedIdByOriginalId = new Map<number, number>();

  for (const sourceParty of sourceParties) {
    const clonedParty = await partyService.create({
      name: sourceParty.name,
      kingdomId: clonedKingdomId,
    });
    clonedIdByOriginalId.set(sourceParty.id, clonedParty.id);
  }

  return clonedIdByOriginalId;
}

async function cloneCharactersForKingdom(
  sourceKingdomId: number,
  clonedKingdomId: number,
  clonedPartyIdByOriginalId: Map<number, number>,
): Promise<void> {
  const sourceCharacters =
    await characterService.findByKingdomId(sourceKingdomId);

  for (const sourceCharacter of sourceCharacters) {
    const clonedPartyId = sourceCharacter.partyId
      ? (clonedPartyIdByOriginalId.get(sourceCharacter.partyId) ?? null)
      : null;

    await characterService.create({
      name: sourceCharacter.name,
      age: sourceCharacter.age,
      gender: sourceCharacter.gender,
      race: sourceCharacter.race,
      socialStatus: sourceCharacter.socialStatus,
      isPlayer: sourceCharacter.isPlayer,
      occupation: sourceCharacter.occupation,
      personality: sourceCharacter.personality,
      appearance: sourceCharacter.appearance,
      background: sourceCharacter.background,
      kingdomId: clonedKingdomId,
      partyId: clonedPartyId,
    });
  }
}

async function cloneLocationTree(
  sourceRegionId: number,
  clonedRegionId: number,
): Promise<void> {
  const sourceLocations = await locationService.findByRegionId(sourceRegionId);
  const clonedIdByOriginalId = new Map<number, number>();

  async function cloneNode(location: Location): Promise<void> {
    const clonedParentId = location.parentId
      ? (clonedIdByOriginalId.get(location.parentId) ?? null)
      : null;

    const clonedLocation = await locationService.create({
      name: location.name,
      type: location.type,
      regionId: clonedRegionId,
      parentId: clonedParentId,
    });
    clonedIdByOriginalId.set(location.id, clonedLocation.id);

    const children = sourceLocations.filter(
      (candidate) => candidate.parentId === location.id,
    );
    for (const child of children) {
      await cloneNode(child);
    }
  }

  const roots = sourceLocations.filter(
    (location) => location.parentId === null,
  );
  for (const root of roots) {
    await cloneNode(root);
  }
}

export const worldService: WorldService = { foundKingdom, cloneKingdom };
