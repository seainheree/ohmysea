/**
 * Avatar Kirby dari lembar sprite `public/image/expressions/`. Satu berkas
 * 1200×896 berisi grid 4×3 (12 ekspresi); tiap ekspresi dipotong lewat
 * `background-position`, bukan 12 file terpisah.
 */

export type EkspresiKirby =
  | "tenang"
  | "senang"
  | "pikir"
  | "nyaman"
  | "kaget"
  | "bingung"
  | "malu"
  | "sedih"
  | "tertawa"
  | "fokus"
  | "lesu"
  | "sapaan";

const SPRITE = "/image/expressions/Gemini_Generated_Image_1hptz91hptz91hpt.png";
const KOLOM = 4;
const BARIS = 3;

/** (baris, kolom) tiap ekspresi pada lembar sprite — urut kiri→kanan, atas→bawah. */
const PETAK: Record<EkspresiKirby, [number, number]> = {
  tenang: [0, 0],
  senang: [0, 1],
  pikir: [0, 2],
  nyaman: [0, 3],
  kaget: [1, 0],
  bingung: [1, 1],
  malu: [1, 2],
  sedih: [1, 3],
  tertawa: [2, 0],
  fokus: [2, 1],
  lesu: [2, 2],
  sapaan: [2, 3],
};

export function Kirby({
  ekspresi = "tenang",
  size = 36,
  className = "",
}: {
  ekspresi?: EkspresiKirby;
  size?: number;
  className?: string;
}) {
  const [baris, kolom] = PETAK[ekspresi];
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url("${SPRITE}")`,
        backgroundSize: `${size * KOLOM}px ${size * BARIS}px`,
        backgroundPosition: `${-kolom * size}px ${-baris * size}px`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}