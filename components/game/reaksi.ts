/**
 * Reaksi Kirby saat main — pilihan ekspresi + ucapan, bukan tiap langkah.
 * Dipakai papan lewat prop `onReaksi` supaya bilah Kirby di panel tetap satu.
 */

export type Ekspresi =
  | "tenang"
  | "hitung"
  | "senang"
  | "kaget"
  | "sedih"
  | "tertawa"
  | "bingung"
  | "malu"
  | "fokus"
  | "sapaan";

export type Reaksi = { ekspresi: Ekspresi; teks: string };

export function acak<T>(isi: readonly T[]): T {
  return isi[Math.floor(Math.random() * isi.length)];
}

/** Ucapan per momen. Semua Bahasa Indonesia, singkat, nada bermain. */
export const REAKSI = {
  sambut: ["Ayo main! aku siap poyoo~", "Siap, aku jalan duluan ya?", "Pilih papannya, aku ikut."],
  hitung: ["Aku hitung dulu ya...", "Hmm, sebentar...", "Otak Kirby muter~"],
  kaget: ["Eh, itu licik!", "Wah, aku hampir kehilangan!", "Awas ya, aku lihat itu."],
  blokir: ["Hehe, aku tutup ya.", "Eits, itu aku tahan!", "Ketahuan~"],
  ancam: ["Awas, tinggal satu langkah!", "Hehe, sebentar lagi aku menang."],
  menang: ["Aku menang! poyoo~", "Haha, aku duluan!", "Yeay, aku!"],
  kalah: ["Kamu menang! aku kalah~", "Hebat, aku ngalah.", "Yeay buat kamu!"],
  seri: ["Seri! kita imbang~", "Seri, ayo sekali lagi!", "Imbang, poyoo~"],
  ingat: ["Kartu itu... aku juga ingat!", "Hmm, dua kartu itu mirip?", "Kamu jago mengingat ya."],
  beres: ["Semua ketemu! poyoo~", "Beres, kamu teliti banget!", "Yeay, papan kosong!"],
} as const;
