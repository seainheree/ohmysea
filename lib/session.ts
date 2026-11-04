import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

import { getEnv } from "@/lib/env";

export const SESSION_COOKIE = "ohmysea_sesi";
/** Masa berlaku sesi: 24 jam. Sesudah itu kode akses harus dimasukkan lagi. */
const MAX_AGE_SECONDS = 60 * 60 * 24;

/** Nilai cookie = HMAC dari kode akses. Kode tidak pernah dikirim ke browser. */
function expectedValue(): string {
  const { APP_ACCESS_CODE } = getEnv();
  return createHmac("sha256", APP_ACCESS_CODE).update("ohmysea-sesi-v1").digest("hex");
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
  const { APP_ACCESS_CODE } = getEnv();
  return safeEqual(code, APP_ACCESS_CODE);
}

export function sessionValue(): string {
  return expectedValue();
}

/** true kalau permintaan membawa cookie sesi yang sah. */
export function isAuthorized(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, expectedValue());
}
