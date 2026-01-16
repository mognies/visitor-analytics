import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error(
    "TURSO_DATABASE_URL is required. For local development, use: turso dev --db-file analytics.db",
  );
}

export const db = drizzle(
  createClient({
    url: databaseUrl,
    authToken: authToken,
  }),
  { schema },
);
