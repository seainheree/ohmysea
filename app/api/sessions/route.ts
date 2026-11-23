import { NextResponse, type NextRequest } from "next/server";

import { getDb } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { pesanError, requireSession } from "@/lib/guard";
import { MAKS_PERANGKAT, daftarSesi, sessionToken } from "@/lib/session";

export const runtime = "nodejs";

/** GET /api/sessions — perangkat yang sedang boleh masuk (tanpa token). */
export async function GET(request: NextRequest) {
  const tolak = await requireSession(request);
  if (tolak) return tolak;

  try {
    const daftar = await daftarSesi(sessionToken(request));
    return NextResponse.json({ ok: true, perangkat: daftar, maks: MAKS_PERANGKAT });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal memuat perangkat: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}

/** DELETE /api/sessions — cabut semua perangkat, termasuk milik pemanggil. */
export async function DELETE(request: NextRequest) {
  const tolak = await requireSession(request);
  if (tolak) return tolak;

  try {
    const dihapus = await getDb().delete(sessions).returning({ id: sessions.id });
    return NextResponse.json({
      ok: true,
      pesan: `${dihapus.length} perangkat dicabut. Masukkan kode akses lagi.`,
      jumlah: dihapus.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal mencabut perangkat: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}
