/**
 * Ekstraksi teks lampiran — SEMUA berjalan di browser.
 *
 * Alasan: Vercel Functions membatasi body request 4,5 MB, jadi file 10 MB tidak
 * bisa dikirim ke API route (413). Browser membaca file, mengeluarkan teksnya,
 * lalu hanya teks itu yang dikirim ke server. Berkas asli tidak pernah disimpan.
 *
 * Pustaka berat (pdfjs, tesseract) diimpor dinamis: hanya terunduh saat jenis
 * berkas itu benar-benar dilampirkan.
 */

import { extractOoxml, type OoxmlKind } from "./ooxml";

export const BATAS_BYTE = 10 * 1024 * 1024;
export const BATAS_TEKS = 500_000;

export type JenisLampiran = "teks" | "pdf" | "docx" | "pptx" | "xlsx" | "gambar";

export type HasilEkstraksi = {
  teks: string;
  jenis: JenisLampiran;
  /** true kalau teks dipotong di BATAS_TEKS. */
  dipotong: boolean;
  /** Jumlah halaman PDF, bila ada. */
  halaman?: number;
  /** true kalau sebagian isi dibaca lewat OCR. */
  ocr: boolean;
};

const EKSTENSI_TEKS = new Set([
  "txt", "md", "markdown", "csv", "tsv", "json", "jsonl", "html", "htm", "xml",
  "yaml", "yml", "log", "sql", "ts", "tsx", "js", "jsx", "py", "css", "ini", "toml", "sh", "env",
]);
const EKSTENSI_GAMBAR = new Set(["png", "jpg", "jpeg", "webp", "bmp", "gif", "tif", "tiff"]);

function ekstensi(nama: string): string {
  const titik = nama.lastIndexOf(".");
  return titik === -1 ? "" : nama.slice(titik + 1).toLowerCase();
}

/** Tentukan jenis dari ekstensi (utama) lalu mime. Ekstensi lebih andal di Windows. */
export function jenisDari(berkas: { name: string; type: string }): JenisLampiran | null {
  const ext = ekstensi(berkas.name);
  if (EKSTENSI_TEKS.has(ext)) return "teks";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "pptx") return "pptx";
  if (ext === "xlsx") return "xlsx";
  if (EKSTENSI_GAMBAR.has(ext)) return "gambar";

  const mime = berkas.type.toLowerCase();
  if (mime.startsWith("text/")) return "teks";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "gambar";

  return null;
}

function rapikan(teks: string): string {
  return teks
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** HTML/XML: buang skrip, gaya, dan tag supaya yang tersisa hanya teks terbaca. */
function teksDariMarkup(markup: string): string {
  return rapikan(
    markup
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|li|tr|h[1-6]|section|article)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (utuh, isi: string) => {
        const peta: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
        if (isi.startsWith("#x") || isi.startsWith("#X")) return String.fromCodePoint(Number.parseInt(isi.slice(2), 16));
        if (isi.startsWith("#")) return String.fromCodePoint(Number.parseInt(isi.slice(1), 10));
        return peta[isi] ?? utuh;
      }),
  );
}

async function bacaTeks(berkas: File): Promise<string> {
  const mentah = await berkas.text();
  const ext = ekstensi(berkas.name);
  if (ext === "html" || ext === "htm" || ext === "xml") return teksDariMarkup(mentah);
  return rapikan(mentah);
}

/** OCR satu gambar memakai tesseract (diunduh saat dipakai, model bahasa Indonesia). */
async function ocr(sumber: Blob | HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("ind");
  try {
    const { data } = await worker.recognize(sumber);
    return rapikan(data.text);
  } finally {
    await worker.terminate();
  }
}

type PdfTextItem = { str?: string };

