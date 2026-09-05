import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./ruthenia.db";

export class Database {
  private static instance: Database;

  public readonly client: Client;
  public readonly orm: LibSQLDatabase;

  private constructor() {
    this.client = createClient({ url: DATABASE_URL });
    this.orm = drizzle({ client: this.client });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public close(): void {
    this.client.close();
  }
}
