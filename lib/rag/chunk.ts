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
    const bagian = p.length > size ? pecahPanjang(p, size) : [p];
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
