import { createClient } from "@supabase/supabase-js";

import { getEnv } from "@/lib/env";

export const BUCKET_GAMBAR = "images";

type UploadResult = { url: string; path: string };

function adminClient() {
  const env = getEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** Buat bucket kalau belum ada (idempoten). Bucket publik agar URL bisa langsung dipakai <img>. */
export async function pastikanBucket(): Promise<void> {
  const supabase = adminClient();
  const { data } = await supabase.storage.getBucket(BUCKET_GAMBAR);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET_GAMBAR, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Gagal membuat bucket ${BUCKET_GAMBAR}: ${error.message}`);
  }
}

/** Unggah gambar, kembalikan URL publik. */
export async function unggahGambar(input: {
  bytes: Uint8Array;
  contentType: string;
  folder?: string;
}): Promise<UploadResult> {
  const supabase = adminClient();
  const ext = input.contentType.includes("png") ? "png" : input.contentType.includes("webp") ? "webp" : "jpg";
  const path = `${input.folder ?? "hasil"}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_GAMBAR)
    .upload(path, input.bytes, { contentType: input.contentType, upsert: false });

  if (error) throw new Error(`Upload ke Storage gagal: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET_GAMBAR).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Unggah gambar referensi (dipakai lalu disimpan sebagai jejak). */
export async function unggahReferensi(bytes: Uint8Array, contentType: string): Promise<UploadResult> {
  return unggahGambar({ bytes, contentType, folder: "referensi" });
}
