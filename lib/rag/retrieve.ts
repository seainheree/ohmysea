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

export const TOP_K = 6;
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
  options: { k?: number; minScore?: number } = {},
): Promise<RetrievedChunk[]> {
  const k = options.k ?? TOP_K;
  const minScore = options.minScore ?? MIN_SCORE;

  const vector = await embedOne(query);
  const literal = toVectorLiteral(vector);
  const db = getDb();

  const rows = (await db.execute(sql`
    select c.document_id, d.title, c.content,
           1 - (c.embedding <=> ${literal}::vector) as score
    from chunks c
    join documents d on d.id = c.document_id
    order by c.embedding <=> ${literal}::vector
    limit ${k}
  `)) as unknown as Row[];

  return rows
    .map((r) => ({
      documentId: r.document_id,
      title: r.title,
      content: r.content,
      score: Number(r.score),
    }))
    .filter((r) => r.score >= minScore);
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
