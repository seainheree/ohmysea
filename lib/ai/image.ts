import { getEnv } from "@/lib/env";
import { susunPrompt } from "./styles";

export type HasilGambar = { bytes: Uint8Array; contentType: string };

type CfRunResponse = {
  success?: boolean;
  result?: { image?: string };
  errors?: { message?: string }[];
};

/**
 * Panggil Cloudflare Workers AI untuk membuat gambar (ADR-003).
 * - Model klein: menerima multipart; gambar referensi lewat field `input_image_0`.
 * - Model lain (flux-1-schnell): menerima JSON, tanpa gambar referensi.
 * Hasil: byte gambar (biasanya JPEG).
 */
export async function generateImage(input: {
  prompt: string;
  style: string;
  model: string;
  width: number;
  height: number;
  transparan?: boolean;
  reference?: { bytes: Uint8Array; contentType: string; nama: string } | null;
  seed?: number;
}): Promise<HasilGambar> {
  const env = getEnv();
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${input.model}`;
  const prompt = susunPrompt(input.prompt, input.style, input.transparan === true);
  const headers: Record<string, string> = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` };

  let body: BodyInit;

  if (input.reference) {
    const form = new FormData();
    form.set("prompt", prompt);
    form.set("width", String(input.width));
    form.set("height", String(input.height));
    if (input.seed !== undefined) form.set("seed", String(input.seed));
    form.set(
      "input_image_0",
      new Blob([new Uint8Array(input.reference.bytes)], { type: input.reference.contentType }),
      input.reference.nama,
    );
    body = form;
  } else if (input.model.includes("klein")) {
    // klein wajib multipart, walau tanpa gambar referensi
    const form = new FormData();
    form.set("prompt", prompt);
    form.set("width", String(input.width));
    form.set("height", String(input.height));
    if (input.seed !== undefined) form.set("seed", String(input.seed));
    body = form;
  } else {
    // Model seperti flux-1-schnell hanya menerima { prompt, steps, seed } —
    // mengirim width/height ditolak ("Additional or unevaluated properties").
    // Dimensi keluaran model ini tetap 1024x1024; tidak mengikuti aspect ratio.
    headers["content-type"] = "application/json";
    body = JSON.stringify(
      input.seed !== undefined ? { prompt, seed: input.seed } : { prompt },
    );
  }

  const res = await fetch(url, { method: "POST", headers, body });
  const contentType = res.headers.get("content-type") ?? "";

  // Model berbasis JSON membalas {result:{image:"<base64>"}}
  if (contentType.includes("application/json")) {
    const data = (await res.json()) as CfRunResponse;
    const b64 = data.result?.image;
    if (!res.ok || !b64) {
      const pesan = data.errors?.[0]?.message ?? `HTTP ${res.status}`;
      throw new Error(pesan.replace(/^AiError:\s*/, ""));
    }
    return { bytes: Uint8Array.from(Buffer.from(b64, "base64")), contentType: "image/jpeg" };
  }

  if (!res.ok) {
    throw new Error(`Gambar gagal dibuat (HTTP ${res.status})`);
  }

  return { bytes: new Uint8Array(await res.arrayBuffer()), contentType: contentType || "image/jpeg" };
}
