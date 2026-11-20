import { getEnv } from "@/lib/env";

/**
 * Baca isi gambar lewat model multimodal Cloudflare Workers AI.
 *
 * Akun Groq di proyek ini tidak punya model vision (semua teks/audio), sedangkan
 * Cloudflare sudah dipakai untuk embedding dan pembuatan gambar — jadi jalur ini
 * tidak menambah penyedia baru.
 *
 * Kenapa endpoint /ai/v1/chat/completions dan bukan /ai/run: model image-to-text
 * khusus (`@cf/moondream/...`) menolak body multipart maupun array byte, dan
 * `@cf/llava-hf/llava-1.5-7b-hf` sudah deprecated 2026-11-20. Jalur chat
 * OpenAI-compatible menerima data URL base64 dan terbukti membaca teks gambar.
 */

const PROMPT_GAMBAR = `Jelaskan gambar ini secara rinci dalam bahasa Indonesia.
Sebutkan objek utama, suasana, dan konteks yang terlihat.
Jika ada tulisan di dalam gambar, tulis ulang teksnya apa adanya.
Jangan mengarang hal yang tidak terlihat.`;

export type HasilVisi = {
  deskripsi: string;
  model: string;
};

type CfChatResponse = {
  choices?: { message?: { content?: string } }[];
  errors?: { message?: string }[];
};

/**
 * Gabungkan deskripsi model dengan teks OCR. OCR lebih akurat untuk tulisan,
 * model lebih baik untuk menggambarkan isi — keduanya dipakai, yang kosong dibuang.
 */
export function gabungTeksVisi(deskripsi: string, ocr: string): string {
  const bagian: string[] = [];
  const d = deskripsi.trim();
  const o = ocr.trim();
  if (d) bagian.push(`Deskripsi gambar:\n${d}`);
  if (o) bagian.push(`Tulisan yang terbaca di gambar:\n${o}`);
  return bagian.join("\n\n");
}

/** Kirim gambar ke model vision, kembalikan deskripsinya. */
export async function lihatGambar(input: { bytes: Uint8Array; mime: string }): Promise<HasilVisi> {
  const env = getEnv();
  const model = env.CF_MODEL_VISION;
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`;

  const dataUrl = `data:${input.mime};base64,${Buffer.from(input.bytes).toString("base64")}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT_GAMBAR },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  const teks = await res.text();
  let data: CfChatResponse = {};
  try {
    data = JSON.parse(teks) as CfChatResponse;
  } catch {
    // biarkan kosong; ditangani di bawah
  }

  if (!res.ok) {
    const pesan = (data.errors ?? []).map((e) => e.message).filter(Boolean).join("; ");
    throw new Error(pesan || `Model vision menolak permintaan (HTTP ${res.status})`);
  }

  const deskripsi = (data.choices?.[0]?.message?.content ?? "").trim();

  if (!deskripsi) throw new Error("Model vision tidak mengembalikan deskripsi");

  return { deskripsi, model };
}