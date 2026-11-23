import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { gabungTeksVisi, lihatGambar } from "@/lib/ai/vision";
import { pesanError, requireSession } from "@/lib/guard";
import { ingestDocument } from "@/lib/rag/ingest";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Batas gambar yang diterima: body Vercel Functions 4,5 MB, sisakan ruang untuk field lain. */
const MAKS_BYTE = 4 * 1024 * 1024;
const MIME_DIIZINKAN = new Set(["image/jpeg", "image/png", "image/webp"]);

const idSchema = z.uuid();

/**
 * POST /api/attachments/image — lampirkan gambar ke satu percakapan.
 *
 * Bedanya dengan /api/attachments: gambar tidak bisa jadi teks lewat OCR saja,
 * jadi server meminta deskripsi ke model vision Cloudflare, lalu menggabungkannya
 * dengan teks OCR yang dikirim browser. Hasilnya masuk jalur ingest yang sama.
 */
export async function POST(request: NextRequest) {
  const tolak = await requireSession(request);
  if (tolak) return tolak;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Body harus multipart/form-data" },
      { status: 400 },
    );
  }

  const conversationId = String(form.get("conversationId") ?? "");
  if (!idSchema.safeParse(conversationId).success) {
    return NextResponse.json(
      { ok: false, pesan: "conversationId tidak valid" },
      { status: 400 },
    );
  }

  const berkas = form.get("image");
  if (!(berkas instanceof File)) {
    return NextResponse.json({ ok: false, pesan: "Field `image` wajib diisi" }, { status: 400 });
  }
  if (berkas.size === 0) {
    return NextResponse.json({ ok: false, pesan: "Gambar kosong" }, { status: 400 });
  }
  if (berkas.size > MAKS_BYTE) {
    return NextResponse.json(
      { ok: false, pesan: `Gambar ${(berkas.size / 1024 / 1024).toFixed(1)} MB melebihi batas 4 MB` },
      { status: 413 },
    );
  }

  const contentType = (berkas.type || "image/jpeg").toLowerCase();
  if (!MIME_DIIZINKAN.has(contentType)) {
    return NextResponse.json(
      { ok: false, pesan: "Format gambar harus PNG, JPEG, atau WEBP" },
      { status: 415 },
    );
  }

  const filename = String(form.get("filename") ?? "gambar").slice(0, 200) || "gambar";
  const ocrText = String(form.get("ocrText") ?? "").slice(0, 100_000);

  try {
    const visi = await lihatGambar({ bytes: new Uint8Array(await berkas.arrayBuffer()), mime: contentType });

    const teks = gabungTeksVisi(visi.deskripsi, ocrText);

    const hasil = await ingestDocument({
      title: filename,
      source: `lampiran:${filename}`,
      text: teks,
      conversationId,
    });

    return NextResponse.json({
      ok: true,
      documentId: hasil.documentId,
      jumlahChunk: hasil.jumlahChunk,
      ditimpa: hasil.ditimpa,
      model: visi.model,
      pesan: hasil.ditimpa
        ? `"${filename}" diganti — ${hasil.jumlahChunk} potongan.`
        : `"${filename}" siap dipakai — ${hasil.jumlahChunk} potongan.`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal membaca gambar: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}