/**
 * Logika murni ruang main (tanpa React/DOM) supaya bisa diuji langsung.
 * Game: Tic Tac Toe (9 sel), Empat Berderet (7×6), Kartu Ingatan (16 kartu).
 */

export type Pemain = "kamu" | "kirby";

/** Lawan dari pemain yang diberi. */
export function lain(p: Pemain): Pemain {
  return p === "kirby" ? "kamu" : "kirby";
}

/** Papan generik: satu larik, `null` = kosong. */
export type Papan = (Pemain | null)[];

/** Fisher-Yates; sisipkan `acak` sendiri agar hasil bisa diuji. */
export function kocok<T>(isi: T[], acak: () => number = Math.random): T[] {
  const arr = [...isi];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function kosongDi(p: Papan): number[] {
  return p.flatMap((s, i) => (s === null ? [i] : []));
}

/* --- Tic Tac Toe -------------------------------------------------------- */

export function papanTTTKosong(): Papan {
  return Array<Pemain | null>(9).fill(null);
}

const GARIS_TTT: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** Indeks tiga sel sejajar milik pemenang, atau null. Dipakai juga untuk sorot. */
export function garisTTT(p: Papan): number[] | null {
  for (const g of GARIS_TTT) {
    const [a, b, c] = g;
    if (p[a] && p[a] === p[b] && p[a] === p[c]) return g;
  }
  return null;
}

export function penuh(p: Papan): boolean {
  return p.every((s) => s !== null);
}

/** Indeks sel kosong yang langsung memenangkan TTT untuk `pemain`. */
export function langkahMenangTTT(p: Papan, pemain: Pemain): number[] {
  return kosongDi(p).filter((i) => {
    const c = [...p];
    c[i] = pemain;
    return garisTTT(c) !== null;
  });
}

/** Minimax: nilai posisi dari sudut pandang `ai` (menang cepat > menang lambat). */
function nilaiTTT(p: Papan, giliran: Pemain, ai: Pemain, depth: number): number {
  const g = garisTTT(p);
  if (g) return p[g[0]] === ai ? 10 - depth : depth - 10;
  if (penuh(p)) return 0;

  const nilai = kosongDi(p).map((i) => {
    p[i] = giliran;
    const n = nilaiTTT(p, lain(giliran), ai, depth + 1);
    p[i] = null;
    return n;
  });
  return giliran === ai ? Math.max(...nilai) : Math.min(...nilai);
}

/**
 * Langkah TTT untuk `ai`. `sulit` = minimax penuh (tak bisa dikalahkan);
 * mudah = 55% langkah acak supaya masih bisa menang.
 */
export function langkahTTT(
  p: Papan,
  ai: Pemain,
  sulit: boolean,
  acak: () => number = Math.random,
): number | null {
  const kosong = kosongDi(p);
  if (kosong.length === 0) return null;
  if (!sulit && acak() < 0.55) return kosong[Math.floor(acak() * kosong.length)];

  const salinan = [...p];
  let terbaik = -Infinity;
  let pilihan: number[] = [];
  for (const i of kosong) {
    salinan[i] = ai;
    const n = nilaiTTT(salinan, lain(ai), ai, 1);
    salinan[i] = null;
    if (n > terbaik) {
      terbaik = n;
      pilihan = [i];
    } else if (n === terbaik) {
      pilihan.push(i);
    }
  }
  return pilihan[Math.floor(acak() * pilihan.length)];
}

/* --- Empat Berderet (Connect Four) ------------------------------------- */

export const CO_JALUR = 7;
export const CO_BARIS = 6;

/** Indeks = baris × 7 + kolom; baris 0 = paling bawah (gravitasi sederhana). */
export function sel(p: Papan, baris: number, kolom: number): Pemain | null {
  return p[baris * CO_JALUR + kolom] ?? null;
}

export function kolomBisa(p: Papan): number[] {
  return Array.from({ length: CO_JALUR }, (_, k) => k).filter(
    (k) => sel(p, CO_BARIS - 1, k) === null,
  );
}

/** Jatuhkan keping; balikan baris tempat keping berhenti, atau null kalau penuh. */
export function jatuhkan(p: Papan, kolom: number, pemain: Pemain): number | null {
  for (let b = 0; b < CO_BARIS; b++) {
    if (sel(p, b, kolom) === null) {
      p[b * CO_JALUR + kolom] = pemain;
      return b;
    }
  }
  return null;
}

/** Empat sejajar (horizontal/vertikal/diagonal); balikan indeksnya, atau null. */
export function garisCO(p: Papan): number[] | null {
  const arah: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [db, dk] of arah) {
    for (let b = 0; b < CO_BARIS; b++) {
      for (let k = 0; k < CO_JALUR; k++) {
        const warna = sel(p, b, k);
        if (!warna) continue;
        const jalur: number[] = [];
        for (let s = 0; s < 4; s++) {
          const bb = b + db * s;
          const kk = k + dk * s;
          if (bb < 0 || bb >= CO_BARIS || kk < 0 || kk >= CO_JALUR) break;
          if (sel(p, bb, kk) !== warna) break;
          jalur.push(bb * CO_JALUR + kk);
        }
        if (jalur.length === 4) return jalur;
      }
    }
  }
  return null;
}

