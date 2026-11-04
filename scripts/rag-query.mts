/**
 * Cek kualitas retrieval tanpa membuka server.
 * Jalankan: pnpm rag:query "berapa dimensi vektor embedding"
 */
import { MIN_SCORE, retrieve } from "../lib/rag/retrieve";

process.loadEnvFile(".env");

const q = process.argv.slice(2).join(" ").trim();

if (!q) {
  console.error('Pakai: pnpm rag:query "<kata kunci>"');
  process.exit(1);
}

const potongan = await retrieve(q, { k: 4 });

console.log(`Query: ${q}`);
console.log(`Ambang skor: ${MIN_SCORE} | ditemukan: ${potongan.length} potongan\n`);

if (potongan.length === 0) {
  console.log("Tidak ada potongan yang lolos ambang. Basis pengetahuan mungkin masih kosong");
  console.log("(jalankan: pnpm rag:ingest <berkas|url>) atau ambang terlalu tinggi.");
  process.exitCode = 3;
}

for (const [i, p] of potongan.entries()) {
  console.log(`[${i + 1}] ${p.title} — skor ${p.score.toFixed(3)}`);
  console.log(`    ${p.content.slice(0, 160).replace(/\n/g, " ")}...`);
  console.log();
}
