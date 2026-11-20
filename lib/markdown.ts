/**
 * Markdown minimal untuk balasan model: tebal, miring, kode, tautan, judul,
 * daftar, kutipan, garis, blok kode. Cukup untuk gaya jawaban Kirby.
 *
 * Sengaja tanpa pustaka: keluaran berupa struktur (bukan HTML string), jadi
 * tidak ada jalur innerHTML dan tidak ada risiko injeksi dari isi jawaban.
 * Tabel belum didukung — baris ber-pipa tampil sebagai teks biasa.
 */

export type Sebaris =
  | { jenis: "teks" | "tebal" | "miring" | "kode"; isi: string }
  | { jenis: "tautan"; isi: string; href: string };

export type Blok =
  | { jenis: "paragraf"; baris: Sebaris[][] }
  | { jenis: "judul"; tingkat: number; isi: Sebaris[] }
  | { jenis: "daftar"; terurut: boolean; butir: Sebaris[][] }
  | { jenis: "kode"; bahasa: string; isi: string }
  | { jenis: "kutipan"; baris: Sebaris[][] }
  | { jenis: "garis" };

const SEBARIS =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)|(\[[^\]\n]+\]\([^)\s]+\))/g;

function hrefAman(href: string): string | null {
  return /^(https?:\/\/|\/|#)/i.test(href) ? href : null;
}

/** Pecah satu baris jadi potongan teks/tebal/miring/kode/tautan. */
export function sebaris(teks: string): Sebaris[] {
  const hasil: Sebaris[] = [];
  let sisa = 0;
  SEBARIS.lastIndex = 0;
  for (let m = SEBARIS.exec(teks); m; m = SEBARIS.exec(teks)) {
    if (m.index > sisa) hasil.push({ jenis: "teks", isi: teks.slice(sisa, m.index) });
    const potong = m[0];
    if (m[1]) hasil.push({ jenis: "kode", isi: potong.slice(1, -1) });
    else if (m[2]) hasil.push({ jenis: "tebal", isi: potong.slice(2, -2) });
    else if (m[3]) hasil.push({ jenis: "tebal", isi: potong.slice(2, -2) });
    else if (m[4]) hasil.push({ jenis: "miring", isi: potong.slice(1, -1) });
    else if (m[5]) hasil.push({ jenis: "miring", isi: potong.slice(1, -1) });
    else {
      const cocok = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(potong);
      const href = cocok ? hrefAman(cocok[2]) : null;
      if (cocok && href) hasil.push({ jenis: "tautan", isi: cocok[1], href });
      else hasil.push({ jenis: "teks", isi: potong });
    }
    sisa = m.index + potong.length;
  }
  if (sisa < teks.length) hasil.push({ jenis: "teks", isi: teks.slice(sisa) });
  return hasil;
}

export function parseMarkdown(sumber: string): Blok[] {
  const baris = sumber.replace(/\r\n?/g, "\n").split("\n");
  const blok: Blok[] = [];
  let i = 0;

  const mulaiBlokBaru = (b: string) =>
    /^\s*(```|#{1,6}\s|>|[-*+]\s|\d+[.)]\s)/.test(b) || /^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(b);

  while (i < baris.length) {
    const b = baris[i] ?? "";

    if (!b.trim()) {
      i += 1;
      continue;
    }

    const pagar = /^\s*```(\S*)\s*$/.exec(b);
    if (pagar) {
      const isi: string[] = [];
      i += 1;
      while (i < baris.length && !/^\s*```\s*$/.test(baris[i] ?? "")) {
        isi.push(baris[i] ?? "");
        i += 1;
      }
      i += 1;
      blok.push({ jenis: "kode", bahasa: pagar[1] ?? "", isi: isi.join("\n") });
      continue;
    }

    const judul = /^(#{1,6})\s+(.*)$/.exec(b);
    if (judul) {
      blok.push({ jenis: "judul", tingkat: judul[1]!.length, isi: sebaris(judul[2]!.trim()) });
      i += 1;
      continue;
    }

    if (/^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(b)) {
      blok.push({ jenis: "garis" });
      i += 1;
      continue;
    }

    if (/^\s*>/.test(b)) {
      const isi: Sebaris[][] = [];
      while (i < baris.length && /^\s*>/.test(baris[i] ?? "")) {
        isi.push(sebaris((baris[i] ?? "").replace(/^\s*>\s?/, "")));
        i += 1;
      }
      blok.push({ jenis: "kutipan", baris: isi });
      continue;
    }

    const butir = /^\s*([-*+]|\d+[.)])\s+(.*)$/.exec(b);
    if (butir) {
      const terurut = /\d/.test(butir[1]!);
      const isi: Sebaris[][] = [];
      while (i < baris.length) {
        const cocok = /^\s*([-*+]|\d+[.)])\s+(.*)$/.exec(baris[i] ?? "");
        if (!cocok || /\d/.test(cocok[1]!) !== terurut) break;
        isi.push(sebaris(cocok[2]!));
        i += 1;
      }
      blok.push({ jenis: "daftar", terurut, butir: isi });
      continue;
    }

    const isi: Sebaris[][] = [];
    while (i < baris.length) {
      const kini = baris[i] ?? "";
      if (!kini.trim() || (isi.length > 0 && mulaiBlokBaru(kini))) break;
      isi.push(sebaris(kini));
      i += 1;
    }
    blok.push({ jenis: "paragraf", baris: isi });
  }

  return blok;
}