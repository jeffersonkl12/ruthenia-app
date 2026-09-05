import { Database } from "./client.database";

const instance = Database.getInstance();

export const db = instance.orm;
export const client = instance.client;
export type DrizzleDatabase = typeof db;
export { Database };
export * as schema from "./schemas";
