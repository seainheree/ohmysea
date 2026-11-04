import { describe, expect, it } from "vitest";

import { chunkText } from "./chunk";

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
