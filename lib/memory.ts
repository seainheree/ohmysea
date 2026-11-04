import { and, asc, eq } from "drizzle-orm";
import { generateText } from "ai";

import { memoriModel } from "@/lib/ai/groq";
import { getDb } from "@/lib/db/client";
import { memories } from "@/lib/db/schema";

export const MAKS_PANJANG_MEMORI = 500;
export const MAKS_MEMORI_AKTIF = 60;
/** Batas keseluruhan baris memori (aktif + nonaktif) agar tabel tidak tumbuh liar. */
export const MAKS_SEMUA_MEMORI = 90;

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

/* ---------------------------------------------------------------------------
   Memori otomatis (Kirby mengingat sendiri).

   Alur: model murah mengekstrak kandidat fakta → saring dengan aturan ketat
   (kategori, panjang, sensitif, sesaat, tentang pengguna) → buang yang kembar
   dengan memori lama → simpan maksimum 2 per pertukaran. Semua aturan saring
   dites tanpa jaringan (lib/memory.test.ts).
--------------------------------------------------------------------------- */

export const KATEGORI_DIIZINKAN = [
  "identitas",
  "preferensi",
  "kebiasaan",
  "tujuan",
  "pekerjaan",
  "relasi",
] as const;

export const MAKS_PANJANG_OTOMATIS = 400;
export const MAKS_OTOMATIS_PER_TURAN = 2;

export type KandidatMemori = {
  teks: string;
  kategori: string;
  keyakinan?: number;
};

/** Nomor kartu/PIN/kata sandi dan sejenisnya tidak pernah disimpan. */
const POLA_SENSITIF =
  /(kata sandi|password|sandi|passphrase|\bpin\b|\botp\b|kode rahasia|kode otp|nomor kartu|nomor hp|no\.? telp|cvv|\bnik\b|nomor rekening|no\.? rekening|rekening|paspor|passport|api key|kunci api|\btoken\b)/i;

/** Kejadian sesaat atau emosi sementara bukan memori jangka panjang. */
const POLA_SEMENTARA =
  /\b(hari ini|tadi|sekarang|kemarin|besok|barusan|malam ini|pagi ini|siang ini|sore ini|minggu ini|lagi|sedang|sementara)\b/i;

/** Wajib menyangkut dirinya sendiri, bukan fakta umum tentang dunia. */
const POLA_TENTANG_PENGGUNA =
  /\b(aku|saya|ku|milikku|punyaku|namaku|umurku|favoritku|kesukaanku|rumahku|kerjaku|kantorku|hobiku|panggilanku|keluargaku|pengguna|user)\b/i;

/** Nama asisten sendiri tidak boleh ikut tersimpan sebagai identitas pengguna. */
const POLA_NAMA_ASISTEN = /\bkirby\b/i;

