import { NextResponse, type NextRequest } from "next/server";

import { pesanError, requireSession } from "@/lib/guard";
import { cabutSesi, sessionToken } from "@/lib/session";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * DELETE /api/sessions/[id] — cabut satu perangkat.
 * `sekarang: true` berarti yang dicabut perangkat pemanggil: cookie-nya sudah
 * tidak sah lagi, jadi UI harus kembali ke layar kode akses.
 */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const tolak = await requireSession(request);
  if (tolak) return tolak;

  const { id } = await ctx.params;
  try {
    const sekarang = await cabutSesi(id, sessionToken(request));
    return NextResponse.json({
      ok: true,
      sekarang,
      pesan: sekarang ? "Perangkat ini dicabut. Masukkan kode akses lagi." : "Perangkat dicabut.",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal mencabut perangkat: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}
