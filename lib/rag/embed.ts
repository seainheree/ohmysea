import { getEnv } from "@/lib/env";

export const EMBED_DIMENSIONS = 1024;

type CfResponse = {
  success: boolean;
  result?: { data?: number[][] };
  errors?: { message?: string }[];
};

/**
 * Ubah teks jadi vektor lewat Cloudflare Workers AI (ADR-002).
 * Dipanggil server-side saja. Batching 20 teks per permintaan.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const env = getEnv();
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${env.CF_MODEL_EMBED}`;
  const hasil: number[][] = [];
  const BATCH = 20;

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ text: batch }),
    });

    const data = (await res.json()) as CfResponse;

    if (!res.ok || !data.success || !data.result?.data) {
      const pesan = data.errors?.[0]?.message ?? `HTTP ${res.status}`;
      throw new Error(`Embedding gagal: ${pesan}`);
    }

    for (const v of data.result.data) {
      if (v.length !== EMBED_DIMENSIONS) {
        throw new Error(
          `Dimensi embedding tidak sesuai: ${v.length} (harus ${EMBED_DIMENSIONS}). Ganti model atau kolom DB.`,
        );
      }
      hasil.push(v);
    }
  }

  return hasil;
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  if (!v) throw new Error("Embedding kosong");
  return v;
}

/** Bentuk literal aman untuk dikirim ke pgvector (dipakai sebagai parameter, bukan string mentah). */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.map((n) => (Number.isFinite(n) ? n.toFixed(6) : "0")).join(",")}]`;
}
