import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { pesanError, requireSession } from "@/lib/guard";
import { ingestDocument } from "@/lib/rag/ingest";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/attachments — simpan lampiran teks ke satu percakapan.
 *
 * Berkas asli tidak pernah sampai ke sini: browser mengekstrak teksnya lebih dulu
 * (batas body Vercel Functions 4,5 MB), jadi yang dikirim hanya teks.
 */
const bodySchema = z.object({
  conversationId: z.uuid(),
  filename: z.string().min(1).max(200),
  mime: z.string().max(120).optional().default(""),
  size: z.number().int().nonnegative().max(10 * 1024 * 1024),
  text: z.string().min(1).max(500_000),
});

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
    const hasil = await ingestDocument({
      title: body.filename,
      source: `lampiran:${body.filename}`,
      text: body.text,
      conversationId: body.conversationId,
    });

    return NextResponse.json({
      ok: true,
      documentId: hasil.documentId,
      jumlahChunk: hasil.jumlahChunk,
      ditimpa: hasil.ditimpa,
      pesan: hasil.ditimpa
        ? `"${body.filename}" diganti — ${hasil.jumlahChunk} potongan.`
        : `"${body.filename}" siap dipakai — ${hasil.jumlahChunk} potongan.`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal menyimpan lampiran: ${pesanError(err)}` },
      { status: 500 },
    );
  }
}