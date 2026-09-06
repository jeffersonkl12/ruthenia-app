import {
  insertSessionSchema,
  updateSessionSchema,
  type Session,
} from "@/database/schemas/session.schema";
import { sessionRepository } from "@/repository/session.repository";
import type { Service } from "./service.interface";

export interface SessionService extends Service<Session> {}

async function findAll(): Promise<Session[]> {
  return sessionRepository.findAll();
}

async function findById(id: number): Promise<Session | undefined> {
  return sessionRepository.findById(id);
}

async function create(data: unknown): Promise<Session> {
  const parsed = insertSessionSchema.parse(data);
  return sessionRepository.create(parsed);
}

async function update(
  id: number,
  data: unknown,
): Promise<Session | undefined> {
  const parsed = updateSessionSchema.parse(data);
  return sessionRepository.update(id, parsed);
}

async function remove(id: number): Promise<boolean> {
  return sessionRepository.remove(id);
}

export const sessionService: SessionService = {
  findAll,
  findById,
  create,
  update,
  remove,
};
