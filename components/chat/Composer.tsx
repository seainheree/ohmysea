"use client";

import { useRef, useState } from "react";

export function Composer({
  onKirim,
  sibuk,
  mode,
  onLampirkan,
  lampiran,
  sibukLampiran,
  onHapusLampiran,
}: {
  onKirim: (teks: string) => void;
  sibuk: boolean;
  mode: "chat" | "curhat";
  onLampirkan: (berkas: File) => void;
  lampiran: { nama: string; status: string; galat?: boolean } | null;
  sibukLampiran: boolean;
  onHapusLampiran: () => void;
}) {
  const [teks, setTeks] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const berkas = useRef<HTMLInputElement>(null);

  function kirim() {
    const isi = teks.trim();
    if (!isi || sibuk) return;
    onKirim(isi);
    setTeks("");
    if (area.current) area.current.style.height = "auto";
  }

  return (
    <div className="shrink-0 border-t border-border bg-bg-topbar/95 backdrop-blur">
      <div className="mx-auto w-full max-w-[760px] px-sedang pb-aman pt-2">
        {lampiran && (
          <div
            className={`mb-2 flex items-center gap-2 rounded-besar border px-3 py-2 text-[12px] ${
              lampiran.galat ? "border-bahaya/40 text-bahaya" : "border-border text-teks"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
              <path
                d="M21.4 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l8.57-8.57A4 4 0 0118 8.84l-8.59 8.57a2 2 0 01-2.83-2.83l8.49-8.48"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="truncate font-medium">{lampiran.nama}</span>
            <span className="ml-auto shrink-0 text-teks-muted-2">{lampiran.status}</span>
            {!sibukLampiran && (
              <button
                onClick={onHapusLampiran}
                aria-label="Hapus lampiran"
                className="shrink-0 rounded-penuh px-1 text-teks-muted-2 transition-colors hover:text-teks"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-besar border border-border bg-surface p-1.5">
          <input
            ref={berkas}
            type="file"
            className="hidden"
            onChange={(e) => {
              const dipilih = e.target.files?.[0];
              if (dipilih) onLampirkan(dipilih);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => berkas.current?.click()}
            disabled={sibukLampiran}
            aria-label="Lampirkan dokumen"
            title="Lampirkan dokumen — semua jenis, maks 10 MB"
            className={`mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-penuh transition-colors ${
              sibukLampiran ? "text-teks-muted" : "text-teks-muted hover:text-aksen"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21.4 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l8.57-8.57A4 4 0 0118 8.84l-8.59 8.57a2 2 0 01-2.83-2.83l8.49-8.48"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <textarea
            ref={area}
            value={teks}
            rows={1}
            onChange={(e) => {
              setTeks(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                kirim();
              }
            }}
            placeholder={mode === "curhat" ? "Ceritakan apa yang kamu rasakan..." : "Tulis pesan..."}
            aria-label="Tulis pesan"
            className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-2.5 py-3 text-sm outline-none placeholder:text-teks-muted-2"
          />
          <button
            onClick={kirim}
            disabled={sibuk || teks.trim().length === 0}
            aria-label="Kirim pesan"
            className={`mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-penuh transition-colors ${
              sibuk || teks.trim().length === 0
                ? "bg-border text-teks-muted"
                : "bg-aksen text-white hover:bg-aksen-terang"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 19V5m0 0l-6 6m6-6l6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className="mt-2 hidden text-center text-[11px] text-teks-muted-2 sm:block">
          Enter kirim · Shift + Enter baris baru
        </p>
      </div>
    </div>
  );
}
