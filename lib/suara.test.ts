import { describe, expect, it } from "vitest";

import {
  NADA_BAWAAN,
  batasiNada,
  bacaNada,
  deteksiBahasa,
  potongBahasa,
  potongBicara,
  potongKalimat,
  skorSuara,
  teksUntukSuara,
} from "./suara";

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

describe("jeda & batas frasa", () => {
  it("jeda mengikuti tanda baca, bukan satu nilai untuk semua batas", () => {
    const bagian = potongBicara("Halo, apa kabar? Aku baik.");
    expect(bagian.map((b) => [b.teks, b.jeda])).toEqual([
      ["Halo, apa kabar?", 220],
      ["Aku baik.", 220],
    ]);
  });

  it("koma sebelum ganti bahasa tetap jadi jeda pendek", () => {
    const bagian = potongBicara("Halo, how are you?");
    expect(bagian.map((b) => [b.teks, b.bahasa, b.jeda])).toEqual([
      ["Halo,", "id", 80],
      ["how are you?", "en", 220],
    ]);
  });

  it("tidak memotong setelah preposisi/konjungsi dan tidak berhenti di tengah frasa", () => {
    const kalimat = "Aku pergi ke pasar untuk membeli sayur yang segar dan murah sekali";
    const bagian = potongBicara(kalimat, 40);
    const menggantung = ["di", "ke", "dari", "untuk", "dengan", "yang", "dan", "atau"];
    for (const b of bagian) {
      expect(b.teks.length).toBeLessThanOrEqual(40);
      const akhir = b.teks.split(/\s+/).pop()?.toLowerCase() ?? "";
      expect(menggantung).not.toContain(akhir);
    }
    // Potongan karena panjang tanpa tanda baca tidak diberi jeda buatan.
    expect(bagian[0].jeda).toBe(0);
  });
});

describe("nada suara", () => {
  it("membatasi nilai slider ke rentang aman", () => {
    expect(batasiNada(9, 9)).toEqual({ pitch: 2, rate: 1.6 });
    expect(batasiNada(0.2, 0.1)).toEqual({ pitch: 1, rate: 0.7 });
    expect(batasiNada(1.65, 1.03)).toEqual({ pitch: 1.65, rate: 1.03 });
  });

  it("memakai bawaan saat tidak ada window (server)", () => {
    expect(bacaNada()).toEqual(NADA_BAWAAN);
  });
});