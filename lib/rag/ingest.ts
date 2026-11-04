import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { chunks as chunksTable, documents } from "@/lib/db/schema";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";

export type IngestResult = {
  documentId: string;
  title: string;
  jumlahChunk: number;
  duplikat: boolean;
};

export function checksumOf(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** Simpan dokumen + chunk ter-embedding. Dokumen identik (checksum sama) ditolak. */
export async function ingestDocument(input: {
  title: string;
  source: string;
  text: string;
}): Promise<IngestResult> {
  const checksum = checksumOf(input.text);
  const db = getDb();

  const sudahAda = await db
    .select({ id: documents.id, title: documents.title })
    .from(documents)
    .where(eq(documents.checksum, checksum))
    .limit(1);

  if (sudahAda[0]) {
    return {
      documentId: sudahAda[0].id,
      title: sudahAda[0].title,
      jumlahChunk: 0,
      duplikat: true,
    };
  }

  const potongan = chunkText(input.text);
  if (potongan.length === 0) throw new Error("Dokumen kosong — tidak ada teks untuk di-ingest");

  const vektor = await embedTexts(potongan);

  const [dokumen] = await db
    .insert(documents)
    .values({ title: input.title, source: input.source, checksum })
    .returning({ id: documents.id });

  if (!dokumen) throw new Error("Gagal menyimpan dokumen");

  await db.insert(chunksTable).values(
    potongan.map((content, i) => ({
      documentId: dokumen.id,
      ordinal: i,
      content,
      embedding: vektor[i] ?? [],
    })),
  );

  return {
    documentId: dokumen.id,
    title: input.title,
    jumlahChunk: potongan.length,
    duplikat: false,
  };
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
