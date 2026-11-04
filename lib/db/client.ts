import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getEnv } from "@/lib/env";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let client: ReturnType<typeof postgres> | null = null;
let db: Db | null = null;

/**
 * Koneksi aplikasi memakai DATABASE_URL (Supavisor transaction pooler, port 6543).
 * Transaction mode tidak mendukung prepared statement → prepare: false.
 */
export function getDb(): Db {
  if (db) return db;

  const env = getEnv();

  client = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: "require",
  });

  db = drizzle(client, { schema });
  return db;
}

/** Untuk /api/health: pastikan DB benar-benar bisa dijawab, bukan hanya terkoneksi. */
export async function pingDb(): Promise<{ ok: boolean; detail: string }> {
  try {
    const sql = getDb();
    const rows = await sql.execute<{ ok: number }>("select 1 as ok");
    return { ok: rows.length > 0, detail: "select 1 berhasil" };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
