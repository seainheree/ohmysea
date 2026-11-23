import { describe, expect, it } from "vitest";

import { kataKunciKhas, pilihPotongan, urutkanHibrida, type RetrievedChunk } from "./retrieve";

const opsi = { k: 5, minScore: 0.3, maksPerDokumen: 3 };

function chunk(documentId: string, score: number): RetrievedChunk {
  return { documentId, title: documentId, content: documentId, score };
}

describe("pilihPotongan", () => {
  it("lampiran tetap dipakai walau skornya di bawah ambang", () => {
    const hasil = pilihPotongan([chunk("lamp", 0.05)], [], opsi);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].documentId).toBe("lamp");
  });

  it("dokumen global di bawah ambang dibuang", () => {
    const hasil = pilihPotongan([], [chunk("global", 0.2), chunk("global2", 0.5)], opsi);
    expect(hasil.map((c) => c.documentId)).toEqual(["global2"]);
  });

  it("lampiran didahulukan atas global", () => {
    const hasil = pilihPotongan([chunk("lamp", 0.1)], [chunk("global", 0.9)], opsi);
    expect(hasil.map((c) => c.documentId)).toEqual(["lamp", "global"]);
  });

  it("maks 3 potongan per dokumen", () => {
    const lampiran = Array.from({ length: 5 }, () => chunk("lamp", 0.1));
    const hasil = pilihPotongan(lampiran, [], opsi);
    expect(hasil.filter((c) => c.documentId === "lamp")).toHaveLength(3);
  });

  it("total tidak melebihi k", () => {
    const global = Array.from({ length: 10 }, (_, i) => chunk(`g${i}`, 0.9));
    const hasil = pilihPotongan([], global, opsi);
    expect(hasil).toHaveLength(5);
  });
});

describe("kataKunciKhas (pencarian hibrida)", () => {
  it("hanya mengambil istilah khas: angka, garis bawah, tanda hubung, atau HURUF BESAR", () => {
    expect(kataKunciKhas("FR-19 ruang main")).toEqual(["fr-19"]);
    expect(kataKunciKhas("GROQ_MODEL_CHAT dan 0.30")).toEqual(["groq_model_chat", "0.30"]);
  });

  it("mengabaikan kata biasa dan tanda baca", () => {
    expect(kataKunciKhas("kopi & ataupun 'atau'")).toEqual([]);
  });
});

describe("urutkanHibrida", () => {
  function isi(content: string, score: number): RetrievedChunk {
    return { documentId: content, title: content, content, score };
  }

  it("tanpa istilah khas urutannya sama dengan cosine", () => {
    const rows = [isi("tinggi", 0.9), isi("rendah", 0.5)];
    expect(urutkanHibrida(rows, "kopi enak").map((r) => r.content)).toEqual(["tinggi", "rendah"]);
  });

  it("menaikkan potongan yang memuat istilah khas walau cosine-nya sedikit lebih rendah", () => {
    const rows = [isi("menyebut 0.30 di sini", 0.30), isi("mirip makna saja", 0.35)];
    expect(urutkanHibrida(rows, "ambang 0.30").map((r) => r.content)).toEqual([
      "menyebut 0.30 di sini",
      "mirip makna saja",
    ]);
  });

  it("tidak menyentuh skor yang dikembalikan", () => {
    const rows = [isi("FR-19", 0.4)];
    expect(urutkanHibrida(rows, "FR-19")[0].score).toBe(0.4);
  });
});
