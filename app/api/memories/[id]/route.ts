import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { memories } from "@/lib/db/schema";
import { pesanError, requireSession } from "@/lib/guard";
import { MAKS_PANJANG_MEMORI } from "@/lib/memory";

export const runtime = "nodejs";

const patchSchema = z
  .object({
    content: z.string().trim().min(3).max(MAKS_PANJANG_MEMORI).optional(),
    aktif: z.boolean().optional(),
  })
  .refine((v) => v.content !== undefined || v.aktif !== undefined, {
    message: "Isi salah satu: content atau aktif",
  });

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/memories/[id] — ubah isi atau aktif/nonaktifkan. */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const { id } = await ctx.params;
  try {
    const body = patchSchema.parse(await request.json());
    const db = getDb();
    const [diubah] = await db
      .update(memories)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(memories.id, id))
      .returning();

    if (!diubah) {
      return NextResponse.json({ ok: false, pesan: "Memori tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, memori: diubah });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal mengubah memori: ${pesanError(err)}` },
      { status: 400 },
    );
  }
}

/** DELETE /api/memories/[id] */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const { id } = await ctx.params;
  try {
    const db = getDb();
    const [dihapus] = await db
      .delete(memories)
      .where(eq(memories.id, id))
      .returning({ id: memories.id });

    if (!dihapus) {
      return NextResponse.json({ ok: false, pesan: "Memori tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, pesan: "Memori dihapus." });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal menghapus memori: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}
