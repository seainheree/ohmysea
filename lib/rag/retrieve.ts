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

function keChunk(r: Row): RetrievedChunk {
  return {
    documentId: r.document_id,
    title: r.title,
    content: r.content,
    score: Number(r.score),
  };
}

/**
 * Susun hasil akhir dari dua kolam. Dokumen lampiran (`lampiran`) dipakai lebih
 * dulu dan **tanpa ambang skor** — user melampirkannya eksplisit, jadi wajib ikut
 * walau pertanyaannya pendek dan cosine-nya rendah. Dokumen global tetap disaring
 * ambang supaya fakta tak nyambung tidak ikut.
 *
 * Dipisah dari `retrieve()` supaya batas per-dokumen & ambang bisa diuji tanpa DB.
 */
export function pilihPotongan(
  lampiran: RetrievedChunk[],
  global: RetrievedChunk[],
  opsi: { k: number; minScore: number; maksPerDokumen: number },
): RetrievedChunk[] {
  const perDokumen = new Map<string, number>();
  const hasil: RetrievedChunk[] = [];

  function coba(c: RetrievedChunk, butuhSkor: boolean) {
    if (hasil.length >= opsi.k) return;
    if (butuhSkor && c.score < opsi.minScore) return;
    const dipakai = perDokumen.get(c.documentId) ?? 0;
    if (dipakai >= opsi.maksPerDokumen) return;
    perDokumen.set(c.documentId, dipakai + 1);
    hasil.push(c);
  }

  for (const c of lampiran) coba(c, false);
  for (const c of global) coba(c, true);
  return hasil;
}

/** Ambil potongan dokumen paling mirip (cosine similarity via pgvector). */
export async function retrieve(
  query: string,
  options: {
    k?: number;
    minScore?: number;
    maksPerDokumen?: number;
    /** Kalau diisi, dokumen lampiran percakapan ini ikut dicari (dan wajib ikut). */
    conversationId?: string;
    /** true = hanya pakai lampiran percakapan, dokumen global tidak diikutkan. */
    hanyaLampiran?: boolean;
  } = {},
): Promise<RetrievedChunk[]> {
  const k = options.k ?? TOP_K;
  const minScore = options.minScore ?? MIN_SCORE;
  const maksPerDokumen = options.maksPerDokumen ?? 3;
  const conversationId = options.conversationId ?? null;

  const vector = await embedOne(query);
  const literal = toVectorLiteral(vector);
  const db = getDb();

  // Ambil kandidat lebih banyak dari yang dipakai, supaya bisa dibatasi per dokumen:
  // tanpa ini satu dokumen (mis. halaman web yang panjang) bisa memenuhi semua slot
  // dan menenggelamkan fakta dari dokumen lain.
  const kolam = Math.max(k * 4, k + 6);

  // Lampiran dicari terpisah agar selalu ada di kolam walau skornya rendah; batas
  // `k` cukup karena maks 3 potongan/dokumen akan memangkasnya lagi.
  const lampiranRows = conversationId
    ? ((await db.execute(sql`
        select c.document_id, d.title, c.content,
               1 - (c.embedding <=> ${literal}::vector) as score
        from chunks c
        join documents d on d.id = c.document_id
        where d.conversation_id = ${conversationId}::uuid
        order by c.embedding <=> ${literal}::vector
        limit ${k}
      `)) as unknown as Row[])
    : [];

  const globalRows = options.hanyaLampiran
    ? []
    : ((await db.execute(sql`
        select c.document_id, d.title, c.content,
               1 - (c.embedding <=> ${literal}::vector) as score
        from chunks c
        join documents d on d.id = c.document_id
        where d.conversation_id is null
        order by c.embedding <=> ${literal}::vector
        limit ${kolam}
      `)) as unknown as Row[]);

  return pilihPotongan(lampiranRows.map(keChunk), globalRows.map(keChunk), {
    k,
    minScore,
    maksPerDokumen,
  });
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
