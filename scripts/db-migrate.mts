/**
 * Jalankan migrasi ke database Supabase.
 * - Memakai DIRECT_URL (koneksi non-pooler) karena migrasi tidak cocok lewat pooler transaksi.
 * - Mengaktifkan ekstensi `vector` lebih dulu, sebelum tabel berkolom vector dibuat.
 *
 * Jalankan: pnpm db:migrate
 * Ekstensi .mts supaya tsx menjalankannya sebagai ESM (butuh untuk top-level await).
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Skrip CLI tidak dijalankan Next.js, jadi .env tidak dimuat otomatis.
try {
  process.loadEnvFile(".env");
} catch {
  console.warn("catatan: .env tidak ditemukan — mengandalkan environment shell");
}

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error("GAGAL: DIRECT_URL / DATABASE_URL belum diisi di .env");
  process.exit(1);
}

const client = postgres(url, { max: 1, ssl: "require" });

try {
  console.log("1/2 mengaktifkan ekstensi vector (pgvector)...");
  await client.unsafe("create extension if not exists vector");
  const [ext] = await client<{ extversion: string }[]>`
    select extversion from pg_extension where extname = 'vector'
  `;
  console.log(`    pgvector aktif, versi ${ext?.extversion ?? "(tidak terbaca)"}`);

  console.log("2/2 menjalankan migrasi drizzle...");
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });

  const tabel = await client<{ table_name: string }[]>`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `;
  console.log("    tabel di public:", tabel.map((t) => t.table_name).join(", "));

  console.log("SELESAI: migrasi berhasil.");
} catch (err) {
  console.error("GAGAL: migrasi error —", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
