import { describe, expect, it } from "vitest";

import { bersihkanSaran, MAKS_SARAN } from "./saran";
import { parseMarkdown, sebaris } from "./markdown";

describe("bersihkanSaran", () => {
  it("mengambil array JSON dari balasan kotor", () => {
    expect(bersihkanSaran('Berikut saran: ["Apa itu RAG?", "Buatkan contoh chunk"]')).toEqual([
      "Apa itu RAG?",
      "Buatkan contoh chunk",
    ]);
  });

  it("menolak balasan tanpa array dan membatasi jumlah", () => {
    expect(bersihkanSaran("maaf saya tidak bisa")).toEqual([]);
    const banyak = bersihkanSaran(
      JSON.stringify(["satu pertanyaan", "dua pertanyaan", "tiga pertanyaan", "empat pertanyaan"]),
    );
    expect(banyak.length).toBe(MAKS_SARAN);
  });

  it("membuang butir pendek dan duplikat", () => {
    expect(bersihkanSaran('["ok", "Jelaskan memori otomatis", "Jelaskan memori otomatis"]')).toEqual([
      "Jelaskan memori otomatis",
    ]);
  });
});

describe("parseMarkdown", () => {
  it("merender tebal dan miring jadi potongan, bukan bintang mentah", () => {
    expect(sebaris("**JK.jpg** dan *sayang*")).toEqual([
      { jenis: "tebal", isi: "JK.jpg" },
      { jenis: "teks", isi: " dan " },
      { jenis: "miring", isi: "sayang" },
    ]);
  });

  it("memisahkan blok kode, daftar, judul, dan paragraf", () => {
    const blok = parseMarkdown("## Judul\n\n- satu\n- dua\n\n```ts\nconst a = 1;\n```");
    expect(blok.map((b) => b.jenis)).toEqual(["judul", "daftar", "kode"]);
    const kode = blok[2];
    expect(kode?.jenis === "kode" && kode.bahasa).toBe("ts");
  });

  it("menolak tautan berbahaya", () => {
    const hasil = sebaris("[klik](javascript:alert(1))");
    expect(hasil.some((p) => p.jenis === "tautan")).toBe(false);
  });
});