/** Diagnosa retrieval: cari potongan yang memuat kata kunci tertentu dan peringkatnya. */
import { sql } from "drizzle-orm";

import { getDb } from "../lib/db/client";
import { embedOne, toVectorLiteral } from "../lib/rag/embed";

process.loadEnvFile(".env");

const kata = process.argv[2] ?? "top-k";
const query = process.argv[3] ?? "berapa top-k dan ambang skor untuk RAG ambang kosinus";
const k = Number(process.argv[4] ?? 10);

const db = getDb();

const isi = await db.execute<{ title: string; ordinal: number; content: string }>(sql`
  select d.title, c.ordinal, c.content
  from chunks c join documents d on d.id = c.document_id
  where c.content ilike ${"%" + kata + "%"}
  order by d.title, c.ordinal
`);
console.log(`Potongan yang memuat "${kata}": ${isi.length}`);
for (const r of isi) {
  console.log(`  ${r.title} #${r.ordinal}: ${r.content.slice(0, 120).replace(/\n/g, " ")}`);
}

const vec = toVectorLiteral(await embedOne(query));
const rank = await db.execute<{ title: string; ordinal: number; score: number; content: string }>(sql`
  select d.title, c.ordinal, 1 - (c.embedding <=> ${vec}::vector) as score, c.content
  from chunks c join documents d on d.id = c.document_id
  order by c.embedding <=> ${vec}::vector
  limit ${k}
`);

console.log(`\nPeringkat untuk query "${query}" (k=${k}):`);
rank.forEach((r, i) => {
  const tanda = r.content.toLowerCase().includes(kata.toLowerCase()) ? " <-- MEMUAT KATA KUNCI" : "";
  console.log(`  ${String(i + 1).padStart(2)}. ${r.score.toFixed(3)} ${r.title} #${r.ordinal}${tanda}`);
});

process.exit(0);
