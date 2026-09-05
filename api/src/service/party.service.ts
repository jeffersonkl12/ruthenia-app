import {
  insertPartySchema,
  updatePartySchema,
  type Party,
} from "@/database/schemas/party.schema";
import type { Entity } from "@/database/schemas/entity.schema";
import { partyRepository } from "@/repository/party.repository";
import { entityRepository } from "@/repository/entity.repository";
import { entityService } from "./entity.service";
import type { Service } from "./service.interface";

export interface PartyService extends Service<Party> {
  addMember(partyId: number, entityId: number): Promise<Entity | undefined>;
  removeMember(partyId: number, entityId: number): Promise<Entity | undefined>;
  findByKingdomId(kingdomId: number): Promise<Party[]>;
}

async function findAll(): Promise<Party[]> {
  return partyRepository.findAll();
}

async function findById(id: number): Promise<Party | undefined> {
  return partyRepository.findById(id);
}

async function findByKingdomId(kingdomId: number): Promise<Party[]> {
  return partyRepository.findByKingdomId(kingdomId);
}

async function create(data: unknown): Promise<Party> {
  const parsed = insertPartySchema.parse(data);
  return partyRepository.create(parsed);
}

async function update(id: number, data: unknown): Promise<Party | undefined> {
  const parsed = updatePartySchema.parse(data);
  return partyRepository.update(id, parsed);
}

async function remove(id: number): Promise<boolean> {
  return partyRepository.remove(id);
}

async function addMember(
  partyId: number,
  entityId: number,
): Promise<Entity | undefined> {
  const party = await partyRepository.findById(partyId);
  if (!party) {
    throw new Error(`Party ${partyId} not found`);
  }

  const entity = await entityRepository.findById(entityId);
  if (!entity) {
    throw new Error(`Entity ${entityId} not found`);
  }

  return entityService.update(entityId, { partyId });
}

async function removeMember(
  partyId: number,
  entityId: number,
): Promise<Entity | undefined> {
  const entity = await entityRepository.findById(entityId);
  if (!entity || entity.partyId !== partyId) {
    throw new Error(`Entity ${entityId} is not a member of party ${partyId}`);
  }

  return entityService.update(entityId, { partyId: null });
}

export const partyService: PartyService = {
  findAll,
  findById,
  findByKingdomId,
  create,
  update,
  remove,
  addMember,
  removeMember,
};
