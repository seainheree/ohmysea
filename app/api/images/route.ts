import { desc } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { generateImage } from "@/lib/ai/image";
import {
  DEFAULT_MODEL,
  DEFAULT_RATIO,
  IMAGE_MODELS,
  MAKS_PANJANG_PROMPT,
  MAKS_UKURAN_REFERENSI_MB,
  RATIOS,
  dukungDimensi,
  dukungGambarReferensi,
  ukuranDari,
} from "@/lib/ai/styles";
import { getDb } from "@/lib/db/client";
import { images } from "@/lib/db/schema";
import { kunciRateLimit, pesanError, rateLimit, requireSession } from "@/lib/guard";
import { pastikanBucket, unggahGambar, unggahReferensi } from "@/lib/storage/upload";

export const runtime = "nodejs";
export const maxDuration = 120;

const TIPE_DIIZINKAN = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const batas = rateLimit(`images:${kunciRateLimit(request)}`, 10, 60_000);
  if (!batas.ok) {
    return NextResponse.json(
      { ok: false, pesan: "Terlalu banyak permintaan gambar. Tunggu satu menit lagi." },
      { status: 429 },
    );
  }

  const mulai = Date.now();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Body harus multipart/form-data." },
      { status: 400 },
    );
  }

  const schema = z.object({
    prompt: z.string().min(3, "Prompt minimal 3 karakter").max(MAKS_PANJANG_PROMPT),
    style: z.string().min(1),
    model: z.string().min(1).default(DEFAULT_MODEL),
    aspectRatio: z.string().min(1).default(DEFAULT_RATIO),
    seed: z.coerce.number().int().optional(),
  });

  const mentah = {
    prompt: String(form.get("prompt") ?? ""),
    style: String(form.get("style") ?? ""),
    model: String(form.get("model") ?? DEFAULT_MODEL),
    aspectRatio: String(form.get("aspectRatio") ?? DEFAULT_RATIO),
    seed: form.get("seed") ?? undefined,
  };

  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(mentah);
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Input gambar tidak valid: ${pesanError(err)}` },
      { status: 400 },
    );
  }

  if (!IMAGE_MODELS.some((m) => m.id === input.model)) {
    return NextResponse.json(
      { ok: false, pesan: `Model tidak dikenal. Pilihan: ${IMAGE_MODELS.map((m) => m.id).join(", ")}` },
      { status: 400 },
    );
  }

  let ukuran: { width: number; height: number };
  try {
    ukuran = ukuranDari(input.aspectRatio);
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `${pesanError(err)} Pilihan: ${Object.keys(RATIOS).join(", ")}` },
      { status: 400 },
    );
  }

  // Model yang tidak menerima width/height selalu keluar 1024x1024 — catat apa yang benar-benar terjadi,
  // supaya metadata di DB tidak menyesatkan (FR-7).
  const ratioDiabaikan = !dukungDimensi(input.model);
  if (ratioDiabaikan) ukuran = { width: 1024, height: 1024 };

  // Gambar referensi (opsional)
  const berkasReferensi = form.get("reference");
  let referensi: { bytes: Uint8Array; contentType: string; nama: string } | null = null;
  if (berkasReferensi instanceof File && berkasReferensi.size > 0) {
    if (!dukungGambarReferensi(input.model)) {
      return NextResponse.json(
        {
          ok: false,
          pesan: "Model ini tidak mendukung gambar referensi. Pilih FLUX.2 klein, atau hapus gambar referensi.",
        },
        { status: 400 },
      );
    }
    if (!TIPE_DIIZINKAN.includes(berkasReferensi.type)) {
      return NextResponse.json(
        { ok: false, pesan: "Gambar referensi harus PNG, JPEG, atau WEBP." },
        { status: 400 },
      );
    }
    if (berkasReferensi.size > MAKS_UKURAN_REFERENSI_MB * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, pesan: `Gambar referensi maksimal ${MAKS_UKURAN_REFERENSI_MB} MB.` },
        { status: 400 },
      );
    }
    referensi = {
      bytes: new Uint8Array(await berkasReferensi.arrayBuffer()),
      contentType: berkasReferensi.type,
      nama: berkasReferensi.name || "referensi.png",
    };
  }

  const db = getDb();

  try {
    await pastikanBucket();

    const hasil = await generateImage({
      prompt: input.prompt,
      style: input.style,
      model: input.model,
      width: ukuran.width,
      height: ukuran.height,
      reference: referensi,
      seed: input.seed,
    });

    const unggah = await unggahGambar({ bytes: hasil.bytes, contentType: hasil.contentType });

    let sumberReferensi: string | null = null;
    if (referensi) {
      const r = await unggahReferensi(referensi.bytes, referensi.contentType);
      sumberReferensi = r.path;
    }

    const [baris] = await db
      .insert(images)
      .values({
        prompt: input.prompt,
        style: input.style,
        model: input.model,
        aspectRatio: input.aspectRatio,
        width: ukuran.width,
        height: ukuran.height,
        seed: input.seed ?? null,
        sourceImage: sumberReferensi,
        url: unggah.url,
        durationMs: Date.now() - mulai,
      })
      .returning();

    return NextResponse.json({ ok: true, gambar: baris }, { status: 201 });
  } catch (err) {
    const pesan = pesanError(err);
    // Catat kegagalan supaya tidak hilang (kolom error + url wajib, jadi pakai url penanda)
    try {
      await db.insert(images).values({
        prompt: input.prompt,
        style: input.style,
        model: input.model,
        aspectRatio: input.aspectRatio,
        width: ukuran.width,
        height: ukuran.height,
        url: "gagal://tidak-ada-gambar",
        error: pesan.slice(0, 500),
        durationMs: Date.now() - mulai,
      });
    } catch {
      // pengabaian sengaja: kegagalan pencatatan tidak boleh menutupi error asli
    }

    const saran = /nsfw/i.test(pesan)
      ? " Prompt ditolak filter keamanan provider — coba ubah kata-katanya."
      : "";
    return NextResponse.json(
      { ok: false, pesan: `Gambar gagal dibuat: ${pesan}.${saran}` },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  try {
    const db = getDb();
    const daftar = await db
      .select()
      .from(images)
      .orderBy(desc(images.createdAt))
      .limit(60);
    return NextResponse.json({ ok: true, gambar: daftar });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal memuat galeri: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}
