import { describe, expect, it } from "vitest";

import { tebakPanggilanPengguna } from "./panggilan";

describe("tebakPanggilanPengguna (untuk sapaan awal)", () => {
  it("membaca panggilan dari memori", () => {
    expect(tebakPanggilanPengguna([{ content: "Panggil aku Sha." }])).toBe("Sha");
    expect(tebakPanggilanPengguna([{ content: "namaku Sasha" }])).toBe("Sasha");
    expect(tebakPanggilanPengguna([{ content: "Panggilan aku: Beb" }])).toBe("Beb");
  });

  it("mengabaikan memori yang dimatikan", () => {
    expect(tebakPanggilanPengguna([{ content: "panggil aku Sha", aktif: false }])).toBeNull();
  });

  it("tanpa memori yang relevan mengembalikan null", () => {
    expect(tebakPanggilanPengguna([])).toBeNull();
    expect(tebakPanggilanPengguna([{ content: "aku suka kopi hitam" }])).toBeNull();
  });
});
