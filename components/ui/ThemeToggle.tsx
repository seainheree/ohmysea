"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/Icon";

export type Tema = "gelap" | "terang";
const KUNCI = "ohmysea-tema";

/**
 * Tema gelap/terang. Nilai awal ditulis oleh skrip kecil di <head> (sebelum
 * render) supaya tidak ada kedipan warna; komponen ini hanya menyinkronkan
 * tombol dengan keadaan sebenarnya lalu menyimpan pilihan pengguna.
 */
export function pakaiTema() {
  const [tema, setTema] = useState<Tema>("gelap");

  useEffect(() => {
    const tersimpan = (localStorage.getItem(KUNCI) as Tema | null) ?? null;
    const sistem: Tema = window.matchMedia("(prefers-color-scheme: light)").matches
      ? "terang"
      : "gelap";
    const awal = tersimpan ?? sistem;
    setTema(awal);
    document.documentElement.dataset.tema = awal;
  }, []);

  function ganti(baru: Tema) {
    setTema(baru);
    document.documentElement.dataset.tema = baru;
    try {
      localStorage.setItem(KUNCI, baru);
    } catch {
      // localStorage bisa diblokir (mode privat) — tema tetap berlaku untuk sesi ini
    }
  }

  return { tema, ganti, terang: tema === "terang" };
}

export function ThemeToggle({ ringkas = false }: { ringkas?: boolean }) {
  const { terang, ganti } = pakaiTema();

  return (
    <button
      onClick={() => ganti(terang ? "gelap" : "terang")}
      aria-label={terang ? "Ganti ke mode gelap" : "Ganti ke mode terang"}
      title={terang ? "Mode gelap" : "Mode terang"}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-penuh text-teks-muted hover:bg-border hover:text-teks ${
        ringkas ? "md:h-9 md:w-9" : ""
      }`}
    >
      {terang ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <Icon name="matahari" size={18} />
      )}
    </button>
  );
}