export function normalkanTeks(teks: string): string {
  return teks
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Kata yang tidak membawa makna fakta — dibuang sebelum membandingkan. */
const KATA_UMUM = new Set([
  "aku",
  "saya",
  "ku",
  "adalah",
  "seorang",
  "itu",
  "yang",
  "dan",
  "atau",
  "punya",
  "mempunyai",
  "milik",
  "di",
  "ke",
  "dari",
  "pada",
  "ini",
  "juga",
  "sangat",
  "banget",
  "suka",
]);

function kataInti(teks: string): Set<string> {
  return new Set(
    normalkanTeks(teks)
      .split(" ")
      .filter((t) => t.length > 2 && !KATA_UMUM.has(t)),
  );
}

/** Dua memori dianggap kembar kalau isinya (hampir) sama — cegah duplikat. */
export function terlaluMirip(a: string, b: string): boolean {
  const na = normalkanTeks(a);
  const nb = normalkanTeks(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) {
    const pendek = Math.min(na.length, nb.length);
    const panjang = Math.max(na.length, nb.length);
    if (pendek / panjang >= 0.6) return true;
  }
  const ta = kataInti(a);
  const tb = kataInti(b);
  if (ta.size === 0 || tb.size === 0) return false;

  // Semua kata inti yang lebih pendek sudah termuat di yang lebih panjang.
  const [kecil, besar] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  if ([...kecil].every((t) => besar.has(t))) return true;

  let sama = 0;
  for (const t of ta) if (tb.has(t)) sama++;
  const gabungan = new Set([...ta, ...tb]).size;
  return sama / gabungan >= 0.5;
}

export function layakDisimpan(
  kandidat: KandidatMemori,
  sudahAda: string[],
): { ok: true; teks: string } | { ok: false; alasan: string } {
  const teks = String(kandidat?.teks ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (teks.length < 12) return { ok: false, alasan: "terlalu pendek" };
  if (teks.length > MAKS_PANJANG_OTOMATIS) return { ok: false, alasan: "terlalu panjang" };
  if (!(KATEGORI_DIIZINKAN as readonly string[]).includes(String(kandidat?.kategori))) {
    return { ok: false, alasan: `kategori tidak diizinkan (${kandidat?.kategori})` };
  }
  if (typeof kandidat?.keyakinan === "number" && kandidat.keyakinan < 0.6) {
    return { ok: false, alasan: "keyakinan rendah" };
  }
  if (POLA_SENSITIF.test(teks)) return { ok: false, alasan: "data sensitif" };
  if (POLA_NAMA_ASISTEN.test(teks)) return { ok: false, alasan: "nama asisten, bukan fakta pengguna" };
  if (POLA_SEMENTARA.test(teks)) return { ok: false, alasan: "peristiwa sesaat" };
  if (!POLA_TENTANG_PENGGUNA.test(teks)) return { ok: false, alasan: "bukan tentang pengguna" };
  if (sudahAda.some((lama) => terlaluMirip(lama, teks))) {
    return { ok: false, alasan: "sudah ada" };
  }
  return { ok: true, teks };
}

/** Saring daftar kandidat: buang yang tidak layak (dan kembar antar kandidat). */
export function saringKandidat(
  kandidat: KandidatMemori[],
  sudahAda: string[],
  maks = MAKS_OTOMATIS_PER_TURAN,
): string[] {
  const lolos: string[] = [];
  const acuan = [...sudahAda];
  for (const k of kandidat ?? []) {
    if (lolos.length >= maks) break;
    const hasil = layakDisimpan(k, acuan);
    if (hasil.ok) {
      lolos.push(hasil.teks);
      acuan.push(hasil.teks);
    }
  }
  return lolos;
}

export const PROMPT_FILTER_MEMORI = `Kamu penyaring memori untuk asisten pribadi bernama Kirby.
Dari satu pertukaran pesan, ambil HANYA fakta tahan lama tentang PENGGUNA yang berguna diingat lain waktu.

Kategori yang boleh: identitas, preferensi, kebiasaan, tujuan, pekerjaan, relasi.
Jangan ambil: sapaan, pertanyaan, keluhan/emosi sesaat, cerita peristiwa hari itu,
pembicaraan teknis tentang aplikasi atau dokumen, dan apa pun yang sensitif.

Tulis tiap memori dari sudut pandang pengguna dengan kata "aku" (contoh:
"Aku suka kopi hitam tanpa gula", "Namaku Sha, panggil aku Sha").

Balas JSON saja, satu baris, tanpa penjelasan:
{"memori":[{"teks":"Aku suka kopi hitam tanpa gula","kategori":"preferensi","keyakinan":0.9}]}
Maksimum 2 butir. Kalau tidak ada yang layak, balas {"memori":[]}.`;

/**
 * Baca JSON dari balasan model. Model kecil kadang memotong JSON di tengah,
 * jadi kalau parse penuh gagal, butir yang masih utuh diambil satu per satu.
 */
function ambilJson(teks: string): unknown {
  const mulai = teks.indexOf("{");
  const selesai = teks.lastIndexOf("}");
  if (mulai >= 0 && selesai > mulai) {
    try {
      return JSON.parse(teks.slice(mulai, selesai + 1));
    } catch {
      // lanjut ke pemulihan di bawah
    }
  }
  const butir: unknown[] = [];
  const pola = /"teks"\s*:\s*"([^"]{5,400})"(?:\s*,\s*"kategori"\s*:\s*"([a-z_-]+)")?(?:\s*,\s*"keyakinan"\s*:\s*([0-9.]+))?/g;
  for (const m of teks.matchAll(pola)) {
    butir.push({ teks: m[1], kategori: m[2] ?? "", keyakinan: m[3] ? Number(m[3]) : undefined });
  }
  return butir.length > 0 ? butir : null;
}

/** Minta model murah mengekstrak kandidat memori. Gagal = kembalikan kosong. */
export async function ekstrakKandidatMemori(
  pesanPengguna: string,
  balasanAsisten: string,
): Promise<KandidatMemori[]> {
  try {
    const { text } = await generateText({
      model: memoriModel(),
      temperature: 0,
      maxOutputTokens: 600,
      maxRetries: 1,
      prompt: `${PROMPT_FILTER_MEMORI}\n\nPENGGUNA: ${pesanPengguna}\n\nKIRBY: ${balasanAsisten.slice(0, 1500)}`,
    });

    const data = ambilJson(text);
    const daftar = Array.isArray(data)
      ? data
      : Array.isArray((data as { memori?: unknown })?.memori)
        ? ((data as { memori: unknown[] }).memori as unknown[])
        : [];

    return daftar
      .map((b) => {
        const o = b as Record<string, unknown>;
        return {
          teks: String(o?.teks ?? o?.text ?? ""),
          kategori: String(o?.kategori ?? o?.category ?? "").toLowerCase(),
          keyakinan: typeof o?.keyakinan === "number" ? (o.keyakinan as number) : undefined,
        };
      })
      .filter((k) => k.teks.length > 0);
  } catch (err) {
    console.error("ekstraksi memori gagal:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Simpan memori hasil percakapan otomatis. Membandingkan dengan SEMUA memori
 * (termasuk yang dimatikan) supaya hal yang sengaja dimatikan tidak dihidupkan
 * kembali. Kembalikan daftar teks yang benar-benar disimpan.
 */
export async function simpanMemoriOtomatis(
  pesanPengguna: string,
  balasanAsisten: string,
): Promise<string[]> {
  try {
    const db = getDb();
    const lama = await db.select({ content: memories.content }).from(memories);
    const acuan = lama.map((m) => m.content.trim()).filter(Boolean);
    const sisa = MAKS_SEMUA_MEMORI - acuan.length;
    if (sisa <= 0) return [];

    const kandidat = await ekstrakKandidatMemori(pesanPengguna, balasanAsisten);
    if (kandidat.length === 0) return [];

    const lolos = saringKandidat(kandidat, acuan, Math.min(MAKS_OTOMATIS_PER_TURAN, sisa));
    if (lolos.length === 0) return [];

    await db.insert(memories).values(lolos.map((content) => ({ content })));
    return lolos;
  } catch (err) {
    console.error("gagal menyimpan memori otomatis:", err instanceof Error ? err.message : String(err));
    return [];
  }
}
