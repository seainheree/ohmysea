"use client";

import { useState } from "react";

const AMBANG = 236; // dianggap "putih latar"
const SELISIH_MAKS = 26; // supaya putih keabuan/krem masih ikut terhapus

function hampirPutih(r: number, g: number, b: number): boolean {
  if (r < AMBANG || g < AMBANG || b < AMBANG) return false;
  return Math.max(r, g, b) - Math.min(r, g, b) <= SELISIH_MAKS;
}

/**
 * Buang latar putih rata dari gambar hasil model (JPEG, tanpa kanal alfa) lalu
 * unduh sebagai PNG transparan. Bekerja di browser: gambar diambil lewat
 * /api/images/file supaya tidak kena batasan canvas tainted.
 */
export function UnduhTransparan({
  id,
  prompt,
  utama = false,
}: {
  id: string;
  prompt: string;
  utama?: boolean;
}) {
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function unduh() {
    setSibuk(true);
    setPesan(null);
    try {
      const res = await fetch(`/api/images/file?id=${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Gagal mengambil gambar (HTTP ${res.status})`);
      const bitmap = await createImageBitmap(await res.blob());

      const kanvas = document.createElement("canvas");
      kanvas.width = bitmap.width;
      kanvas.height = bitmap.height;
      const ctx = kanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas tidak tersedia di browser ini");
      ctx.drawImage(bitmap, 0, 0);

      const gambar = ctx.getImageData(0, 0, kanvas.width, kanvas.height);
      const { data, width, height } = gambar;

      // Banjiri dari tepi: semua piksel putih yang tersambung ke pinggir dihapus.
      const tumpuk: number[] = [];
      const tandai = (x: number, y: number) => {
        const i = (y * width + x) * 4;
        if (data[i + 3] === 0) return;
        if (!hampirPutih(data[i]!, data[i + 1]!, data[i + 2]!)) return;
        data[i + 3] = 0;
        tumpuk.push(x, y);
      };

      for (let x = 0; x < width; x++) {
        tandai(x, 0);
        tandai(x, height - 1);
      }
      for (let y = 0; y < height; y++) {
        tandai(0, y);
        tandai(width - 1, y);
      }

      while (tumpuk.length > 0) {
        const y = tumpuk.pop()!;
        const x = tumpuk.pop()!;
        if (x > 0) tandai(x - 1, y);
        if (x < width - 1) tandai(x + 1, y);
        if (y > 0) tandai(x, y - 1);
        if (y < height - 1) tandai(x, y + 1);
      }

      // Haluskan tepi: piksel putih yang masih terlihat tapi berdampingan dengan
      // area transparan dibuat setengah tembus supaya tidak bergerigi.
      const salinan = new Uint8ClampedArray(data);
      const transparanDi = (x: number, y: number) => salinan[(y * width + x) * 4 + 3] === 0;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          if (salinan[i + 3] === 0) continue;
          if (!hampirPutih(salinan[i]!, salinan[i + 1]!, salinan[i + 2]!)) continue;
          if (transparanDi(x - 1, y) || transparanDi(x + 1, y) || transparanDi(x, y - 1) || transparanDi(x, y + 1)) {
            data[i + 3] = 90;
          }
        }
      }

      ctx.putImageData(gambar, 0, 0);

      const blob = await new Promise<Blob | null>((r) => kanvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("Gagal menyusun PNG");

      const url = URL.createObjectURL(blob);
      const nama =
        prompt
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40) || "ohmysea";
      const tautan = document.createElement("a");
      tautan.href = url;
      tautan.download = `${nama}-transparan.png`;
      tautan.click();
      URL.revokeObjectURL(url);
      bitmap.close();
      setPesan("PNG transparan diunduh.");
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Gagal membuat PNG transparan");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void unduh()}
        disabled={sibuk}
        className={
          utama
            ? "w-fit rounded-penuh bg-aksen px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            : "w-fit text-xs text-teks-muted hover:text-aksen-terang disabled:opacity-60"
        }
      >
        {sibuk ? "Memotong latar..." : "Unduh PNG transparan"}
      </button>
      {pesan && <span className="text-[10px] text-teks-muted-2">{pesan}</span>}
    </span>
  );
}
