import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { conversations, messages } from "@/lib/db/schema";
import { pesanError, requireSession } from "@/lib/guard";

export const runtime = "nodejs";

/**
 * GET /api/conversations?mode=chat|curhat&cari=kata — daftar percakapan sidebar.
 * `cari` mencocokkan judul **dan isi pesan**; hasil menyertakan `cuplikan`
 * (potongan pesan yang cocok) supaya barisnya bisa menjelaskan kenapa muncul.
 */
export async function GET(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  try {
    const sp = request.nextUrl.searchParams;
    const mode = sp.get("mode");
    // `%` dan `_` adalah wildcard ILIKE; untuk pencarian biasa dianggap spasi.
    const cari = (sp.get("cari") ?? "").replace(/[%_\\]/g, " ").trim().slice(0, 100);
    const db = getDb();
    const saringMode = mode === "chat" || mode === "curhat" ? eq(conversations.mode, mode) : undefined;

    if (cari) {
      const pola = `%${cari}%`;
      const daftar = await db
        .select({
          id: conversations.id,
          title: conversations.title,
          mode: conversations.mode,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
          cuplikan: sql<string | null>`(
            select substring(m.content from greatest(1, position(lower(${cari}) in lower(m.content)) - 40) for 160)
            from ${messages} m
            where m.conversation_id = ${conversations}.id and m.content ilike ${pola}
            order by m.created_at
            limit 1
          )`,
        })
        .from(conversations)
        .where(
          and(
            saringMode,
            or(
              ilike(conversations.title, pola),
              sql`exists (select 1 from ${messages} m where m.conversation_id = ${conversations.id} and m.content ilike ${pola})`,
            ),
          ),
        )
        .orderBy(desc(conversations.updatedAt))
        .limit(50);

      return NextResponse.json({ ok: true, percakapan: daftar });
    }

    const dasar = db.select().from(conversations).$dynamic();
    const daftar = await (saringMode ? dasar.where(saringMode) : dasar)
      .orderBy(desc(conversations.updatedAt))
      .limit(50);

    return NextResponse.json({ ok: true, percakapan: daftar });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal memuat percakapan: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}

const bodySchema = z.object({
  title: z.string().min(1).max(80).optional(),
  mode: z.enum(["chat", "curhat"]).default("chat"),
});

/** POST /api/conversations — buat percakapan kosong. */
export async function POST(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  try {
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const db = getDb();
    const [baru] = await db
      .insert(conversations)
      .values({ title: body.title ?? "Percakapan baru", mode: body.mode })
      .returning();
    return NextResponse.json({ ok: true, percakapan: baru }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal membuat percakapan: ${pesanError(err)}` },
      { status: 400 },
    );
  }
}

/**
 * DELETE /api/conversations?mode=chat|curhat
 * Hapus riwayat percakapan (semua, atau hanya satu mode). Pesan ikut terhapus (cascade).
 */
export async function DELETE(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  try {
    const mode = request.nextUrl.searchParams.get("mode");
    const db = getDb();

    const dasar = db.delete(conversations).$dynamic();
    const dihapus = await (mode === "chat" || mode === "curhat"
      ? dasar.where(eq(conversations.mode, mode))
      : dasar
    ).returning({ id: conversations.id });

    return NextResponse.json({
      ok: true,
      pesan: `${dihapus.length} percakapan dihapus${mode ? ` (mode ${mode})` : ""}.`,
      jumlah: dihapus.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal menghapus riwayat: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}
