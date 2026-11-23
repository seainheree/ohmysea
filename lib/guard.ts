import { sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { getDb } from "@/lib/db/client";
import { isAuthorized } from "@/lib/session";

/**
 * Semua route kecuali /api/unlock dan /api/health wajib melewati ini.
 * Kembalikan NextResponse (401) kalau belum dibuka, atau null kalau boleh lanjut.
 * Async karena sesi diperiksa ke DB (token perangkat, lihat `sessions`).
 */
export async function requireSession(request: NextRequest): Promise<NextResponse | null> {
  if (await isAuthorized(request)) return null;
  return NextResponse.json(
    { ok: false, pesan: "Belum dibuka. Kirim kode akses ke /api/unlock dulu." },
    { status: 401 },
  );
}

/**
 * Batas laju per cookie, disimpan di Postgres lewat satu upsert.
 * Di Vercel tiap instance serverless punya memori sendiri, jadi `Map` in-memory
 * dulu praktis tidak membatasi apa pun. Ini bukan pelindung kuat — batas
 * sebenarnya tetap kuota provider — tapi cukup menahan kirim-ulang tak sengaja.
 *
 * ponytail: satu baris per kunci, tanpa TTL cleanup. Kuncinya hanya beberapa
 * (chat/images/saran), jadi tidak perlu; pakai Redis kalau kuncinya jadi ribuan.
 */
export async function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): Promise<{ ok: boolean; sisa: number }> {
  const reset = new Date(Date.now() + windowMs);
  try {
    const rows = (await getDb().execute(sql`
      insert into rate_limits (key, jumlah, reset_at) values (${key}, 1, ${reset})
      on conflict (key) do update set
        jumlah = case when rate_limits.reset_at < now() then 1 else rate_limits.jumlah + 1 end,
        reset_at = case when rate_limits.reset_at < now() then ${reset} else rate_limits.reset_at end
      returning jumlah
    `)) as unknown as { jumlah: number }[];

    const jumlah = Number(rows[0]?.jumlah ?? 1);
    return { ok: jumlah <= limit, sisa: Math.max(0, limit - jumlah) };
  } catch (err) {
    // Batas laju hanya pelengkap: kalau DB bermasalah, chat tetap boleh jalan.
    console.error("rate limit gagal:", pesanError(err));
    return { ok: true, sisa: limit };
  }
}

export function kunciRateLimit(request: NextRequest): string {
  return request.cookies.get("ohmysea_sesi")?.value?.slice(0, 16) ?? "tanpa-sesi";
}

export function pesanError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
