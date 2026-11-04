import { desc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { conversations } from "@/lib/db/schema";
import { pesanError, requireSession } from "@/lib/guard";

export const runtime = "nodejs";

/** GET /api/conversations?mode=chat|curhat — daftar percakapan untuk sidebar. */
export async function GET(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  try {
    const mode = request.nextUrl.searchParams.get("mode");
    const db = getDb();

    const dasar = db.select().from(conversations).$dynamic();
    const daftar = await (mode === "chat" || mode === "curhat"
      ? dasar.where(eq(conversations.mode, mode))
      : dasar
    )
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
