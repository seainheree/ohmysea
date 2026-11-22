"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Skor, Status, Tingkat, Ulang } from "@/components/game/bersama";
import { TRANSISI } from "@/lib/motion";
import { garisTTT, langkahTTT, papanTTTKosong, penuh, type Pemain } from "@/lib/game";

export function PapanTicTacToe() {
  const [papan, setPapan] = useState(papanTTTKosong);
  const [giliran, setGiliran] = useState<Pemain>("kamu");
  const [sulit, setSulit] = useState(true);
  const [skor, setSkor] = useState({ kamu: 0, kirby: 0, seri: 0 });
  const tercatat = useRef(false);

  const garis = garisTTT(papan);
  const juara = garis ? (papan[garis[0]] as Pemain) : null;
  const selesai = Boolean(garis) || penuh(papan);

  // Kirby bermain dengan jeda kecil supaya terasa hidup, bukan instan.
  useEffect(() => {
    if (giliran !== "kirby" || selesai) return;
    const t = window.setTimeout(() => {
      const i = langkahTTT(papan, "kirby", sulit);
      if (i === null) return;
      setPapan((lama) => {
        const baru = [...lama];
        baru[i] = "kirby";
        return baru;
      });
      setGiliran("kamu");
    }, 520);
    return () => window.clearTimeout(t);
  }, [giliran, selesai, papan, sulit]);

  useEffect(() => {
    if (!selesai || tercatat.current) return;
    tercatat.current = true;
    setSkor((s) =>
      juara === "kamu"
        ? { ...s, kamu: s.kamu + 1 }
        : juara === "kirby"
          ? { ...s, kirby: s.kirby + 1 }
          : { ...s, seri: s.seri + 1 },
    );
  }, [selesai, juara]);

  function pilih(i: number) {
    if (giliran !== "kamu" || selesai || papan[i]) return;
    setPapan((lama) => {
      const baru = [...lama];
      baru[i] = "kamu";
      return baru;
    });
    setGiliran("kirby");
  }

  function ulang() {
    tercatat.current = false;
    setPapan(papanTTTKosong());
    setGiliran("kamu");
  }

  const pesan = juara
    ? juara === "kamu"
      ? "Kamu menang! poyoo~"
      : "Kirby menang. Coba lagi?"
    : selesai
      ? "Seri. Seimbang!"
      : giliran === "kamu"
        ? "Giliranmu — taruh X"
        : "Kirby sedang berpikir...";

  return (
    <div className="flex flex-col gap-sedang">
      <Skor kamu={skor.kamu} kirby={skor.kirby} seri={skor.seri} />

      <div className="mx-auto grid w-full max-w-[300px] grid-cols-3 gap-1.5">
        {papan.map((sel, i) => {
          const sorot = garis?.includes(i) ?? false;
          const bisaKlik = giliran === "kamu" && !selesai && !sel;
          return (
            <button
              key={i}
              onClick={() => pilih(i)}
              disabled={!bisaKlik}
              aria-label={
                sel ? `Sel ${i + 1}: ${sel === "kamu" ? "kamu" : "Kirby"}` : `Sel ${i + 1} kosong`
              }
              className={`grid aspect-square place-items-center rounded-sedang border text-3xl font-semibold transition-colors ${
                sorot
                  ? "border-aksen bg-aksen/15"
                  : "border-border bg-surface" + (bisaKlik ? " hover:border-border-kuat" : "")
              }`}
            >
              {sel && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1, transition: TRANSISI.cepat }}
                  className={sel === "kamu" ? "text-aksen-terang" : "text-aksen-lembut"}
                >
                  {sel === "kamu" ? "X" : "O"}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      <Status>{pesan}</Status>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Tingkat sulit={sulit} onUbah={setSulit} />
        <Ulang onKlik={ulang} />
      </div>
    </div>
  );
}
