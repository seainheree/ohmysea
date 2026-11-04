/** Ikon garis SVG — pengganti emoji supaya tampilan konsisten di semua perangkat. */
type Props = { name: NamaIkon; className?: string; size?: number };

export type NamaIkon =
  | "menu"
  | "tutup"
  | "tambah"
  | "cari"
  | "hapus"
  | "ubah"
  | "centang"
  | "chat"
  | "curhat"
  | "gambar"
  | "pengaturan"
  | "kirim"
  | "berkas";

const JALUR: Record<NamaIkon, string> = {
  menu: "M4 7h16M4 12h16M4 17h16",
  tutup: "M6 6l12 12M18 6L6 18",
  tambah: "M12 5v14M5 12h14",
  cari: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  hapus: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6",
  ubah: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM14 6l4 4",
  centang: "M4 12.5l5 5L20 6.5",
  chat: "M21 12a8 8 0 0 1-8 8H8l-4 3v-6.5A8 8 0 0 1 12 4h1a8 8 0 0 1 8 8z",
  curhat: "M12 20s-7-4.4-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.6 12 20 12 20z",
  gambar: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M9 9.5a1 1 0 1 0 0-.01",
  pengaturan:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a7.9 7.9 0 0 0 .1-1.2 7.9 7.9 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a8 8 0 0 0-2-1.2L14.6 4h-3.9l-.4 2.4a8 8 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.9 7.9 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 2 1.2l.4 2.4h3.9l.4-2.4a8 8 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6z",
  kirim: "M12 19V5M12 5l-6 6M12 5l6 6",
  berkas: "M6 3h8l4 4v14H6zM14 3v5h5",
};

export function Icon({ name, className = "", size = 18 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={JALUR[name]}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
