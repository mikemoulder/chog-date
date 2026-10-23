import "server-only";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

// Postgres in production (DATABASE_URL), PGlite on disk in dev. Same dialect, same schema.
// Migrations in ./drizzle are applied once per process on first use.

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

async function connect(): Promise<Db> {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (process.env.DATABASE_URL) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    // Serverless + Neon's pooler: one connection per instance, no prepared statements, and drop
    // idle connections before Neon does (stale ones surface as ECONNRESET).
    const db = drizzle(postgres(process.env.DATABASE_URL, { prepare: false, max: 1, ssl: "require", idle_timeout: 20, max_lifetime: 300, connect_timeout: 10 }), { schema });
    await migrate(db, { migrationsFolder });
    return db as unknown as Db;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const db = drizzle(new PGlite(path.join(process.cwd(), ".pglite")), { schema });
  await migrate(db, { migrationsFolder });
  return db as unknown as Db;
}

const g = globalThis as unknown as { __chogDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  g.__chogDb ??= connect().catch((e) => {
    g.__chogDb = undefined;
    throw e;
  });
  return g.__chogDb;
}

export { schema };
