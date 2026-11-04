import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit butuh koneksi non-pooler (session, port 5432) untuk menjalankan
 * migrasi. Aplikasi sendiri memakai DATABASE_URL (transaction pooler, 6543).
 */
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "DIRECT_URL / DATABASE_URL belum diisi. Isi .env dulu (lihat .env.example).",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: migrationUrl },
  strict: true,
  verbose: true,
});
