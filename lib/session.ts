import { randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { getDb } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";

export const SESSION_COOKIE = "ohmysea_sesi";
/** Masa berlaku sesi: 24 jam. Sesudah itu kode akses harus dimasukkan lagi. */
const MAX_AGE_SECONDS = 60 * 60 * 24;
const UMUR_SESI_MS = MAX_AGE_SECONDS * 1000;
/** Maksimal perangkat yang boleh masuk sekaligus. */
const MAKS_PERANGKAT = 4;

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

/** Bandingkan tanpa membocorkan panjang/waktu lewat perbedaan respons. */
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

/** Label kasar perangkat dari User-Agent. Tidak dipakai untuk keamanan. */
export function labelPerangkat(agen: string): string {
  const os = /Windows/i.test(agen)
    ? "Windows"
    : /Android/i.test(agen)
      ? "Android"
      : /iPhone|iPad|iOS/i.test(agen)
        ? "iOS"
        : /Mac OS X/i.test(agen)
          ? "macOS"
          : /Linux/i.test(agen)
            ? "Linux"
            : "Perangkat lain";
  const peramban = /Edg\//i.test(agen)
    ? "Edge"
    : /OPR\//i.test(agen)
      ? "Opera"
      : /Chrome\//i.test(agen)
        ? "Chrome"
        : /Safari\//i.test(agen)
          ? "Safari"
          : /Firefox\//i.test(agen)
            ? "Firefox"
            : "peramban lain";
  return `${os} · ${peramban}`;
}

/** Token sesi dari cookie. Null kalau belum login. */
export function sessionToken(request: NextRequest): string | null {
  const nilai = request.cookies.get(SESSION_COOKIE)?.value;
  return nilai && /^[0-9a-f]{64}$/.test(nilai) ? nilai : null;
}

/**
 * Buka sesi baru: bersihkan yang kedaluwarsa, keluarkan yang paling lama kalau
 * perangkat aktif sudah penuh, lalu simpan token acak. Token inilah isi cookie.
 *
 * ponytail: hitung-lalu-sisip tanpa transaksi. Pemakainya satu orang, jadi balapan
 * dua login bersamaan paling buruk menambah satu perangkat. Pakai `serializable`
 * atau kolom counter kalau suatu saat dipakai banyak orang.
 */
export async function buatSesi(agen: string): Promise<string> {
  const db = getDb();
  const batas = new Date(Date.now() - UMUR_SESI_MS);
  await db.delete(sessions).where(lt(sessions.createdAt, batas));

  const aktif = await db.select({ id: sessions.id }).from(sessions).orderBy(sessions.createdAt);
  if (aktif.length >= MAKS_PERANGKAT) {
    // Tidak ada lagi layar untuk memilih perangkat mana yang dicabut, jadi yang
    // paling lama masuk dikeluarkan supaya pemilik tidak terkunci 24 jam.
    const buang = aktif.slice(0, aktif.length - MAKS_PERANGKAT + 1).map((s) => s.id);
    await db.delete(sessions).where(inArray(sessions.id, buang));
  }

  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({ token, device: labelPerangkat(agen) });
  return token;
}

/** true kalau cookie membawa token yang masih terdaftar dan belum kedaluwarsa. */
export async function isAuthorized(request: NextRequest): Promise<boolean> {
  const token = sessionToken(request);
  if (!token) return false;
  try {
    const batas = new Date(Date.now() - UMUR_SESI_MS);
    const rows = await getDb()
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.createdAt, batas)))
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}