async function bacaPdf(
  berkas: File,
  lapor: (pesan: string) => void,
): Promise<{ teks: string; halaman: number; ocr: boolean }> {
  const pdfjs = await import("pdfjs-dist");
  // Worker disajikan Next dari aset modul; tanpa ini pdfjs memaksa parse di main thread.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const tugas = pdfjs.getDocument({ data: new Uint8Array(await berkas.arrayBuffer()) });
  const dokumen = await tugas.promise;
  const jumlahHalaman = dokumen.numPages;
  const bagian: string[] = [];
  let pakaiOcr = false;

  try {
    for (let nomor = 1; nomor <= jumlahHalaman; nomor += 1) {
      lapor(`Membaca halaman ${nomor}/${jumlahHalaman}`);
      const halaman = await dokumen.getPage(nomor);
      const konten = await halaman.getTextContent();
      const teks = rapikan(
        (konten.items as PdfTextItem[]).map((item) => item.str ?? "").join(" "),
      );

      if (teks.length >= 40) {
        bagian.push(`[Halaman ${nomor}]\n${teks}`);
        continue;
      }

      // Halaman tanpa lapisan teks = hasil scan. Render lalu OCR halaman itu saja.
      const skala = 2;
      const viewport = halaman.getViewport({ scale: skala });
      const kanvas = document.createElement("canvas");
      kanvas.width = Math.floor(viewport.width);
      kanvas.height = Math.floor(viewport.height);
      const konteks = kanvas.getContext("2d");
      if (!konteks) {
        bagian.push(`[Halaman ${nomor}]\n(tidak terbaca)`);
        continue;
      }
      await halaman.render({ canvas: kanvas, canvasContext: konteks, viewport }).promise;
      const hasilOcr = await ocr(kanvas);
      pakaiOcr = true;
      bagian.push(`[Halaman ${nomor}]\n${hasilOcr || "(tidak terbaca)"}`);
      halaman.cleanup();
    }
  } finally {
    // destroy() pada loading task ikut menghentikan worker pdfjs.
    await tugas.destroy();
  }

  return { teks: bagian.join("\n\n"), halaman: jumlahHalaman, ocr: pakaiOcr };
}

/**
 * Ekstrak teks dari satu berkas. Melempar Error berbahasa Indonesia yang siap
 * ditampilkan ke pengguna.
 */
export async function extractText(
  berkas: File,
  lapor: (pesan: string) => void = () => {},
): Promise<HasilEkstraksi> {
  if (berkas.size > BATAS_BYTE) {
    throw new Error(`Berkas ${(berkas.size / 1024 / 1024).toFixed(1)} MB melebihi batas 10 MB`);
  }
  if (berkas.size === 0) throw new Error("Berkas kosong");

  const jenis = jenisDari(berkas);
  if (!jenis) {
    const ext = ekstensi(berkas.name) || berkas.type || "tak dikenal";
    throw new Error(
      `Jenis berkas ".${ext}" belum didukung. Format lama .doc/.ppt/.xls: simpan ulang sebagai .docx/.pptx/.xlsx.`,
    );
  }

  const bytes = new Uint8Array(await berkas.arrayBuffer());
  let teks = "";
  let halaman: number | undefined;
  let pakaiOcr = false;

  if (jenis === "teks") {
    lapor("Membaca teks");
    teks = await bacaTeks(berkas);
  } else if (jenis === "pdf") {
    const hasil = await bacaPdf(berkas, lapor);
    teks = hasil.teks;
    halaman = hasil.halaman;
    pakaiOcr = hasil.ocr;
  } else if (jenis === "gambar") {
    lapor("OCR gambar");
    teks = await ocr(berkas);
    pakaiOcr = true;
  } else {
    lapor(`Membaca ${jenis.toUpperCase()}`);
    teks = extractOoxml(bytes, jenis as OoxmlKind);
  }

  if (!teks.trim()) {
    throw new Error("Tidak ada teks yang bisa diambil — berkas mungkin hanya berisi gambar tanpa OCR");
  }

  const dipotong = teks.length > BATAS_TEKS;
  return {
    teks: dipotong ? teks.slice(0, BATAS_TEKS) : teks,
    jenis,
    dipotong,
    halaman,
    ocr: pakaiOcr,
  };
}