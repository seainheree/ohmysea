import { generateText } from "ai";

import { memoriModel } from "@/lib/ai/groq";

export const MAKS_SARAN = 3;
const MAKS_PANJANG = 80;

/**
 * Saran pertanyaan lanjutan. Sengaja pakai model kecil (sama dengan penyaring
 * memori): pekerjaannya ringan dan berjalan setelah jawaban tampil, jadi tidak
 * menambah waktu tunggu pengguna.
 */
export async function saranLanjutan(
  riwayat: { role: string; content: string }[],
): Promise<string[]> {
  const potongan = riwayat.filter((m) => m.role !== "system").slice(-6);
  if (potongan.length === 0) return [];

  const transkrip = potongan
    .map((m) => `${m.role === "user" ? "Pengguna" : "Kirby"}: ${m.content.slice(0, 600)}`)
    .join("\n");

  try {
    const { text } = await generateText({
      model: memoriModel(),
      system:
        "Kamu menyusun pertanyaan lanjutan untuk percakapan. Balas HANYA array JSON berisi maksimal 3 string; tiap string satu pertanyaan singkat (maks 9 kata) dalam Bahasa Indonesia, langsung bisa dikirim pengguna. Tanpa penjelasan, tanpa markdown.",
      prompt: transkrip,
      temperature: 0.5,
      // Model gpt-oss memakai token untuk "reasoning" lebih dulu; tanpa jatah
      // cukup jawabannya kosong dengan finish_reason=length.
      maxOutputTokens: 700,
      providerOptions: { groq: { reasoningEffort: "low" } },
    });
    return bersihkanSaran(text);
  } catch {
    // Saran hanya pelengkap: gagal = tidak ada chip, chat tetap jalan.
    return [];
  }
}

/** Ambil array JSON dari balasan model; sisakan string pendek dan unik. */
export function bersihkanSaran(teks: string): string[] {
  const mulai = teks.indexOf("[");
  const selesai = teks.lastIndexOf("]");
  if (mulai === -1 || selesai <= mulai) return [];

  let data: unknown;
  try {
    data = JSON.parse(teks.slice(mulai, selesai + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const unik = new Set<string>();
  for (const butir of data) {
    if (typeof butir !== "string") continue;
    const isi = butir.replace(/^[-*\d.\s]+/, "").replace(/\s+/g, " ").trim().slice(0, MAKS_PANJANG);
    if (isi.length < 8) continue;
    unik.add(isi);
    if (unik.size >= MAKS_SARAN) break;
  }
  return [...unik];
}