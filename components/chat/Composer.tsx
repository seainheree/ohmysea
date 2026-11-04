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
    <div className="border-t border-border bg-bg-topbar">
      <div className="mx-auto w-full max-w-[760px] px-sedang py-sedang">
        <div className="flex items-end gap-2 rounded-besar border border-border bg-surface p-2">
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
            className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-teks-muted-2"
          />
          <button
            onClick={kirim}
            disabled={sibuk || teks.trim().length === 0}
            aria-label="Kirim pesan"
            className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-penuh bg-aksen text-white transition-colors hover:bg-aksen-terang disabled:opacity-40"
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
        <p className="mt-2 text-center text-[11px] text-teks-muted-2">
          Enter kirim · Shift + Enter baris baru
        </p>
      </div>
    </div>
  );
}
