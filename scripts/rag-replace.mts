/**
 * Ganti dokumen di basis pengetahuan: hapus dokumen dengan judul tertentu
 * (chunk ikut terhapus lewat cascade), lalu ingest ulang dari berkas.
 * Jalankan: pnpm exec tsx scripts/rag-replace.mts <berkas> [judul]
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { eq } from "drizzle-orm";

import { getDb } from "../lib/db/client";
import { documents } from "../lib/db/schema";
import { ingestDocument } from "../lib/rag/ingest";

process.loadEnvFile(".env");

const berkas = process.argv[2];
if (!berkas) {
  console.error("Pakai: pnpm exec tsx scripts/rag-replace.mts <berkas> [judul]");
  process.exit(1);
}

const judul = process.argv[3] ?? basename(berkas);
const db = getDb();

const lama = await db.delete(documents).where(eq(documents.title, judul)).returning({ id: documents.id });
console.log(`Dihapus: ${lama.length} dokumen lama berjudul "${judul}" (chunk ikut terhapus)`);

const teks = await readFile(berkas, "utf8");
const hasil = await ingestDocument({ title: judul, source: `file:${berkas}`, text: teks });
console.log(`Ditambahkan: ${hasil.jumlahChunk} potongan dari "${hasil.title}"`);
console.log(`documentId: ${hasil.documentId}`);

process.exit(0);