/** Ada langkah yang langsung menang untuk `pemain`? */
export function bisaMenangCO(p: Papan, pemain: Pemain): boolean {
  return kolomBisa(p).some((k) => {
    const c = [...p];
    return jatuhkan(c, k, pemain) !== null && garisCO(c) !== null;
  });
}

/**
 * Nilai satu kolom untuk `ai`: menang (1000) > menutup ancaman lawan (800) >
 * menumpuk dekat keping sendiri & mendekati tengah.
 * ponytail: heuristik 1 lapis, bukan minimax — cukup menantang dan murah;
 * naikkan ke minimax berkedalaman kalau terasa terlalu mudah.
 */
function nilaiKolom(p: Papan, kolom: number, ai: Pemain): number {
  const salinan = [...p];
  const baris = jatuhkan(salinan, kolom, ai);
  if (baris === null) return -Infinity;
  if (garisCO(salinan)) return 1000;
  // Langkah yang membiarkan lawan menang langsung selalu lebih buruk.
  const ancaman = bisaMenangCO(salinan, lain(ai));

  let dekat = 0;
  for (let db = -1; db <= 1; db++) {
    for (let dk = -1; dk <= 1; dk++) {
      const bb = baris + db;
      const kk = kolom + dk;
      if (bb < 0 || bb >= CO_BARIS || kk < 0 || kk >= CO_JALUR) continue;
      if (sel(salinan, bb, kk) === ai) dekat++;
    }
  }
  return dekat * 2 + (CO_JALUR - Math.abs(3 - kolom)) + (ancaman ? 0 : 500);
}

export function langkahCO(
  p: Papan,
  ai: Pemain,
  sulit: boolean,
  acak: () => number = Math.random,
): number | null {
  const bisa = kolomBisa(p);
  if (bisa.length === 0) return null;
  if (!sulit && acak() < 0.4) return bisa[Math.floor(acak() * bisa.length)];

  let terbaik = -Infinity;
  let pilihan: number[] = [];
  for (const k of bisa) {
    const n = nilaiKolom(p, k, ai);
    if (n > terbaik) {
      terbaik = n;
      pilihan = [k];
    } else if (n === terbaik) {
      pilihan.push(k);
    }
  }
  return pilihan[Math.floor(acak() * pilihan.length)];
}

/* --- Kartu Ingatan ----------------------------------------------------- */

/** Delapan ikon yang dipakai (indeks dipakai sebagai nilai kartu). */
export const IKON_INGATAN = [
  "berkas",
  "gambar",
  "chat",
  "curhat",
  "pengaturan",
  "saran",
  "ulang",
  "panel",
] as const;

/** 16 kartu (8 pasang) sudah diacak; tiap nilai = indeks di `IKON_INGATAN`. */
export function dekIngatan(acak: () => number = Math.random): number[] {
  const pasangan = IKON_INGATAN.flatMap((_, i) => [i, i]);
  return kocok(pasangan, acak);
}
