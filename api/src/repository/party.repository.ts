import { eq } from "drizzle-orm";
import { db } from "@/database";
import {
  parties,
  type Party,
  type NewParty,
  type UpdateParty,
} from "@/database/schemas/party.schema";
import type { Repository } from "./repository.interface";

export interface PartyRepository
  extends Repository<Party, NewParty, UpdateParty> {
  findByKingdomId(kingdomId: number): Promise<Party[]>;
}

async function findAll(): Promise<Party[]> {
  return db.select().from(parties);
}

async function findById(id: number): Promise<Party | undefined> {
  const [row] = await db.select().from(parties).where(eq(parties.id, id));
  return row;
}

async function findByKingdomId(kingdomId: number): Promise<Party[]> {
  return db.select().from(parties).where(eq(parties.kingdomId, kingdomId));
}

async function create(data: NewParty): Promise<Party> {
  const [row] = await db.insert(parties).values(data).returning();
  return row;
}

async function update(
  id: number,
  data: UpdateParty,
): Promise<Party | undefined> {
  const [row] = await db
    .update(parties)
    .set(data)
    .where(eq(parties.id, id))
    .returning();
  return row;
}

async function remove(id: number): Promise<boolean> {
  const deleted = await db
    .delete(parties)
    .where(eq(parties.id, id))
    .returning({ id: parties.id });
  return deleted.length > 0;
}

export const partyRepository: PartyRepository = {
  findAll,
  findById,
  findByKingdomId,
  create,
  update,
  remove,
};
