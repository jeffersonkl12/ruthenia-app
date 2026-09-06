import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Mesmo default do client (api/src/database/client.database.ts).
const url = process.env.DATABASE_URL ?? "file:./ruthenia.db";

export default defineConfig({
  dialect: "turso", // libSQL, tanto local (file:) quanto Turso remoto
  schema: "./src/database/schemas/index.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
