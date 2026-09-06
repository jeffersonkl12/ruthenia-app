import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  sessions,
  type Session,
  type NewSession,
  type UpdateSession,
} from "@/database/schemas/session.schema";
import type { Repository } from "./repository.interface";

export interface SessionRepository
  extends Repository<Session, NewSession, UpdateSession> {}

async function findAll(): Promise<Session[]> {
  return db.select().from(sessions);
}

async function findById(id: number): Promise<Session | undefined> {
  const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
  return row;
}

async function create(data: NewSession): Promise<Session> {
  const [row] = await db.insert(sessions).values(data).returning();
  return row;
}

async function update(
  id: number,
  data: UpdateSession,
): Promise<Session | undefined> {
  const [row] = await db
    .update(sessions)
    .set(data)
    .where(eq(sessions.id, id))
    .returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(sessions)
    .where(eq(sessions.id, id))
    .returning({ id: sessions.id });
  return deleted.length > 0;
}

export const sessionRepository: SessionRepository = {
  findAll,
  findById,
  create,
  update,
  remove,
};
