import { asc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { conversations, messages } from "@/lib/db/schema";
import { pesanError, requireSession } from "@/lib/guard";

export const runtime = "nodejs";

const patchSchema = z.object({ title: z.string().min(1, "Judul tidak boleh kosong").max(80) });

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/conversations/[id] — semua pesan dalam percakapan. */
export async function GET(request: NextRequest, ctx: Ctx) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const { id } = await ctx.params;
  try {
    const db = getDb();
    const [percakapan] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (!percakapan) {
      return NextResponse.json({ ok: false, pesan: "Percakapan tidak ditemukan." }, { status: 404 });
    }

    const daftar = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({ ok: true, percakapan, pesan: daftar });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal memuat pesan: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}

/** PATCH /api/conversations/[id] — ganti judul. */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const { id } = await ctx.params;
  try {
    const body = patchSchema.parse(await request.json());
    const db = getDb();
    const [diubah] = await db
      .update(conversations)
      .set({ title: body.title, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();

    if (!diubah) {
      return NextResponse.json({ ok: false, pesan: "Percakapan tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, percakapan: diubah });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal mengubah judul: ${pesanError(err)}` },
      { status: 400 },
    );
  }
}

/** DELETE /api/conversations/[id] — hapus percakapan beserta pesannya (cascade). */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const { id } = await ctx.params;
  try {
    const db = getDb();
    const [dihapus] = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning({ id: conversations.id });

    if (!dihapus) {
      return NextResponse.json({ ok: false, pesan: "Percakapan tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, pesan: "Percakapan dihapus." });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal menghapus: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}
