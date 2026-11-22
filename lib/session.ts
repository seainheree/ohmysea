import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "ohmysea_sesi";
/** Masa berlaku sesi: 24 jam. Sesudah itu kode akses harus dimasukkan lagi. */
const MAX_AGE_SECONDS = 60 * 60 * 24;

/**
 * Kode akses dibaca langsung dari env, bukan lewat `getEnv()`.
 * Login hanya butuh APP_ACCESS_CODE; jangan sampai gagal karena DATABASE_URL
 * atau kunci provider lain belum diisi di server.
 */
function kodeAkses(): string {
  const kode = process.env.APP_ACCESS_CODE ?? "";
  if (kode.length < 6) {
    throw new Error("Kode akses belum disetel di server (APP_ACCESS_CODE minimal 6 karakter).");
  }
  return kode;
}

/** Nilai cookie = HMAC dari kode akses. Kode tidak pernah dikirim ke browser. */
function expectedValue(): string {
  return createHmac("sha256", kodeAkses()).update("ohmysea-sesi-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function cookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export function isValidCode(code: string): boolean {
  return safeEqual(code, kodeAkses());
}

export function sessionValue(): string {
  return expectedValue();
}

/** true kalau permintaan membawa cookie sesi yang sah. Env rusak = belum diizinkan. */
export function isAuthorized(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return false;
  let harapan: string;
  try {
    harapan = expectedValue();
  } catch {
    return false;
  }
  return safeEqual(cookie, harapan);
}
