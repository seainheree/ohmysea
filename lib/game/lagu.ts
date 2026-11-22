/**
 * Lagu mode game — chiptune prosedural lewat Web Audio, bukan file audio.
 * Alasannya: tidak perlu aset biner, tidak perlu dependency, dan bisa dimatikan
 * total tanpa sisa. Nada & pola bisa diganti tanpa menyentuh komponen.
 *
 * Fungsi penjadwal memakai pola "lookahead": beberapa loop dijadwalkan lebih
 * dulu, lalu diisi ulang berkala. Ini menghindari celah/tersendat yang muncul
 * kalau tiap loop dijadwalkan lewat `setInterval` biasa.
 */

const SEMITON: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

/** "A4" → 440 Hz. Nada tak dikenal = error, biar salah tulis ketahuan saat uji. */
export function nadaKeFrekuensi(nama: string): number {
  const cocok = /^([A-G]#?)(\d)$/.exec(nama);
  if (!cocok) throw new Error(`Nada tidak dikenal: ${nama}`);
  const midi = SEMITON[cocok[1]] + (Number(cocok[2]) + 1) * 12;
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Satu ketukan = satu not 1/8. 0,145 dtk ≈ 103 BPM, terasa ceria. */
export const LANGKAH = 0.145;

export type NadaAtauJeda = string | "-";

/** Melodi utama (kotak). "-" = jeda. 32 ketukan ≈ 4,6 dtk per loop. */
export const MELODI: NadaAtauJeda[] = [
  "C5", "E5", "G5", "-", "C5", "E5", "G5", "A5",
  "G5", "-", "E5", "G5", "C5", "-", "D5", "E5",
  "F5", "A5", "C6", "-", "A5", "G5", "F5", "E5",
  "D5", "-", "E5", "F5", "G5", "-", "-", "-",
];

/** Bass (segitiga) — menandai akor supaya tidak monoton. */
export const BASS: NadaAtauJeda[] = [
  "C3", "-", "G3", "-", "C3", "-", "G3", "-",
  "C3", "-", "E3", "-", "G3", "-", "B3", "-",
  "F3", "-", "C4", "-", "F3", "-", "A3", "-",
  "G3", "-", "D4", "-", "G3", "-", "B3", "-",
];

export type Lagu = { mulai: () => void; berhenti: () => void };

/** Buat pemutar lagu. `mulai()` wajib dipanggil dari aksi pengguna (klik). */
export function buatLagu(): Lagu {
  let ctx: AudioContext | null = null;
  let keluaran: GainNode | null = null;
  let penjadwal: number | null = null;
  let berikutnya = 0;

  const PANJANG = MELODI.length * LANGKAH;

  function bunyi(ketika: number, frek: number, durasi: number, jenis: OscillatorType, volume: number) {
    if (!ctx || !keluaran) return;
    const osc = ctx.createOscillator();
    const amplop = ctx.createGain();
    osc.type = jenis;
    osc.frequency.value = frek;
    // Amplop pendek: ketukan chiptune tajam, tidak berdengung.
    amplop.gain.setValueAtTime(0.0001, ketika);
    amplop.gain.linearRampToValueAtTime(volume, ketika + 0.012);
    amplop.gain.exponentialRampToValueAtTime(0.0001, ketika + durasi);
    osc.connect(amplop).connect(keluaran);
    osc.start(ketika);
    osc.stop(ketika + durasi + 0.02);
  }

  function putarLoop(mulai: number) {
    MELODI.forEach((n, i) => {
      if (n !== "-") bunyi(mulai + i * LANGKAH, nadaKeFrekuensi(n), LANGKAH * 0.85, "square", 0.03);
    });
    BASS.forEach((n, i) => {
      if (n !== "-") bunyi(mulai + i * LANGKAH, nadaKeFrekuensi(n), LANGKAH * 1.7, "triangle", 0.045);
    });
  }

  function isiJadwal() {
    if (!ctx) return;
    const batas = ctx.currentTime + 1.5;
    while (berikutnya < batas) {
      putarLoop(berikutnya);
      berikutnya += PANJANG;
    }
  }

  function mulai() {
    if (typeof window === "undefined") return;
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      keluaran = ctx.createGain();
      keluaran.gain.value = 0.9;
      keluaran.connect(ctx.destination);
    }
    void ctx.resume();
    if (penjadwal !== null) return;
    berikutnya = ctx.currentTime + 0.08;
    isiJadwal();
    penjadwal = window.setInterval(isiJadwal, 700);
  }

  function berhenti() {
    if (penjadwal !== null) {
      window.clearInterval(penjadwal);
      penjadwal = null;
    }
    keluaran?.disconnect();
    keluaran = null;
    void ctx?.close();
    ctx = null;
  }

  return { mulai, berhenti };
}
