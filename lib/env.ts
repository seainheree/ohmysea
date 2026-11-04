import { z } from "zod";

/**
 * Validasi environment. Gagal cepat: kalau ada variabel wajib yang kosong,
 * proses berhenti dengan daftar yang jelas — bukan error samar di tengah jalan.
 * Dipakai hanya di kode server (lib/ dan route handler).
 */

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib (connection string pooler Supabase)"),
  DIRECT_URL: z.string().min(1).optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.url({ error: "NEXT_PUBLIC_SUPABASE_URL harus URL" }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY wajib untuk upload gambar"),

  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY wajib"),
  GROQ_MODEL_CHAT: z.string().min(1).default("openai/gpt-oss-120b"),
  GROQ_MODEL_CURHAT: z.string().min(1).default("qwen/qwen3.8-27b"),

  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, "CLOUDFLARE_ACCOUNT_ID wajib"),
  CLOUDFLARE_API_TOKEN: z.string().min(1, "CLOUDFLARE_API_TOKEN wajib"),
  CF_MODEL_EMBED: z.string().min(1).default("@cf/baai/bge-m3"),
  CF_MODEL_IMAGE: z.string().min(1).default("@cf/black-forest-labs/flux-2-klein-4b"),

  FIRECRAWL_API_KEY: z.string().min(1).optional(),

  APP_ACCESS_CODE: z.string().min(6, "APP_ACCESS_CODE minimal 6 karakter"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** Baca env sekali, validasi, simpan hasilnya. */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const daftar = parsed.error.issues
      .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Environment belum lengkap. Isi berkas .env (lihat .env.example):\n${daftar}`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Untuk /api/health: laporkan variabel wajib yang belum terisi tanpa membocorkan nilai. */
export function envReport(): { ok: boolean; hilang: string[]; model: Record<string, string> } {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    return {
      ok: false,
      hilang: parsed.error.issues.map((i) => i.path.join(".") || "(root)"),
      model: {},
    };
  }
  return {
    ok: true,
    hilang: [],
    model: {
      chat: parsed.data.GROQ_MODEL_CHAT,
      curhat: parsed.data.GROQ_MODEL_CURHAT,
      embedding: parsed.data.CF_MODEL_EMBED,
      image: parsed.data.CF_MODEL_IMAGE,
    },
  };
}
