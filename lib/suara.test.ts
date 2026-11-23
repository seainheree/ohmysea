import { describe, expect, it } from "vitest";

import { deteksiBahasa, potongBahasa, potongKalimat, skorSuara, teksUntukSuara } from "./suara";

describe("teks untuk suara", () => {
  it("membuang penanda markdown tanpa membuang isi", () => {
    const md = "## Judul\n\n**Penting**: ini `kode` dan [tautan](https://contoh.id).";
    expect(teksUntukSuara(md)).toBe("Judul Penting: ini kode dan tautan.");
  });

  it("membuang blok kode dan gambar", () => {
    const md = "Sebelum\n```ts\nconst x = 1;\n```\nSesudah ![alt](/a.png)";
    expect(teksUntukSuara(md)).toBe("Sebelum Sesudah");
  });

  it("merapikan daftar, kutipan, dan garis", () => {
    const md = "> kutip\n\n- satu\n- dua\n\n---";
    expect(teksUntukSuara(md)).toBe("kutip satu dua");
  });

  it("membuang emoji supaya tidak dibaca namanya", () => {
    expect(teksUntukSuara("Hai! 🥺💕 poyoo~ ✨")).toBe("Hai! poyoo~");
  });
});

describe("pemilihan suara", () => {
  it("mengutamakan voice Indonesia yang natural", () => {
    const natural = skorSuara({ lang: "id-ID", name: "Microsoft Gadis Online (Natural)" });
    const robot = skorSuara({ lang: "id-ID", name: "Microsoft Andika", localService: true });
    const inggris = skorSuara({ lang: "en-US", name: "Google US English" });
    expect(natural).toBeGreaterThan(robot);
    expect(robot).toBeGreaterThan(inggris);
  });

  it("memilih voice Inggris saat teksnya Inggris", () => {
    const en = skorSuara({ lang: "en-US", name: "Google US English" }, "en");
    const id = skorSuara({ lang: "id-ID", name: "Microsoft Gadis" }, "en");
    expect(en).toBeGreaterThan(id);
  });
});

describe("deteksi bahasa", () => {
  it("default Indonesia dan istilah teknis tidak memicu Inggris", () => {
    expect(deteksiBahasa("Aku suka kopi hitam")).toBe("id");
    expect(deteksiBahasa("Deploy pakai Vercel biar cepat")).toBe("id");
  });

  it("mengenali kalimat Inggris", () => {
    expect(deteksiBahasa("This is a simple test")).toBe("en");
  });

  it("memecah campuran per klausa supaya voice ikut berganti", () => {
    expect(potongBahasa("Halo, how are you?")).toEqual([
      { teks: "Halo,", bahasa: "id" },
      { teks: "how are you?", bahasa: "en" },
    ]);
  });
});

describe("pemecah kalimat", () => {
  it("memisahkan kalimat supaya intonasi tidak datar", () => {
    expect(potongKalimat("Halo. Apa kabar? Baik!")).toEqual(["Halo.", "Apa kabar?", "Baik!"]);
  });

  it("memotong kalimat yang kepanjangan", () => {
    const hasil = potongKalimat("A".repeat(50) + ". " + "B".repeat(300), 180);
    expect(hasil.length).toBeGreaterThan(1);
    for (const bagian of hasil) expect(bagian.length).toBeLessThanOrEqual(180);
  });
});