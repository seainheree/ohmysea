import postgres from "postgres";

process.loadEnvFile(".env");

const sql = postgres(process.env.DIRECT_URL!, { max: 1, ssl: "require" });

const col = await sql<{ column_name: string; udt_name: string; is_nullable: string }[]>`
  select column_name, udt_name, is_nullable from information_schema.columns
  where table_name = 'chunks' order by ordinal_position
`;
console.log("kolom chunks:", col.map((c) => `${c.column_name}:${c.udt_name}${c.is_nullable === "NO" ? "" : "?"}`).join(", "));

const idx = await sql<{ indexname: string; indexdef: string }[]>`
  select indexname, indexdef from pg_indexes
  where tablename in ('chunks', 'messages', 'images') order by indexname
`;
for (const i of idx) console.log("index:", i.indexname);
const hnsw = idx.find((i) => i.indexdef.includes("hnsw"));
console.log("HNSW:", hnsw ? hnsw.indexdef.replace(/\s+/g, " ") : "TIDAK ADA");

const ext = await sql<{ extname: string; extversion: string }[]>`
  select extname, extversion from pg_extension where extname in ('vector', 'pgcrypto')
`;
console.log("ekstensi:", ext.map((e) => `${e.extname}@${e.extversion}`).join(", "));

const mig = await sql<{ hash: string; created_at: string }[]>`
  select hash, created_at from drizzle.__drizzle_migrations order by created_at
`;
console.log("migrasi tercatat di drizzle.__drizzle_migrations:", mig.length);

const fk = await sql<{ conname: string }[]>`
  select conname from pg_constraint where contype = 'f' order by conname
`;
console.log("foreign key:", fk.map((f) => f.conname).join(", ") || "(tidak ada)");

await sql.end();
