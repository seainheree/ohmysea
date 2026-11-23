import { describe, expect, it } from "vitest";

import { teksUntukSuara } from "./suara";

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
});