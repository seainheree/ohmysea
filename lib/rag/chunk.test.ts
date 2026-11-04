import { describe, expect, it } from "vitest";

import { chunkText, isTableBlock, pecahTabel } from "./chunk";

describe("chunkText", () => {
  it("teks kosong menghasilkan daftar kosong", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("teks pendek jadi satu potongan", () => {
    const hasil = chunkText("Satu paragraf pendek.", { size: 100, overlap: 10 });
    expect(hasil).toHaveLength(1);
    expect(hasil[0]).toBe("Satu paragraf pendek.");
  });

  it("tidak ada potongan yang melebihi ukuran + toleransi", () => {
    const teks = Array.from({ length: 60 }, (_, i) => `Kalimat nomor ${i} isinya sedang saja.`).join("\n\n");
    const hasil = chunkText(teks, { size: 400, overlap: 50 });
    expect(hasil.length).toBeGreaterThan(1);
    for (const p of hasil) {
      // toleransi: potongan terakhir sebuah paragraf bisa sedikit lebih panjang
      expect(p.length).toBeLessThanOrEqual(400 + 50 + 80);
    }
  });

  it("potongan berikutnya membawa overlap dari potongan sebelumnya", () => {
    const paragraf = Array.from({ length: 30 }, (_, i) => `Paragraf ${i} berisi beberapa kata.`).join("\n\n");
    const hasil = chunkText(paragraf, { size: 200, overlap: 60 });
    expect(hasil.length).toBeGreaterThan(1);
    const ekorSebelumnya = hasil[0]!.slice(-20);
    expect(hasil[1]!.includes(ekorSebelumnya.split("\n")[0]!.slice(-10))).toBe(true);
  });

  it("paragraf sangat panjang dipecah paksa tanpa kehilangan isi", () => {
    const panjang = "a".repeat(2500);
    const hasil = chunkText(panjang, { size: 1000, overlap: 100 });
    const totalChar = hasil.join("").length;
    expect(hasil.length).toBeGreaterThanOrEqual(3);
    expect(totalChar).toBeGreaterThanOrEqual(2500);
  });

  it("menolak ukuran/overlap tidak masuk akal", () => {
    expect(() => chunkText("x", { size: 0 })).toThrow();
    expect(() => chunkText("x", { size: 10, overlap: 10 })).toThrow();
    expect(() => chunkText("x", { size: 10, overlap: -1 })).toThrow();
  });
});

describe("tabel markdown", () => {
  const tabel = [
    "| Item | Implementasi | Dicek oleh |",
    "|---|---|---|",
    ...Array.from(
      { length: 12 },
      (_, i) => `| baris ${i} | nilai yang cukup panjang untuk mengisi ruang ${i} | manual |`,
    ),
  ].join("\n");

  it("mengenali blok tabel", () => {
    expect(isTableBlock(tabel)).toBe(true);
    expect(isTableBlock("cuma paragraf biasa")).toBe(false);
    expect(isTableBlock("| a | b |\n| c | d |")).toBe(false);
  });

  it("setiap potongan membawa baris judul dan garis pemisah", () => {
    const hasil = pecahTabel(tabel, 300);
    expect(hasil.length).toBeGreaterThan(1);
    for (const p of hasil) {
      expect(p.startsWith("| Item | Implementasi | Dicek oleh |")).toBe(true);
      expect(p.split("\n")[1]).toContain("---");
    }
  });

  it("tidak memecah satu baris tabel di tengah", () => {
    const hasil = pecahTabel(tabel, 300);
    for (const p of hasil) {
      for (const b of p.split("\n")) {
        expect(b.trim().startsWith("|")).toBe(true);
        expect(b.trim().endsWith("|")).toBe(true);
      }
    }
  });

  it("chunkText memakai jalur tabel sehingga fakta dalam tabel jadi potongan sendiri", () => {
    const isi = `Pendahuluan singkat.\n\n${tabel}\n\nPenutup singkat.`;
    const hasil = chunkText(isi, { size: 300, overlap: 40 });
    const adaJudulTabel = hasil.filter((p) => p.includes("| Item | Implementasi |"));
    expect(adaJudulTabel.length).toBeGreaterThan(1);
    // semua baris data tabel tetap ada
    for (let i = 0; i < 12; i += 1) {
      expect(hasil.some((p) => p.includes(`| baris ${i} |`))).toBe(true);
    }
  });
});
