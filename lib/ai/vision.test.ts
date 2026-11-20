import { describe, expect, it } from "vitest";

import { gabungTeksVisi } from "./vision";

describe("gabungTeksVisi", () => {
  it("memakai deskripsi dan OCR bila keduanya ada", () => {
    const teks = gabungTeksVisi("Seorang pria memegang kardus.", "MERAH-42");
    expect(teks).toContain("Deskripsi gambar:");
    expect(teks).toContain("Seorang pria memegang kardus.");
    expect(teks).toContain("Tulisan yang terbaca di gambar:");
    expect(teks).toContain("MERAH-42");
  });

  it("hanya deskripsi bila OCR kosong", () => {
    const teks = gabungTeksVisi("Pemandangan pantai.", "   ");
    expect(teks).toContain("Pemandangan pantai.");
    expect(teks).not.toContain("Tulisan yang terbaca");
  });

  it("hanya OCR bila deskripsi kosong", () => {
    const teks = gabungTeksVisi("", "Total: 120");
    expect(teks).toContain("Total: 120");
    expect(teks).not.toContain("Deskripsi gambar");
  });

  it("menghasilkan string kosong bila keduanya kosong", () => {
    expect(gabungTeksVisi("  ", "\n")).toBe("");
  });
});