/**
 * Ingest dokumen ke basis pengetahuan ohmysea.
 * Jalankan: pnpm rag:ingest <berkas|url> [judul]
 * Contoh:   pnpm rag:ingest docs/PRD.md
 *           pnpm rag:ingest https://console.groq.com/docs/models "Groq Models"
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { ingestDocument, scrapeUrl } from "../lib/rag/ingest";

process.loadEnvFile(".env");

const target = process.argv[2];
const judulArg = process.argv[3];

if (!target) {
  console.error("Pakai: pnpm rag:ingest <berkas|url> [judul]");
  process.exit(1);
}

const isUrl = /^https?:\/\//i.test(target);

if (isUrl) {
  const kunci = process.env.FIRECRAWL_API_KEY;
  if (!kunci) {
    console.error("GAGAL: FIRECRAWL_API_KEY belum diisi di .env");
    process.exit(1);
  }
  const judul = judulArg ?? target;
  const teks = await scrapeUrl(target, kunci);
  const hasil = await ingestDocument({ title: judul, source: target, text: teks });
  laporkan(hasil, target);
} else {
  const teks = await readFile(target, "utf8");
  const judul = judulArg ?? basename(target);
  const hasil = await ingestDocument({ title: judul, source: `file:${target}`, text: teks });
  laporkan(hasil, target);
}

function laporkan(
  hasil: { duplikat: boolean; jumlahChunk: number; title: string; documentId: string },
  sumber: string,
) {
  if (hasil.duplikat) {
    console.log(`DITOLAK: "${hasil.title}" sudah pernah di-ingest (checksum sama).`);
    console.log(`documentId: ${hasil.documentId}`);
    process.exitCode = 2;
    return;
  }
  console.log(`SELESAI: ${jumlah(hasil.jumlahChunk)} dari "${hasil.title}" (${sumber})`);
  console.log(`documentId: ${hasil.documentId}`);
}

function jumlah(n: number) {
  return `${n} potongan`;
}
