import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";

/** Baris status di bawah papan — satu tempat supaya semua game seragam. */
export function Status({ children }: { children: ReactNode }) {
  return (
    <p aria-live="polite" className="min-h-5 text-center text-[13px] text-teks-muted">
      {children}
    </p>
  );
}

/** Papan skor kamu / Kirby / seri. */
export function Skor({
  kamu,
  kirby,
  seri,
}: {
  kamu: number;
  kirby: number;
  seri: number;
}) {
  const isi: [string, number][] = [
    ["Kamu", kamu],
    ["Kirby", kirby],
    ["Seri", seri],
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {isi.map(([label, nilai]) => (
        <div
          key={label}
          className="rounded-sedang border border-border bg-surface px-2 py-1.5 text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.08em] text-teks-muted-2">{label}</p>
          <p className="text-lg leading-tight tabular-nums">{nilai}</p>
        </div>
      ))}
    </div>
  );
}

/** Tingkat kesulitan Kirby. */
export function Tingkat({
  sulit,
  onUbah,
}: {
  sulit: boolean;
  onUbah: (sulit: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-penuh border border-border p-0.5 text-[11px]">
      {[
        { nilai: false, label: "Mudah" },
        { nilai: true, label: "Sulit" },
      ].map(({ nilai, label }) => (
        <button
          key={label}
          onClick={() => onUbah(nilai)}
          aria-pressed={sulit === nilai}
          className={`rounded-penuh px-3 py-1 transition-colors ${
            sulit === nilai ? "bg-aksen text-white" : "text-teks-muted hover:text-teks"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Tombol mulai ulang papan. */
export function Ulang({ onKlik }: { onKlik: () => void }) {
  return (
    <button
      onClick={onKlik}
      className="inline-flex items-center gap-1.5 rounded-penuh border border-border-kuat px-3 py-1.5 text-[12px] text-teks-muted transition-colors hover:border-aksen hover:text-teks"
    >
      <Icon name="ulang" size={13} /> Mulai ulang
    </button>
  );
}
