export type Mode = "chat" | "curhat";

export type Percakapan = {
  id: string;
  title: string;
  mode: Mode;
  createdAt: string;
  updatedAt: string;
};

export type Pesan = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: { documentId: string; title: string; score: number }[] | null;
  createdAt: string;
};

export type Gambar = {
  id: string;
  prompt: string;
  style: string;
  model: string;
  aspectRatio: string;
  width: number;
  height: number;
  url: string;
  sourceImage: string | null;
  createdAt: string;
};

async function baca<T>(res: Response): Promise<T> {
  const teks = await res.text();
  let data: unknown = null;
  try {
    data = teks ? JSON.parse(teks) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const pesan =
      (data as { pesan?: string } | null)?.pesan ?? `Permintaan gagal (HTTP ${res.status})`;
    throw new Error(pesan);
  }
  return data as T;
}

export async function daftarPercakapan(mode?: Mode): Promise<Percakapan[]> {
  const q = mode ? `?mode=${mode}` : "";
  const res = await fetch(`/api/conversations${q}`, { cache: "no-store" });
  const data = await baca<{ percakapan: Percakapan[] }>(res);
  return data.percakapan;
}

export async function ambilPesan(id: string): Promise<{ percakapan: Percakapan; pesan: Pesan[] }> {
  const res = await fetch(`/api/conversations/${id}`, { cache: "no-store" });
  return baca<{ percakapan: Percakapan; pesan: Pesan[] }>(res);
}

export async function gantiJudul(id: string, title: string): Promise<void> {
  const res = await fetch(`/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title }),
  });
  await baca(res);
}

export async function hapusPercakapan(id: string): Promise<void> {
  const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  await baca(res);
}

/** Hapus seluruh riwayat (opsional: hanya satu mode). */
export async function hapusSemuaPercakapan(mode?: Mode): Promise<number> {
  const q = mode ? `?mode=${mode}` : "";
  const res = await fetch(`/api/conversations${q}`, { method: "DELETE" });
  const data = await baca<{ jumlah: number }>(res);
  return data.jumlah;
}

export type Memori = {
  id: string;
  content: string;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function daftarMemori(): Promise<Memori[]> {
  const res = await fetch("/api/memories", { cache: "no-store" });
  const data = await baca<{ memori: Memori[] }>(res);
  return data.memori;
}

export async function tambahMemori(content: string): Promise<Memori> {
  const res = await fetch("/api/memories", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const data = await baca<{ memori: Memori }>(res);
  return data.memori;
}

export async function ubahMemori(
  id: string,
  perubahan: { content?: string; aktif?: boolean },
): Promise<Memori> {
  const res = await fetch(`/api/memories/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(perubahan),
  });
  const data = await baca<{ memori: Memori }>(res);
  return data.memori;
}

export async function hapusMemori(id: string): Promise<void> {
  const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
  await baca(res);
}

export type RingkasanSehat = {
  ok: boolean;
  env: { ok: boolean; hilang: string[] };
  db: { ok: boolean; detail: string };
  model: Record<string, string>;
};

export async function cekSehat(): Promise<RingkasanSehat> {
  const res = await fetch("/api/health", { cache: "no-store" });
  return baca<RingkasanSehat>(res);
}

export async function buka(kode: string): Promise<void> {
  const res = await fetch("/api/unlock", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: kode }),
  });
  await baca(res);
}

export async function daftarGambar(): Promise<Gambar[]> {
  const res = await fetch("/api/images", { cache: "no-store" });
  const data = await baca<{ gambar: Gambar[] }>(res);
  return data.gambar;
}

/** Kirim pesan dan alirkan balasan; kembalikan conversationId + durasi. */
export async function kirimPesan(input: {
  conversationId?: string;
  mode: Mode;
  message: string;
  autoMemori?: boolean;
  onChunk: (teks: string) => void;
}): Promise<{ conversationId: string; sources: Pesan["sources"]; durasiMs: number }> {
  const mulai = Date.now();
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      conversationId: input.conversationId,
      mode: input.mode,
      message: input.message,
      autoMemori: input.autoMemori,
    }),
  });

  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { pesan?: string } | null;
    throw new Error(data?.pesan ?? `Gagal menjawab (HTTP ${res.status})`);
  }

  const conversationId = res.headers.get("x-ohmysea-conversation") ?? input.conversationId ?? "";
  let sources: Pesan["sources"] = null;
  const headerSumber = res.headers.get("x-ohmysea-sumber");
  if (headerSumber) {
    try {
      sources = JSON.parse(decodeURIComponent(headerSumber));
    } catch {
      sources = null;
    }
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const teks = decoder.decode(value, { stream: true });
    total += teks.length;
    input.onChunk(teks);
  }

  if (total === 0) {
    throw new Error(
      "Model tidak mengembalikan teks. Periksa GROQ_MODEL_CHAT/GROQ_MODEL_CURHAT di .env (harus model yang tersedia di akunmu) atau cek kuota Groq.",
    );
  }

  return { conversationId, sources, durasiMs: Date.now() - mulai };
}

export async function buatGambar(input: {
  prompt: string;
  style: string;
  model: string;
  aspectRatio: string;
  reference?: File | null;
}): Promise<Gambar> {
  const form = new FormData();
  form.set("prompt", input.prompt);
  form.set("style", input.style);
  form.set("model", input.model);
  form.set("aspectRatio", input.aspectRatio);
  if (input.reference) form.set("reference", input.reference);

  const res = await fetch("/api/images", { method: "POST", body: form });
  const data = await baca<{ gambar: Gambar }>(res);
  return data.gambar;
}
