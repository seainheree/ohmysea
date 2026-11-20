import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { extractOoxml } from "./ooxml";

/** Bangun arsip OOXML minimal langsung dari string — tanpa fixture biner di repo. */
function arsip(berkas: Record<string, string>): Uint8Array {
  return zipSync(
    Object.fromEntries(Object.entries(berkas).map(([nama, isi]) => [nama, strToU8(isi)])),
  );
}

const DOCX = arsip({
  "word/document.xml": `<?xml version="1.0"?>
<w:document><w:body>
  <w:p><w:r><w:t>Laporan kuartal tiga</w:t></w:r></w:p>
  <w:p><w:r><w:t>Omzet naik 12% &amp; kategori sembako turun 6%.</w:t></w:r></w:p>
  <w:tbl>
    <w:tr><w:tc><w:p><w:r><w:t>Bulan</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Omzet</w:t></w:r></w:p></w:tc></w:tr>
    <w:tr><w:tc><w:p><w:r><w:t>Juli</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>120</w:t></w:r></w:p></w:tc></w:tr>
  </w:tbl>
</w:body></w:document>`,
});

const PPTX = arsip({
  "ppt/slides/slide1.xml": `<p:sld><a:p><a:r><a:t>Rencana otomasi</a:t></a:r></a:p></p:sld>`,
  "ppt/slides/slide2.xml": `<p:sld><a:p><a:r><a:t>Langkah pertama</a:t></a:r></a:p></p:sld>`,
});

const XLSX = arsip({
  "xl/sharedStrings.xml": `<sst><si><t>Bulan</t></si><si><t>Omzet</t></si><si><t>Juli</t></si></sst>`,
  "xl/worksheets/sheet1.xml": `<worksheet><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
    <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>120</v></c></row>
  </sheetData></worksheet>`,
});

describe("extractOoxml", () => {
  it("mengambil paragraf dan isi tabel dari docx", () => {
    const teks = extractOoxml(DOCX, "docx");
    expect(teks).toContain("Laporan kuartal tiga");
    expect(teks).toContain("Omzet naik 12% & kategori sembako turun 6%.");
    expect(teks).toContain("Bulan");
    expect(teks).toContain("Juli");
    // Paragraf tetap terpisah baris, bukan menempel jadi satu.
    expect(teks.split("\n").length).toBeGreaterThan(2);
  });

  it("mengambil semua slide pptx berurutan", () => {
    const teks = extractOoxml(PPTX, "pptx");
    expect(teks).toContain("[Slide 1]");
    expect(teks).toContain("Rencana otomasi");
    expect(teks).toContain("[Slide 2]");
    expect(teks).toContain("Langkah pertama");
    expect(teks.indexOf("Rencana otomasi")).toBeLessThan(teks.indexOf("Langkah pertama"));
  });

  it("menggabungkan shared strings dan nilai angka pada xlsx", () => {
    const teks = extractOoxml(XLSX, "xlsx");
    expect(teks).toContain("Bulan\tOmzet");
    expect(teks).toContain("Juli\t120");
  });

  it("melempar galat untuk arsip rusak, bukan diam-diam kosong", () => {
    expect(() => extractOoxml(new Uint8Array([1, 2, 3, 4]), "docx")).toThrow(/rusak|OOXML/);
  });

  it("melempar galat bila arsip sah tapi tidak memuat dokumen", () => {
    const kosong = arsip({ "word/theme/theme1.xml": "<x/>" });
    expect(() => extractOoxml(kosong, "docx")).toThrow(/document\.xml/);
  });
});