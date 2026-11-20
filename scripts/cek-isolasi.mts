/**
 * Bukti isolasi lingkup lampiran:
 * - percakapan yang punya lampiran boleh menemukan isinya,
 * - percakapan lain tidak boleh melihatnya (hanya dokumen global).
 * Sekaligus memastikan "timpa" tidak meninggalkan duplikat.
 */
import postgres from "postgres";

process.loadEnvFile(".env");
import { retrieve } from "../lib/rag/retrieve";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL kosong");
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 10, ssl: "require" });

try {
  const [punya] = await sql`
    select conversation_id::text as id from documents
    where conversation_id is not null limit 1`;
  const [lain] = await sql`
    select c.id::text as id from conversations c
    where not exists (select 1 from documents d where d.conversation_id = c.id)
    limit 1`;

  const [dup] = await sql`
    select count(*)::int as n from documents where title = 'catatan.md'`;

  console.log(`percakapan berlampiran: ${punya?.id?.slice(0, 8)}`);
  console.log(`percakapan lain      : ${lain?.id?.slice(0, 8)}`);
  console.log(`baris dokumen catatan.md setelah timpa: ${dup.n} (harus 1)\n`);

  if (punya?.id) {
    const a = await retrieve("kata sandi gudang", { conversationId: punya.id });
    console.log("DENGAN lampiran ->", a.map((r) => `${r.title} (${r.score.toFixed(2)})`).join(", ") || "(kosong)");
  }
  if (lain?.id) {
    const b = await retrieve("kata sandi gudang", { conversationId: lain.id });
    const bocor = b.some((r) => r.title === "catatan.md");
    console.log("TANPA lampiran  ->", b.map((r) => `${r.title} (${r.score.toFixed(2)})`).join(", ") || "(kosong)");
    console.log(bocor ? "GAGAL: lampiran bocor ke percakapan lain" : "OK: lampiran tidak bocor ke percakapan lain");
  }
} catch (e) {
  console.error("GAGAL:", String(e).slice(0, 300));
} finally {
  await sql.end();
}