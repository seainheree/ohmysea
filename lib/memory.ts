import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { memories } from "@/lib/db/schema";

export const MAKS_PANJANG_MEMORI = 500;
export const MAKS_MEMORI_AKTIF = 60;

/** Ambil memori aktif, terbaru dulu, dibatasi supaya prompt tidak membengkak. */
export async function ambilMemoriAktif(): Promise<string[]> {
  const db = getDb();
  const baris = await db
    .select({ content: memories.content })
    .from(memories)
    .where(eq(memories.aktif, true))
    .orderBy(asc(memories.createdAt))
    .limit(MAKS_MEMORI_AKTIF);

  return baris.map((b) => b.content.trim()).filter(Boolean);
}

/**
 * Blok memori untuk prompt sistem. Dipakai di semua mode (chat & curhat) supaya
 * asisten konsisten mengingat hal yang pengguna minta diingat.
 */
export function buildMemoryBlock(daftar: string[]): string {
  if (daftar.length === 0) return "";
  const isi = daftar.map((m) => `- ${m}`).join("\n");
  return `\n\nYang kamu ingat tentang pengguna (pakai kalau relevan, jangan mengarang di luar daftar ini):\n${isi}`;
}

/** Apakah isi memori ini sudah ada (bandingkan tanpa beda huruf besar/kecil & spasi). */
export async function memoriSudahAda(content: string): Promise<boolean> {
  const db = getDb();
  const semua = await db.select({ content: memories.content }).from(memories);
  const kunci = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return semua.some((m) => kunci(m.content) === kunci(content));
}

export async function hapusMemori(id: string): Promise<boolean> {
  const db = getDb();
  const dihapus = await db
    .delete(memories)
    .where(and(eq(memories.id, id)))
    .returning({ id: memories.id });
  return dihapus.length > 0;
}
