import { describe, expect, it } from "vitest";

import {
  CO_JALUR,
  WAJAH_INGATAN,
  dekIngatan,
  garisCO,
  garisTTT,
  jatuhkan,
  kocok,
  kolomBisa,
  langkahCO,
  langkahMenangTTT,
  langkahTTT,
  papanTTTKosong,
  penuh,
  type Papan,
  type Pemain,
} from "./game";
import { BASS, MELODI, nadaKeFrekuensi } from "./game/lagu";

/** Pembangkit acak deterministik supaya hasil uji tidak berubah tiap jalan. */
function acakTetap(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function mainkanTTT(sulit: boolean, acak: () => number): Pemain | null {
  const p = papanTTTKosong();
  let giliran: Pemain = "kamu";
  while (!garisTTT(p) && !penuh(p)) {
    const kosong = p.flatMap((s, i) => (s === null ? [i] : []));
    let i: number | null;
    if (giliran === "kirby") {
      i = langkahTTT(p, "kirby", sulit, acak);
    } else {
      i = kosong[Math.floor(acak() * kosong.length)];
    }
    if (i === null) break;
    p[i] = giliran;
    giliran = giliran === "kamu" ? "kirby" : "kamu";
  }
  const g = garisTTT(p);
  return g ? (p[g[0]] as Pemain) : null;
}

describe("tic tac toe", () => {
  it("mengenali tiga sejajar (baris, kolom, diagonal)", () => {
    const p = papanTTTKosong();
    p[0] = p[1] = p[2] = "kamu";
    expect(garisTTT(p)).toEqual([0, 1, 2]);

    const q = papanTTTKosong();
    q[2] = q[5] = q[8] = "kirby";
    expect(garisTTT(q)).toEqual([2, 5, 8]);

    const r = papanTTTKosong();
    r[0] = r[4] = r[8] = "kamu";
    expect(garisTTT(r)).toEqual([0, 4, 8]);
  });

  it("mengembalikan langkah yang sah di papan kosong", () => {
    const i = langkahTTT(papanTTTKosong(), "kirby", true, acakTetap(7));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(9);
  });

  it("level sulit tidak pernah kalah dalam 120 permainan", { timeout: 20_000 }, () => {
    const acak = acakTetap(42);
    for (let n = 0; n < 120; n++) {
      expect(mainkanTTT(true, acak)).not.toBe("kamu");
    }
  });

  it("papan penuh terdeteksi", () => {
    const p = papanTTTKosong().map((_, i) => (i % 2 === 0 ? "kamu" : "kirby")) as Papan;
    expect(penuh(p)).toBe(true);
  });
});

describe("empat berderet", () => {
  it("keping jatuh ke dasar dulu, lalu menumpuk", () => {
    const p: Papan = Array(CO_JALUR * 6).fill(null);
    expect(jatuhkan(p, 3, "kamu")).toBe(0);
    expect(jatuhkan(p, 3, "kirby")).toBe(1);
    for (let i = 0; i < 4; i++) jatuhkan(p, 3, "kamu");
    expect(jatuhkan(p, 3, "kamu")).toBeNull();
    expect(kolomBisa(p)).not.toContain(3);
  });

  it("mengenali empat sejajar mendatar, menurun, dan menaik", () => {
    const dasar: Papan = Array(CO_JALUR * 6).fill(null);
    for (let k = 0; k < 4; k++) dasar[k] = "kamu";
    expect(garisCO(dasar)).toEqual([0, 1, 2, 3]);

    const menurun: Papan = Array(CO_JALUR * 6).fill(null);
    for (let s = 0; s < 4; s++) menurun[s * CO_JALUR + s] = "kirby";
    expect(garisCO(menurun)).toHaveLength(4);
    expect(garisCO(menurun)?.every((i) => menurun[i] === "kirby")).toBe(true);

    const menaik: Papan = Array(CO_JALUR * 6).fill(null);
    for (let s = 0; s < 4; s++) menaik[s * CO_JALUR + (3 - s)] = "kamu";
    expect(garisCO(menaik)?.every((i) => menaik[i] === "kamu")).toBe(true);
  });

  it("mengambil kemenangan langsung yang tersedia", () => {
    const p: Papan = Array(CO_JALUR * 6).fill(null);
    for (let k = 0; k < 3; k++) p[k] = "kirby";
    expect(langkahCO(p, "kirby", true, acakTetap(3))).toBe(3);
  });

  it("menutup ancaman: lawan punya tiga sejajar di dasar", () => {
    const p: Papan = Array(CO_JALUR * 6).fill(null);
    for (let k = 0; k < 3; k++) p[k] = "kamu";
    // Kirby harus memblokir di kolom 3 (atau 0/1/2 tidak menolong);
    // kolom 3-lah yang menutup jalur menang "kamu".
    expect(langkahCO(p, "kirby", true, acakTetap(5))).toBe(3);
  });

  it("tidak ada kolom tersisa di papan penuh", () => {
    const p: Papan = Array(CO_JALUR * 6).fill("kamu");
    expect(kolomBisa(p)).toEqual([]);
    expect(langkahCO(p, "kirby", true, acakTetap(1))).toBeNull();
  });
});

describe("langkah menang & saran", () => {
  it("menemukan langkah yang langsung memenangkan TTT", () => {
    const p = papanTTTKosong();
    p[0] = p[1] = "kirby";
    expect(langkahMenangTTT(p, "kirby")).toEqual([2]);
    expect(langkahMenangTTT(p, "kamu")).toEqual([]);
  });
});

describe("lagu mode game", () => {
  it("A4 = 440 Hz dan oktaf naik dua kali lipat", () => {
    expect(nadaKeFrekuensi("A4")).toBeCloseTo(440, 5);
    expect(nadaKeFrekuensi("A5")).toBeCloseTo(880, 5);
    expect(nadaKeFrekuensi("C4")).toBeCloseTo(261.63, 2);
  });

  it("menolak nada yang salah tulis", () => {
    expect(() => nadaKeFrekuensi("H4")).toThrow(/Nada tidak dikenal/);
  });

  it("semua nada di melodi & bass bisa dibaca dan panjangnya sepadan", () => {
    expect(MELODI).toHaveLength(BASS.length);
    for (const n of [...MELODI, ...BASS]) {
      if (n !== "-") expect(() => nadaKeFrekuensi(n)).not.toThrow();
    }
  });
});

describe("kartu ingatan", () => {
  it("kocok menjaga isi larik", () => {
    const asal = [1, 2, 3, 4, 5];
    expect(kocok(asal, acakTetap(9)).sort((a, b) => a - b)).toEqual(asal);
  });

  it("menghasilkan dua kartu per wajah", () => {
    const dek = dekIngatan(acakTetap(11));
    expect(dek).toHaveLength(WAJAH_INGATAN.length * 2);
    for (let i = 0; i < WAJAH_INGATAN.length; i++) {
      expect(dek.filter((v) => v === i)).toHaveLength(2);
    }
  });

  it("wajah kartu unik supaya tidak ada dua pasangan yang tampak sama", () => {
    expect(new Set(WAJAH_INGATAN).size).toBe(WAJAH_INGATAN.length);
  });
});
