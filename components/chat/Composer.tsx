"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";

/** Sama dengan batas `message` di POST /api/chat (zod). */
const MAKS_PESAN = 4000;

export function Composer({
  onKirim,
  sibuk,
  mode,
  onLampirkan,
  lampiran,
  sibukLampiran,
  onHapusLampiran,
  berkasSesi,
  pratinjau,
}: {
  onKirim: (teks: string) => void;
  sibuk: boolean;
  mode: "chat" | "curhat";
  onLampirkan: (berkas: File) => void;
  lampiran: { nama: string; status: string; galat?: boolean; documentId?: string; pratinjau?: string } | null;
  sibukLampiran: boolean;
  onHapusLampiran: () => void;
  /** Berkas yang sudah tersimpan di sesi ini — tetap dipakai turn berikutnya. */
  berkasSesi: { id: string; title: string }[];
  /** documentId → object URL gambar (pratinjau thumbnail) — hanya di klien. */
  pratinjau: Record<string, string>;
}) {
  const [teks, setTeks] = useState("");
  const [seret, setSeret] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const berkas = useRef<HTMLInputElement>(null);
  const kamera = useRef<HTMLInputElement>(null);
  const modeAwal = useRef(true);

  // Setelah ganti mode, kembalikan fokus ke kotak tulis (bukan saat muat pertama).
  useEffect(() => {
    if (modeAwal.current) {
      modeAwal.current = false;
      return;
    }
    area.current?.focus();
  }, [mode]);

  function kirim() {
    const isi = teks.trim();
    if (!isi || sibuk || sibukLampiran || isi.length > MAKS_PESAN) return;
    onKirim(isi);
    setTeks("");
    if (area.current) area.current.style.height = "auto";
  }

  const kepanjangan = teks.length > MAKS_PESAN;
  const bisaKirim = !sibuk && !sibukLampiran && !kepanjangan && teks.trim().length > 0;

  return (
    <div
      className={`relative shrink-0 border-t bg-bg-topbar/95 backdrop-blur ${
        seret ? "border-aksen" : "border-border"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!sibukLampiran) setSeret(true);
      }}
      onDragLeave={() => setSeret(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSeret(false);
        const berkasJatuh = e.dataTransfer.files?.[0];
        if (berkasJatuh && !sibukLampiran) onLampirkan(berkasJatuh);
      }}
    >
      {seret && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-t-besar border-2 border-dashed border-aksen bg-bg-main/85 text-sm font-medium text-aksen-lembut">
          Lepas berkas untuk melampirkan
        </div>
      )}
      <div className="mx-auto w-full max-w-[760px] px-sedang pb-aman pt-2">
        {berkasSesi.length > 0 && (
          <div className="mb-1.5 flex flex-wrap items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.08em] text-teks-muted-2">
              Berkas sesi
            </span>
            {berkasSesi.map((b) => (
              <span
                key={b.id}
                title={b.title}
                className="inline-flex max-w-[220px] items-center gap-1 rounded-penuh border border-border-kuat bg-bg-main px-2 py-0.5 text-[11px] text-teks-muted"
              >
                {pratinjau[b.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pratinjau[b.id]}
                    alt=""
                    className="h-4 w-4 shrink-0 rounded-kecil object-cover"
                  />
                ) : (
                  <Icon name="berkas" size={11} />
                )}
                <span className="truncate">{b.title}</span>
              </span>
            ))}
          </div>
        )}
        {lampiran && (
          <div
            className={`mb-2 flex items-center gap-2 rounded-besar border px-3 py-2 text-[12px] ${
              lampiran.galat ? "border-bahaya/40 text-bahaya" : "border-border text-teks"
            }`}
          >
            {lampiran.pratinjau ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lampiran.pratinjau}
                alt=""
                className="h-8 w-8 shrink-0 rounded-kecil border border-border object-cover"
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
                <path
                  d="M21.4 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l8.57-8.57A4 4 0 0118 8.84l-8.59 8.57a2 2 0 01-2.83-2.83l8.49-8.48"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
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
            disabled={sibukLampiran || sibuk}
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
          {/* Kamera perangkat: atribut capture membuka kamera langsung di ponsel.
              ponytail: hanya native capture; kalau butuh webcam di desktop,
              ganti ke modal getUserMedia. */}
          <input
            ref={kamera}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const dipilih = e.target.files?.[0];
              if (dipilih) onLampirkan(dipilih);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => kamera.current?.click()}
            disabled={sibukLampiran || sibuk}
            aria-label="Ambil foto dari kamera"
            title="Ambil foto dari kamera"
            className={`mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-penuh transition-colors ${
              sibukLampiran ? "text-teks-muted" : "text-teks-muted hover:text-aksen"
            }`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 8.5A2.5 2.5 0 015.5 6h1.2a1 1 0 00.83-.45l.94-1.4A1 1 0 019.3 3.7h5.4a1 1 0 01.83.45l.94 1.4a1 1 0 00.83.45h1.2A2.5 2.5 0 0121 8.5v8A2.5 2.5 0 0118.5 19h-13A2.5 2.5 0 013 16.5z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
          <button
            onClick={kirim}
            disabled={!bisaKirim}
            aria-label="Kirim pesan"
            className={`mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-penuh transition-colors ${
              bisaKirim ? "bg-aksen text-white hover:bg-aksen-terang" : "bg-border text-teks-muted"
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
        <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-teks-muted-2">
          <span className="hidden sm:inline">Enter kirim · Shift + Enter baris baru</span>
          {teks.length > 3000 && (
            <span className={kepanjangan ? "text-danger" : ""}>
              {teks.length.toLocaleString("id-ID")} / {MAKS_PESAN.toLocaleString("id-ID")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
