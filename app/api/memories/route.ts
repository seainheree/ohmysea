import { desc } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { memories } from "@/lib/db/schema";
import { pesanError, requireSession } from "@/lib/guard";
import { MAKS_MEMORI_AKTIF, MAKS_PANJANG_MEMORI, memoriSudahAda } from "@/lib/memory";

export const runtime = "nodejs";

const bodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Memori minimal 3 karakter")
    .max(MAKS_PANJANG_MEMORI, `Memori maksimal ${MAKS_PANJANG_MEMORI} karakter`),
});

/** GET /api/memories — semua memori (aktif & nonaktif), terbaru dulu. */
export async function GET(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  try {
    const db = getDb();
    const daftar = await db.select().from(memories).orderBy(desc(memories.createdAt)).limit(200);
    return NextResponse.json({ ok: true, memori: daftar });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal memuat memori: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}

/** POST /api/memories — tambah satu memori. */
export async function POST(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Input memori tidak valid: ${pesanError(err)}` },
      { status: 400 },
    );
  }

  try {
    const db = getDb();

    const jumlah = await db.select({ id: memories.id }).from(memories);
    if (jumlah.length >= MAKS_MEMORI_AKTIF * 2) {
      return NextResponse.json(
        {
          ok: false,
          pesan: `Memori sudah terlalu banyak (${jumlah.length}). Hapus beberapa dulu sebelum menambah.`,
        },
        { status: 400 },
      );
    }

    if (await memoriSudahAda(body.content)) {
      return NextResponse.json(
        { ok: false, duplikat: true, pesan: "Memori ini sudah ada." },
        { status: 409 },
      );
    }

    const [baru] = await db.insert(memories).values({ content: body.content }).returning();
    return NextResponse.json({ ok: true, memori: baru }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal menyimpan memori: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}
