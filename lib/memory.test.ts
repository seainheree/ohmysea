import { describe, expect, it } from "vitest";

import {
  buildMemoryBlock,
  layakDisimpan,
  saringKandidat,
  terlaluMirip,
} from "./memory";

describe("buildMemoryBlock", () => {
  it("tanpa memori menghasilkan string kosong", () => {
    expect(buildMemoryBlock([])).toBe("");
  });

  it("membentuk daftar berbutir dengan pengantar yang jelas", () => {
    const hasil = buildMemoryBlock(["namaku Sasha", "suka jawaban singkat"]);
    expect(hasil).toContain("Yang kamu ingat tentang pengguna");
    expect(hasil).toContain("- namaku Sasha");
    expect(hasil).toContain("- suka jawaban singkat");
  });

  it("melarang model mengarang di luar daftar", () => {
    const hasil = buildMemoryBlock(["aku kerja sebagai desainer"]);
    expect(hasil.toLowerCase()).toContain("jangan mengarang");
  });
});

describe("too similar (cegah duplikat memori)", () => {
  it("menangkap kalimat yang isinya sama walau beda tanda baca/huruf besar", () => {
    expect(terlaluMirip("Namaku Sasha.", "namaku sasha")).toBe(true);
  });

  it("menangkap versi lebih panjang dari fakta yang sama", () => {
    expect(terlaluMirip("aku suka kopi hitam tanpa gula", "aku suka kopi hitam")).toBe(true);
  });

  it("membiarkan fakta berbeda", () => {
    expect(terlaluMirip("aku suka kopi", "aku tinggal di Bandung")).toBe(false);
  });

  it("menangkap fakta sama yang ditulis dengan kata berbeda-beda", () => {
    expect(terlaluMirip("Aku seorang desainer", "Aku kerja sebagai desainer grafis")).toBe(true);
  });
});

describe("layakDisimpan (saringan memori otomatis)", () => {
  const kosong: string[] = [];

  it("menerima fakta pribadi yang tahan lama", () => {
    const hasil = layakDisimpan(
      { teks: "Panggilan yang aku suka adalah Sha.", kategori: "preferensi", keyakinan: 0.9 },
      kosong,
    );
    expect(hasil.ok).toBe(true);
  });

  it("menolak data sensitif", () => {
    for (const teks of [
      "Kata sandi aku adalah rahasia123",
      "PIN kartu aku 1234",
      "NIK aku 3201234567890001",
      "Nomor rekening aku di BCA",
    ]) {
      const hasil = layakDisimpan({ teks, kategori: "identitas", keyakinan: 0.9 }, kosong);
      expect(hasil.ok, teks).toBe(false);
    }
  });

  it("menolak kejadian sesaat atau emosi sementara", () => {
    const hasil = layakDisimpan(
      { teks: "Aku capek banget hari ini", kategori: "kebiasaan", keyakinan: 0.9 },
      kosong,
    );
    expect(hasil.ok).toBe(false);
  });

  it("menolak kategori di luar daftar", () => {
    const hasil = layakDisimpan(
      { teks: "Aku sedang sedih karena pekerjaan", kategori: "emosi", keyakinan: 0.9 },
      kosong,
    );
    expect(hasil.ok).toBe(false);
  });

  it("menolak fakta yang bukan tentang pengguna", () => {
    const hasil = layakDisimpan(
      { teks: "Groq menyediakan model gpt-oss-120b", kategori: "pekerjaan", keyakinan: 0.9 },
      kosong,
    );
    expect(hasil.ok).toBe(false);
  });

  it("menolak terlalu pendek, terlalu panjang, dan keyakinan rendah", () => {
    expect(layakDisimpan({ teks: "aku suka", kategori: "preferensi" }, kosong).ok).toBe(false);
    expect(
      layakDisimpan({ teks: `aku suka ${"kata ".repeat(120)}`, kategori: "preferensi" }, kosong).ok,
    ).toBe(false);
    expect(
      layakDisimpan({ teks: "Aku suka kopi tanpa gula", kategori: "preferensi", keyakinan: 0.3 }, kosong)
        .ok,
    ).toBe(false);
  });

  it("menolak yang sudah ada di daftar memori", () => {
    const hasil = layakDisimpan(
      { teks: "Aku suka kopi hitam tanpa gula", kategori: "preferensi", keyakinan: 0.9 },
      ["aku suka kopi hitam"],
    );
    expect(hasil.ok).toBe(false);
  });
});

describe("saringKandidat (batas per pertukaran)", () => {
  it("mengambil maksimum 2 butir yang layak dan membuang sisanya", () => {
    const hasil = saringKandidat(
      [
        { teks: "Aku suka kopi hitam tanpa gula", kategori: "preferensi", keyakinan: 0.9 },
        { teks: "Aku kerja sebagai desainer grafis", kategori: "pekerjaan", keyakinan: 0.9 },
        { teks: "Aku tinggal di Bandung sejak kecil", kategori: "identitas", keyakinan: 0.9 },
      ],
      [],
    );
    expect(hasil).toHaveLength(2);
    expect(hasil[0]).toContain("kopi");
  });

  it("membuang kandidat yang kembar satu sama lain", () => {
    const hasil = saringKandidat(
      [
        { teks: "Aku suka kopi hitam tanpa gula", kategori: "preferensi", keyakinan: 0.9 },
        { teks: "aku suka kopi hitam tanpa gula!", kategori: "preferensi", keyakinan: 0.9 },
      ],
      [],
    );
    expect(hasil).toHaveLength(1);
  });

  it("daftar kosong kalau tidak ada yang layak", () => {
    expect(saringKandidat([{ teks: "hai", kategori: "preferensi" }], [])).toEqual([]);
    expect(saringKandidat([], [])).toEqual([]);
  });
});
