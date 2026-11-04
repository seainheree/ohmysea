import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getEnv } from "@/lib/env";
import { pesanError, requireSession } from "@/lib/guard";
import { ingestDocument, scrapeUrl } from "@/lib/rag/ingest";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z
  .object({
    title: z.string().min(1, "Judul wajib").max(120),
    text: z.string().min(1).max(500_000).optional(),
    url: z.url().optional(),
  })
  .refine((v) => Boolean(v.text) !== Boolean(v.url), {
    message: "Isi salah satu: text atau url (jangan keduanya)",
  });

/** POST /api/rag/ingest — masukkan dokumen (teks langsung atau URL) ke basis pengetahuan. */
export async function POST(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Body tidak valid: ${pesanError(err)}` },
      { status: 400 },
    );
  }

  try {
    const env = getEnv();
    let teks = body.text ?? "";
    let sumber = `file:${body.title}`;

    if (body.url) {
      if (!env.FIRECRAWL_API_KEY) {
        return NextResponse.json(
          { ok: false, pesan: "FIRECRAWL_API_KEY belum diisi — ingest dari URL tidak tersedia." },
          { status: 400 },
        );
      }
      teks = await scrapeUrl(body.url, env.FIRECRAWL_API_KEY);
      sumber = body.url;
    }

    const hasil = await ingestDocument({ title: body.title, source: sumber, text: teks });

    if (hasil.duplikat) {
      return NextResponse.json(
        {
          ok: false,
          duplikat: true,
          pesan: `Dokumen ini sudah pernah di-ingest sebagai "${hasil.title}".`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      pesan: `Tersimpan: ${hasil.jumlahChunk} potongan dari "${hasil.title}".`,
      documentId: hasil.documentId,
      jumlahChunk: hasil.jumlahChunk,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Ingest gagal: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}
