import { NextResponse, type NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { messages } from "@/lib/db/schema";
import { kunciRateLimit, pesanError, rateLimit, requireSession } from "@/lib/guard";
import { saranLanjutan } from "@/lib/saran";

export const runtime = "nodejs";

const bodySchema = z.object({ conversationId: z.uuid() });

/** POST /api/saran — 3 pertanyaan lanjutan dari pertukaran pesan terakhir. */
export async function POST(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const batas = await rateLimit(`saran:${kunciRateLimit(request)}`, 20, 60_000);
  if (!batas.ok) return NextResponse.json({ ok: false, pesan: "Terlalu sering.", saran: [] }, { status: 429 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Body tidak valid: ${pesanError(err)}`, saran: [] },
      { status: 400 },
    );
  }

  try {
    const riwayat = await getDb()
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, body.conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(6);

    return NextResponse.json({ ok: true, saran: await saranLanjutan(riwayat.reverse()) });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal menyusun saran: ${pesanError(err)}`, saran: [] },
      { status: 502 },
    );
  }
}