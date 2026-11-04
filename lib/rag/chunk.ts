/**
 * Pemecah teks jadi potongan (chunk) seukuran nyaman untuk embedding.
 * Aturan: utamakan batas paragraf; kalau paragraf lebih panjang dari ukuran,
 * potong per kalimat; kalau masih terlalu panjang, potong paksa per karakter.
 * Setiap potongan (kecuali yang terakhir) menyisakan `overlap` karakter dari
 * potongan sebelumnya supaya konteks tidak hilang di batas potongan.
 */
export type ChunkOptions = {
  size?: number;
  overlap?: number;
};

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const size = options.size ?? 1000;
  const overlap = options.overlap ?? 150;

  if (size <= 0) throw new Error("size harus > 0");
  if (overlap < 0 || overlap >= size) throw new Error("overlap harus >= 0 dan < size");

  const bersih = text.replace(/\r\n/g, "\n").trim();
  if (!bersih) return [];

  const paragraf = bersih
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const potongan: string[] = [];
  let buffer = "";

  const dorong = () => {
    const isi = buffer.trim();
    if (isi) potongan.push(isi);
    buffer = "";
  };

  for (const p of paragraf) {
    const bagian = isTableBlock(p)
      ? pecahTabel(p, size)
      : p.length > size
        ? pecahPanjang(p, size)
        : [p];
    for (const b of bagian) {
      if (!buffer) {
        buffer = b;
      } else if (buffer.length + 2 + b.length <= size) {
        buffer = `${buffer}\n\n${b}`;
      } else {
        const sebelumnya = buffer;
        dorong();
        const ekor = overlap > 0 ? sebelumnya.slice(-overlap) : "";
        buffer = ekor ? `${ekor}\n\n${b}` : b;
      }
    }
  }
  dorong();

  return potongan;
}

/** Blok berbentuk tabel markdown: baris judul, garis pemisah, lalu baris data. */
export function isTableBlock(blok: string): boolean {
  const baris = blok
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
  if (baris.length < 3) return false;
  if (!/^\|.*\|$/.test(baris[0]!)) return false;
  return /^\|[\s:|-]+\|$/.test(baris[1]!);
}

/**
 * Pecah tabel markdown per beberapa baris, dan **ulangi baris judul + garis
 * pemisah** di setiap potongan. Tanpa ini, satu fakta di dalam tabel (mis.
 * "top-k 6") tenggelam di blok besar dan sulit ditemukan retrieval.
 */
export function pecahTabel(blok: string, size: number, maksBaris = 8): string[] {
  const baris = blok
    .split("\n")
    .map((b) => b.trimEnd())
    .filter((b) => b.trim().length > 0);

  const judul = baris.slice(0, 2);
  const data = baris.slice(2);
  if (data.length === 0) return [blok.trim()];

  const potongan: string[] = [];
  let i = 0;

  while (i < data.length) {
    const ambil: string[] = [];
    let panjang = judul.join("\n").length;

    while (i < data.length && ambil.length < maksBaris) {
      const kandidat = data[i]!;
      if (ambil.length > 0 && panjang + kandidat.length + 1 > size) break;
      ambil.push(kandidat);
      panjang += kandidat.length + 1;
      i += 1;
    }

    potongan.push([...judul, ...ambil].join("\n"));
  }

  return potongan;
}

function pecahPanjang(paragraf: string, size: number): string[] {
  const kalimat = paragraf.split(/(?<=[.!?])\s+/);
  const hasil: string[] = [];
  let buffer = "";

  for (const k of kalimat) {
    if (k.length > size) {
      if (buffer.trim()) {
        hasil.push(buffer.trim());
        buffer = "";
      }
      for (let i = 0; i < k.length; i += size) {
        hasil.push(k.slice(i, i + size).trim());
      }
      continue;
    }
    if (!buffer) buffer = k;
    else if (buffer.length + 1 + k.length <= size) buffer = `${buffer} ${k}`;
    else {
      hasil.push(buffer.trim());
      buffer = k;
    }
  }
  if (buffer.trim()) hasil.push(buffer.trim());

  return hasil.filter(Boolean);
}
