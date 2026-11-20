import { strFromU8, unzipSync } from "fflate";

/**
 * Ekstraksi teks dari format OOXML (docx, pptx, xlsx).
 *
 * Ketiga format itu arsip zip berisi XML, jadi tidak perlu pustaka per format:
 * satu pembaca zip (fflate) + pengurai XML minimal sudah cukup. Ini menjaga
 * bundle tetap kecil karena semuanya jalan di browser.
 *
 * shortcut: pengurai ini mengambil teks datar, bukan struktur. Urutan baca tabel
 * dipertahankan per baris, tapi penggabungan sel dan gaya tidak direkonstruksi.
 * Kalau nanti butuh struktur tabel utuh, ganti dengan parser per format.
 */

export type OoxmlKind = "docx" | "pptx" | "xlsx";

const ENTITAS: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function uraiEntitas(teks: string): string {
  return teks.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (utuh, isi: string) => {
    if (isi.startsWith("#x") || isi.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(isi.slice(2), 16));
    }
    if (isi.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(isi.slice(1), 10));
    }
    return ENTITAS[isi] ?? utuh;
  });
}

/** Buang tag XML, sisakan teks, rapikan spasi berlebih per baris. */
function teksDariXml(xml: string, pemisahBaris: RegExp): string {
  const berbaris = xml.replace(pemisahBaris, "\n");
  const tanpaTag = berbaris.replace(/<[^>]*>/g, "");
  return uraiEntitas(tanpaTag)
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function urutkanSlide(nama: string): number {
  const cocok = nama.match(/slide(\d+)\.xml$/);
  return cocok ? Number(cocok[1]) : 0;
}

function urutkanSheet(nama: string): number {
  const cocok = nama.match(/sheet(\d+)\.xml$/);
  return cocok ? Number(cocok[1]) : 0;
}

function ambilDocx(berkas: Record<string, Uint8Array>): string {
  const utama = berkas["word/document.xml"];
  if (!utama) throw new Error("DOCX tidak memuat word/document.xml");
  const isi = teksDariXml(strFromU8(utama), /<\/w:p>/g);
  const catatan = berkas["word/footnotes.xml"]
    ? teksDariXml(strFromU8(berkas["word/footnotes.xml"]), /<\/w:p>/g)
    : "";
  return catatan ? `${isi}\n\nCatatan kaki:\n${catatan}` : isi;
}

function ambilPptx(berkas: Record<string, Uint8Array>): string {
  const slide = Object.keys(berkas)
    .filter((nama) => /^ppt\/slides\/slide\d+\.xml$/.test(nama))
    .sort((a, b) => urutkanSlide(a) - urutkanSlide(b));

  if (slide.length === 0) throw new Error("PPTX tidak memuat slide");

  return slide
    .map((nama, i) => {
      const isi = teksDariXml(strFromU8(berkas[nama]), /<\/a:p>/g);
      return isi ? `[Slide ${i + 1}]\n${isi}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Ambil daftar string bersama (sharedStrings.xml) untuk sel bertipe teks. */
function ambilSharedStrings(berkas: Record<string, Uint8Array>): string[] {
  const xml = berkas["xl/sharedStrings.xml"];
  if (!xml) return [];
  const teks = strFromU8(xml);
  const hasil: string[] = [];
  // Tiap <si> bisa memuat beberapa <t> (rich text); digabung jadi satu sel.
  for (const blok of teks.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const potongan = [...blok[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]);
    hasil.push(uraiEntitas(potongan.join("")).trim());
  }
  return hasil;
}

function ambilXlsx(berkas: Record<string, Uint8Array>): string {
  const shared = ambilSharedStrings(berkas);
  const sheet = Object.keys(berkas)
    .filter((nama) => /^xl\/worksheets\/sheet\d+\.xml$/.test(nama))
    .sort((a, b) => urutkanSheet(a) - urutkanSheet(b));

  if (sheet.length === 0) throw new Error("XLSX tidak memuat worksheet");

  const bagian: string[] = [];
  for (const nama of sheet) {
    const xml = strFromU8(berkas[nama]);
    const baris: string[] = [];

    for (const blokBaris of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const sel: string[] = [];
      for (const blokSel of blokBaris[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
        const atribut = blokSel[1];
        const isi = blokSel[2];
        const tipe = /t="([^"]+)"/.exec(atribut)?.[1];

        let nilai = "";
        if (tipe === "inlineStr") {
          nilai = [...isi.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join("");
        } else {
          const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(isi)?.[1] ?? "";
          nilai = tipe === "s" ? (shared[Number(v)] ?? "") : v;
        }
        sel.push(uraiEntitas(nilai).replace(/[\t\n]+/g, " ").trim());
      }
      if (sel.some((s) => s.length > 0)) baris.push(sel.join("\t"));
    }

    if (baris.length > 0) bagian.push(`[${nama.split("/").pop()}]\n${baris.join("\n")}`);
  }

  return bagian.join("\n\n");
}

/** Ekstrak teks dari buffer docx/pptx/xlsx. Melempar galat bila arsip rusak. */
export function extractOoxml(bytes: Uint8Array, kind: OoxmlKind): string {
  let berkas: Record<string, Uint8Array>;
  try {
    berkas = unzipSync(bytes);
  } catch {
    throw new Error("Berkas rusak atau bukan arsip OOXML yang sah");
  }

  const teks =
    kind === "docx" ? ambilDocx(berkas) : kind === "pptx" ? ambilPptx(berkas) : ambilXlsx(berkas);

  if (!teks.trim()) throw new Error("Tidak ada teks yang bisa diambil dari berkas ini");
  return teks;
}