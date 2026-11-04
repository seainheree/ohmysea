"use client";

import { useRef, useState } from "react";

export function Composer({
  onKirim,
  sibuk,
  mode,
}: {
  onKirim: (teks: string) => void;
  sibuk: boolean;
  mode: "chat" | "curhat";
}) {
  const [teks, setTeks] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);

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
        <div className="flex items-end gap-2 rounded-besar border border-border bg-surface p-1.5">
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
