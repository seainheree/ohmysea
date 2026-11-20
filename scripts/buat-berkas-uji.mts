/**
 * Buat berkas uji untuk fitur lampiran: PDF (tulisan tangan, tanpa pustaka),
 * DOCX dan XLSX (OOXML minimal via fflate).
 *
 * Jalankan: npx tsx scripts/buat-berkas-uji.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { strToU8, zipSync } from "fflate";

const DIR = process.env.UJI_DIR ?? "C:/Users/ItzFebryHcx/AppData/Local/hermes/cache/scratch/lampiran-uji";
mkdirSync(DIR, { recursive: true });

/** PDF 1 halaman dengan lapisan teks sungguhan (supaya pdfjs bisa mengekstrak). */
function pdfSatuHalaman(baris: string[]): Uint8Array {
  const isi = ["BT", "/F1 12 Tf", "14 TL", "72 760 Td", ...baris.map((b) => `(${b}) Tj T*`), "ET"].join("\n");
  const objek = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${isi.length} >>\nstream\n${isi}\nendstream`,
  ];

  let hasil = "%PDF-1.4\n";
  const offset: number[] = [];
  objek.forEach((o, i) => {
    offset.push(hasil.length);
    hasil += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = hasil.length;
  hasil += `xref\n0 ${objek.length + 1}\n0000000000 65535 f \n`;
  for (const o of offset) hasil += `${String(o).padStart(10, "0")} 00000 n \n`;
  hasil += `trailer\n<< /Size ${objek.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(hasil);
}

function zip(berkas: Record<string, string>): Uint8Array {
  return zipSync(Object.fromEntries(Object.entries(berkas).map(([n, i]) => [n, strToU8(i)])));
}

writeFileSync(join(DIR, "catatan.md"), [
  "# Catatan gudang",
  "",
  "Kata sandi gudang: MERAH-42.",
  "Kontak penanggung jawab: Bu Sari, nomor 0812-3456-7890.",
].join("\n"));

writeFileSync(join(DIR, "laporan.pdf"), pdfSatuHalaman([
  "Laporan Kuartal Tiga",
  "Omzet naik 12 persen dibanding kuartal sebelumnya.",
  "Kategori sembako turun 6 persen karena dua pembelian besar belum tercatat.",
  "Kode proyek: NUSANTARA-77.",
]));

writeFileSync(join(DIR, "data.docx"), zip({
  "[Content_Types].xml": `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  "word/document.xml": `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
    <w:p><w:r><w:t>Daftar vendor</w:t></w:r></w:p>
    <w:p><w:r><w:t>Vendor utama: PT Sinar Jaya Abadi, kontrak sampai Desember.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Vendor cadangan: CV Mitra Laut.</w:t></w:r></w:p>
  </w:body></w:document>`,
}));

writeFileSync(join(DIR, "angka.xlsx"), zip({
  "[Content_Types].xml": `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>`,
  "xl/sharedStrings.xml": `<sst><si><t>Bulan</t></si><si><t>Omzet</t></si><si><t>Juli</t></si><si><t>Agustus</t></si></si></sst>`.replace("</si></si></sst>", "</si></sst>"),
  "xl/worksheets/sheet1.xml": `<worksheet><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
    <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>120</v></c></row>
    <row r="3"><c r="A3" t="s"><v>3</v></c><c r="B3"><v>135</v></c></row>
  </sheetData></worksheet>`,
}));

console.log("berkas uji dibuat di:", DIR);
for (const nama of ["catatan.md", "laporan.pdf", "data.docx", "angka.xlsx"]) {
  console.log(" -", nama);
}