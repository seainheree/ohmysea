import { desc } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { memories, permanentMemories } from "@/lib/db/schema";
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

/**
 * GET /api/memories — memori paten (ditulis pengguna) dan otomatis dalam satu daftar.
 * Tiap butir punya `paten: true|false` supaya UI bisa memisahkannya.
 */
export async function GET(request: NextRequest) {
  const tolak = await requireSession(request);
  if (tolak) return tolak;

  try {
    const db = getDb();
    const [paten, otomatis] = await Promise.all([
      db.select().from(permanentMemories).orderBy(desc(permanentMemories.createdAt)).limit(200),
      db.select().from(memories).orderBy(desc(memories.createdAt)).limit(200),
    ]);

    const daftar = [
      ...paten.map((m) => ({ ...m, paten: true })),
      ...otomatis.map((m) => ({ ...m, paten: false })),
    ];

    return NextResponse.json({ ok: true, memori: daftar });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal memuat memori: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}

/** POST /api/memories — tambah satu memori paten. */
export async function POST(request: NextRequest) {
  const tolak = await requireSession(request);
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

    const [paten, otomatis] = await Promise.all([
      db.select({ id: permanentMemories.id }).from(permanentMemories),
      db.select({ id: memories.id }).from(memories),
    ]);
    const jumlah = paten.length + otomatis.length;
    if (jumlah >= MAKS_MEMORI_AKTIF * 2) {
      return NextResponse.json(
        {
          ok: false,
          pesan: `Memori sudah terlalu banyak (${jumlah}). Hapus beberapa dulu sebelum menambah.`,
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

    const [baru] = await db
      .insert(permanentMemories)
      .values({ content: body.content })
      .returning();
    return NextResponse.json({ ok: true, memori: { ...baru, paten: true } }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal menyimpan memori: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}