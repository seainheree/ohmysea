import { NextResponse, type NextRequest } from "next/server";

import { isAuthorized } from "@/lib/session";

/**
 * Semua route kecuali /api/unlock dan /api/health wajib melewati ini.
 * Kembalikan NextResponse (401) kalau belum dibuka, atau null kalau boleh lanjut.
 */
export function requireSession(request: NextRequest): NextResponse | null {
  if (isAuthorized(request)) return null;
  return NextResponse.json(
    { ok: false, pesan: "Belum dibuka. Kirim kode akses ke /api/unlock dulu." },
    { status: 401 },
  );
}

/**
 * Batas laju sederhana per cookie (in-memory, per instance server).
 * Cukup untuk mencegah kuota habis karena kecelakaan; bukan pelindung kuat —
 * batas sebenarnya ada di kuota provider.
 */
const catatan = new Map<string, { jumlah: number; resetAt: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): { ok: boolean; sisa: number } {
  const sekarang = Date.now();
  const entri = catatan.get(key);

  if (!entri || entri.resetAt < sekarang) {
    catatan.set(key, { jumlah: 1, resetAt: sekarang + windowMs });
    return { ok: true, sisa: limit - 1 };
  }

  entri.jumlah += 1;
  if (entri.jumlah > limit) return { ok: false, sisa: 0 };
  return { ok: true, sisa: limit - entri.jumlah };
}

export function kunciRateLimit(request: NextRequest): string {
  return request.cookies.get("ohmysea_sesi")?.value?.slice(0, 16) ?? "tanpa-sesi";
}

export function pesanError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
