"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { BarKirby } from "@/components/game/bersama";
import { PapanEmpatBerderet } from "@/components/game/PapanEmpatBerderet";
import { PapanIngatan } from "@/components/game/PapanIngatan";
import { PapanTicTacToe } from "@/components/game/PapanTicTacToe";
import { REAKSI, acak, type Reaksi } from "@/components/game/reaksi";
import { Icon, type NamaIkon } from "@/components/ui/Icon";
import { Kirby } from "@/components/ui/Kirby";
import { TRANSISI } from "@/lib/motion";
import { buatLagu } from "@/lib/game/lagu";

type Jenis = "ttt" | "berderet" | "ingatan";

const DAFTAR: { id: Jenis; nama: string; ikon: NamaIkon; ringkas: string }[] = [
  { id: "ttt", nama: "Tic Tac Toe", ikon: "kisi", ringkas: "3×3 · lawan Kirby" },
  { id: "berderet", nama: "Empat Berderet", ikon: "bawah", ringkas: "7×6 · sambung empat" },
  { id: "ingatan", nama: "Kartu Ingatan", ikon: "salin", ringkas: "12 kartu · cari pasangan" },
];

const KUNCI_LAGU = "ohmysea-lagu-game";

/** Panel ruang main: pilih game, main langsung di dalam chat. */
export function GamePanel({ onTutup }: { onTutup: () => void }) {
  const [jenis, setJenis] = useState<Jenis>("ttt");
  const [reaksi, setReaksi] = useState<Reaksi>(() => ({
    ekspresi: "sapaan",
    teks: acak(REAKSI.sambut),
  }));
  const [laguNyala, setLaguNyala] = useState(false);

  useEffect(() => {
    try {
      setLaguNyala(localStorage.getItem(KUNCI_LAGU) === "nyala");
    } catch {
      // localStorage bisa diblokir; lagu tetap bisa dinyalakan manual.
    }
  }, []);

  // Lagu dibuat/dimatikan di sini supaya tidak ada audio yang tertinggal
  // saat panel ditutup. Kalau browser menahan audio sebelum ada aksi
  // pengguna, percobaan pertama saat interaksi apa pun akan membunyikannya.
  useEffect(() => {
    if (!laguNyala) return;
    const lagu = buatLagu();
    lagu.mulai();
    const sekali = () => lagu.mulai();
    window.addEventListener("pointerdown", sekali, { once: true });
    return () => {
      window.removeEventListener("pointerdown", sekali);
      lagu.berhenti();
    };
  }, [laguNyala]);

  function gantiLagu() {
    const baru = !laguNyala;
    setLaguNyala(baru);
    try {
      localStorage.setItem(KUNCI_LAGU, baru ? "nyala" : "mati");
    } catch {
      // abaikan
    }
  }

  function gantiGame(id: Jenis) {
    setJenis(id);
    setReaksi({ ekspresi: "sapaan", teks: acak(REAKSI.sambut) });
  }

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
          <Kirby ekspresi="sapaan" size={32} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl leading-none">Ruang main</h2>
            <p className="mt-1 text-[11px] text-teks-muted">
              Main langsung di sini, tanpa keluar dari chat.
            </p>
          </div>
          <button
            onClick={gantiLagu}
            aria-pressed={laguNyala}
            aria-label={laguNyala ? "Matikan lagu mode game" : "Nyalakan lagu mode game"}
            title={laguNyala ? "Lagu: nyala" : "Lagu: mati"}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-penuh transition-colors hover:bg-border ${
              laguNyala ? "text-aksen-lembut" : "text-teks-muted-2 hover:text-teks"
            }`}
          >
            <Icon name={laguNyala ? "suara" : "bisu"} />
          </button>
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
              onClick={() => gantiGame(g.id)}
              aria-pressed={jenis === g.id}
              className="relative flex shrink-0 items-center gap-2 rounded-sedang border border-border px-3 py-1.5 text-left transition-colors hover:border-border-kuat"
            >
              {jenis === g.id && (
                <motion.span
                  layoutId="game-aktif"
                  className="absolute inset-0 -z-10 rounded-sedang border border-aksen bg-aksen/10"
                  transition={TRANSISI.pegas}
                />
              )}
              <Icon name={g.ikon} size={16} />
              <span className="text-[12px] leading-tight">
                <span className="block font-medium">{g.nama}</span>
                <span className="block text-[10px] text-teks-muted-2">{g.ringkas}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-sedang">
          <div className="flex flex-col gap-sedang">
            <BarKirby reaksi={reaksi} />
            {jenis === "ttt" && <PapanTicTacToe onReaksi={setReaksi} />}
            {jenis === "berderet" && <PapanEmpatBerderet onReaksi={setReaksi} />}
            {jenis === "ingatan" && <PapanIngatan onReaksi={setReaksi} />}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
