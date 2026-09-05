import {
  insertEntitySchema,
  updateEntitySchema,
  type Entity,
} from "@/database/schemas/entity.schema";
import { entityRepository } from "@/repository/entity.repository";
import { partyRepository } from "@/repository/party.repository";
import type { Service } from "./service.interface";

export interface EntityService extends Service<Entity> {
  findByKingdomId(kingdomId: number): Promise<Entity[]>;
}

async function findAll(): Promise<Entity[]> {
  return entityRepository.findAll();
}

async function findById(id: number): Promise<Entity | undefined> {
  return entityRepository.findById(id);
}

async function findByKingdomId(kingdomId: number): Promise<Entity[]> {
  return entityRepository.findByKingdomId(kingdomId);
}

async function create(data: unknown): Promise<Entity> {
  const parsed = insertEntitySchema.parse(data);
  return entityRepository.create(parsed);
}

async function update(id: number, data: unknown): Promise<Entity | undefined> {
  const before = await entityRepository.findById(id);
  const parsed = updateEntitySchema.parse(data);
  const after = await entityRepository.update(id, parsed);

  if (before?.partyId && before.partyId !== after?.partyId) {
    await deletePartyIfEmpty(before.partyId);
  }

  return after;
}

async function remove(id: number): Promise<boolean> {
  const before = await entityRepository.findById(id);
  const removed = await entityRepository.remove(id);

  if (removed && before?.partyId) {
    await deletePartyIfEmpty(before.partyId);
  }

  return removed;
}

async function deletePartyIfEmpty(partyId: number): Promise<void> {
  const remainingMembers = await entityRepository.findByPartyId(partyId);
  if (remainingMembers.length === 0) {
    await partyRepository.remove(partyId);
  }
}

export const entityService: EntityService = {
  findAll,
  findById,
  findByKingdomId,
  create,
  update,
  remove,
};
