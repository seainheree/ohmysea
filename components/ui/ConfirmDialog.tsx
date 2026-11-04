"use client";

import { useEffect, useRef } from "react";

/**
 * Dialog konfirmasi sendiri — menggantikan window.confirm yang tidak bisa
 * digayakan, tidak responsif, dan memblokir di beberapa browser mobile.
 */
export function ConfirmDialog({
  terbuka,
  judul,
  deskripsi,
  labelKonfirmasi = "Hapus",
  bahaya = true,
  onKonfirmasi,
  onBatal,
}: {
  terbuka: boolean;
  judul: string;
  deskripsi?: string;
  labelKonfirmasi?: string;
  bahaya?: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
}) {
  const tombolBatal = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!terbuka) return;
    tombolBatal.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBatal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terbuka, onBatal]);

  if (!terbuka) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={judul}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-sedang"
    >
      <div className="w-full max-w-[420px] rounded-besar border border-border-kuat bg-surface p-besar shadow-xl">
        <h2 className="text-base font-semibold">{judul}</h2>
        {deskripsi && <p className="mt-2 text-sm text-teks-muted">{deskripsi}</p>}
        <div className="mt-besar flex justify-end gap-2">
          <button
            ref={tombolBatal}
            onClick={onBatal}
            className="rounded-penuh border border-border-kuat px-sedang py-2 text-sm text-teks-muted hover:text-teks"
          >
            Batal
          </button>
          <button
            onClick={onKonfirmasi}
            className={`rounded-penuh px-sedang py-2 text-sm font-medium text-white ${
              bahaya ? "bg-danger/90 hover:bg-danger" : "bg-aksen hover:bg-aksen-terang"
            }`}
          >
            {labelKonfirmasi}
          </button>
        </div>
      </div>
    </div>
  );
}
