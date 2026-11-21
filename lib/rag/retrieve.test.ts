import { describe, expect, it } from "vitest";

import { pilihPotongan, type RetrievedChunk } from "./retrieve";

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
