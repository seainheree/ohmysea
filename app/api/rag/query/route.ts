import { NextResponse, type NextRequest } from "next/server";

import { pesanError, requireSession } from "@/lib/guard";
import { MIN_SCORE, TOP_K, retrieve } from "@/lib/rag/retrieve";

export const runtime = "nodejs";

/** GET /api/rag/query?q=...&k=4 — untuk memverifikasi FR-4. */
export async function GET(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ ok: false, pesan: "Parameter q wajib." }, { status: 400 });
  }

  const k = Number(request.nextUrl.searchParams.get("k") ?? TOP_K) || TOP_K;

  try {
    const potongan = await retrieve(q, { k });
    return NextResponse.json({
      ok: true,
      query: q,
      ambangSkor: MIN_SCORE,
      jumlah: potongan.length,
      potongan,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Query gagal: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}
