/** Utilitas teks ringan yang aman dipakai di komponen klien (tanpa impor server). */

/**
 * Ambil panggilan pengguna dari daftar memori (mis. "panggil aku Sha") untuk
 * sapaan awal di halaman chat.
 */
export function tebakPanggilanPengguna(
  daftar: { content: string; aktif?: boolean }[],
): string | null {
  const pola =
    /(?:panggil(?:an)?\s+aku|panggilanku|namaku|nama\s+aku)\s*(?:adalah\s+|itu\s+|[:=]\s*)?([A-Za-z][A-Za-z'-]{0,20})/i;
  for (const m of daftar) {
    if (m.aktif === false) continue;
    const cocok = pola.exec(m.content ?? "");
    const nama = cocok?.[1]?.replace(/[.'-]+$/, "");
    if (nama) return nama;
  }
  return null;
}
