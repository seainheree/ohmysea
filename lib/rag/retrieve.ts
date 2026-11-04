import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type { RagSource } from "@/lib/db/schema";
import { embedOne, toVectorLiteral } from "./embed";

export type RetrievedChunk = {
  documentId: string;
  title: string;
  content: string;
  score: number;
};

export const TOP_K = 8;
export const MIN_SCORE = 0.3;

type Row = {
  document_id: string;
  title: string;
  content: string;
  score: number;
};

/** Ambil potongan dokumen paling mirip (cosine similarity via pgvector). */
export async function retrieve(
  query: string,
  options: { k?: number; minScore?: number; maksPerDokumen?: number } = {},
): Promise<RetrievedChunk[]> {
  const k = options.k ?? TOP_K;
  const minScore = options.minScore ?? MIN_SCORE;
  const maksPerDokumen = options.maksPerDokumen ?? 3;

  const vector = await embedOne(query);
  const literal = toVectorLiteral(vector);
  const db = getDb();

  // Ambil kandidat lebih banyak dari yang dipakai, supaya bisa dibatasi per dokumen:
  // tanpa ini satu dokumen (mis. halaman web yang panjang) bisa memenuhi semua slot
  // dan menenggelamkan fakta dari dokumen lain.
  const kolam = Math.max(k * 4, k + 6);

  const rows = (await db.execute(sql`
    select c.document_id, d.title, c.content,
           1 - (c.embedding <=> ${literal}::vector) as score
    from chunks c
    join documents d on d.id = c.document_id
    order by c.embedding <=> ${literal}::vector
    limit ${kolam}
  `)) as unknown as Row[];

  const kandidat = rows
    .map((r) => ({
      documentId: r.document_id,
      title: r.title,
      content: r.content,
      score: Number(r.score),
    }))
    .filter((r) => r.score >= minScore);

  const perDokumen = new Map<string, number>();
  const hasil: RetrievedChunk[] = [];

  for (const c of kandidat) {
    const dipakai = perDokumen.get(c.documentId) ?? 0;
    if (dipakai >= maksPerDokumen) continue;
    perDokumen.set(c.documentId, dipakai + 1);
    hasil.push(c);
    if (hasil.length >= k) break;
  }

  return hasil;
}

export function toSources(chunks: RetrievedChunk[]): RagSource[] {
  const terlihat = new Set<string>();
  const hasil: RagSource[] = [];
  for (const c of chunks) {
    if (terlihat.has(c.documentId)) continue;
    terlihat.add(c.documentId);
    hasil.push({ documentId: c.documentId, title: c.title, score: Number(c.score.toFixed(3)) });
  }
  return hasil;
}
