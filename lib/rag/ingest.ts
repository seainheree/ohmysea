import { createHash } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { chunks as chunksTable, documents } from "@/lib/db/schema";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";

export type IngestResult = {
  documentId: string;
  title: string;
  jumlahChunk: number;
  duplikat: boolean;
  /** true kalau lampiran dengan isi sama di percakapan yang sama diganti. */
  ditimpa: boolean;
};

export function checksumOf(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Simpan dokumen + chunk ter-embedding.
 *
 * Dua lingkup:
 * - global (conversationId kosong, dari CLI/URL): dokumen identik ditolak.
 * - lampiran (conversationId terisi): isi identik di percakapan yang sama ditimpa.
 *
 * Insert dokumen + chunk dibungkus satu transaksi supaya kegagalan di tengah jalan
 * tidak meninggalkan dokumen tanpa chunk (dulu itu membuat ingest ulang ditolak
 * sebagai duplikat dan dokumennya macet permanen).
 */
export async function ingestDocument(input: {
  title: string;
  source: string;
  text: string;
  conversationId?: string | null;
}): Promise<IngestResult> {
  const checksum = checksumOf(input.text);
  const db = getDb();
  const lingkup = input.conversationId
    ? eq(documents.conversationId, input.conversationId)
    : isNull(documents.conversationId);

  const sudahAda = await db
    .select({ id: documents.id, title: documents.title })
    .from(documents)
    .where(and(eq(documents.checksum, checksum), lingkup))
    .limit(1);

  if (sudahAda[0]) {
    if (!input.conversationId) {
      return {
        documentId: sudahAda[0].id,
        title: sudahAda[0].title,
        jumlahChunk: 0,
        duplikat: true,
        ditimpa: false,
      };
    }
    // Lampiran: buang versi lama, chunk-nya ikut terhapus lewat cascade.
    await db.delete(documents).where(eq(documents.id, sudahAda[0].id));
  }

  const potongan = chunkText(input.text);
  if (potongan.length === 0) throw new Error("Dokumen kosong — tidak ada teks untuk di-ingest");

  const vektor = await embedTexts(potongan);

  const documentId = await db.transaction(async (tx) => {
    const [dokumen] = await tx
      .insert(documents)
      .values({
        title: input.title,
        source: input.source,
        checksum,
        conversationId: input.conversationId ?? null,
      })
      .returning({ id: documents.id });

    if (!dokumen) throw new Error("Gagal menyimpan dokumen");

    await tx.insert(chunksTable).values(
      potongan.map((content, i) => ({
        documentId: dokumen.id,
        ordinal: i,
        content,
        embedding: vektor[i] ?? [],
      })),
    );

    return dokumen.id;
  });

  return {
    documentId,
    title: input.title,
    jumlahChunk: potongan.length,
    duplikat: false,
    ditimpa: Boolean(sudahAda[0]),
  };
}

/**
 * Hapus semua lampiran satu percakapan — lampiran bersifat sekali pakai:
 * setelah jawaban tersimpan, isinya tidak dipakai lagi. Chunk ikut terhapus
 * lewat cascade. Nama berkas tetap terlihat di chip sumber pesan (messages.sources).
 */
export async function hapusLampiranPercakapan(conversationId: string): Promise<number> {
  const db = getDb();
  const hapus = await db
    .delete(documents)
    .where(eq(documents.conversationId, conversationId))
    .returning({ id: documents.id });
  return hapus.length;
}

/** Ambil isi halaman dari URL lewat Firecrawl, kembalikan markdown. */
export async function scrapeUrl(url: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });

  const data = (await res.json()) as {
    success?: boolean;
    data?: { markdown?: string };
    error?: string;
  };

  if (!res.ok || !data.success || !data.data?.markdown) {
    throw new Error(`Firecrawl gagal: ${data.error ?? `HTTP ${res.status}`}`);
  }

  return data.data.markdown;
}
