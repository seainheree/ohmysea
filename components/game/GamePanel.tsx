"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { PapanEmpatBerderet } from "@/components/game/PapanEmpatBerderet";
import { PapanIngatan } from "@/components/game/PapanIngatan";
import { PapanTicTacToe } from "@/components/game/PapanTicTacToe";
import { Icon, type NamaIkon } from "@/components/ui/Icon";
import { TRANSISI } from "@/lib/motion";

type Jenis = "ttt" | "berderet" | "ingatan";

const DAFTAR: { id: Jenis; nama: string; ikon: NamaIkon; ringkas: string }[] = [
  { id: "ttt", nama: "Tic Tac Toe", ikon: "kisi", ringkas: "3×3 · lawan Kirby" },
  { id: "berderet", nama: "Empat Berderet", ikon: "bawah", ringkas: "7×6 · sambung empat" },
  { id: "ingatan", nama: "Kartu Ingatan", ikon: "salin", ringkas: "16 kartu · cari pasangan" },
];

/** Panel ruang main: pilih game, main langsung di dalam chat. */
export function GamePanel({ onTutup }: { onTutup: () => void }) {
  const [jenis, setJenis] = useState<Jenis>("ttt");

  useEffect(() => {
    function tekan(e: KeyboardEvent) {
      if (e.key === "Escape") onTutup();
    }
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [onTutup]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: TRANSISI.cepat }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg-main/85 backdrop-blur-sm sm:items-center sm:p-sedang"
      onClick={onTutup}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Ruang main"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: TRANSISI.sedang }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-besar border border-border-kuat bg-bg-main shadow-glow sm:rounded-besar"
      >
        <header className="flex items-center gap-2.5 border-b border-border px-sedang py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/kirby-96.png" alt="" width={32} height={32} className="object-contain" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl leading-none">Ruang main</h2>
            <p className="mt-1 text-[11px] text-teks-muted">
              Main langsung di sini, tanpa keluar dari chat.
            </p>
          </div>
          <button
            onClick={onTutup}
            aria-label="Tutup ruang main"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-penuh text-teks-muted transition-colors hover:bg-border hover:text-teks"
          >
            <Icon name="tutup" />
          </button>
        </header>

        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border px-sedang py-2">
          {DAFTAR.map((g) => (
            <button
              key={g.id}
              onClick={() => setJenis(g.id)}
              aria-pressed={jenis === g.id}
              className={`flex shrink-0 items-center gap-2 rounded-sedang border px-3 py-1.5 text-left transition-colors ${
                jenis === g.id
                  ? "border-aksen bg-aksen/10 text-teks"
                  : "border-border text-teks-muted hover:border-border-kuat hover:text-teks"
              }`}
            >
              <Icon name={g.ikon} size={16} />
              <span className="text-[12px] leading-tight">
                <span className="block font-medium">{g.nama}</span>
                <span className="block text-[10px] text-teks-muted-2">{g.ringkas}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-sedang">
          {jenis === "ttt" && <PapanTicTacToe />}
          {jenis === "berderet" && <PapanEmpatBerderet />}
          {jenis === "ingatan" && <PapanIngatan />}
        </div>
      </motion.div>
    </motion.div>
  );
}
