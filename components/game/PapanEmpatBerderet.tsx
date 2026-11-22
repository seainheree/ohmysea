"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Skor, Status, Tingkat, Ulang } from "@/components/game/bersama";
import { TRANSISI } from "@/lib/motion";
import {
  CO_BARIS,
  CO_JALUR,
  garisCO,
  jatuhkan,
  kolomBisa,
  langkahCO,
  sel,
  type Papan,
  type Pemain,
} from "@/lib/game";

function papanKosong(): Papan {
  return Array<Pemain | null>(CO_JALUR * CO_BARIS).fill(null);
}

export function PapanEmpatBerderet() {
  const [papan, setPapan] = useState(papanKosong);
  const [giliran, setGiliran] = useState<Pemain>("kamu");
  const [sulit, setSulit] = useState(true);
  const [skor, setSkor] = useState({ kamu: 0, kirby: 0, seri: 0 });
  const [terakhir, setTerakhir] = useState<number | null>(null);
  const tercatat = useRef(false);

  const garis = garisCO(papan);
  const juara = garis ? (papan[garis[0]] as Pemain) : null;
  const seri = !garis && kolomBisa(papan).length === 0;
  const selesai = Boolean(garis) || seri;

  useEffect(() => {
    if (giliran !== "kirby" || selesai) return;
    const t = window.setTimeout(() => {
      const k = langkahCO(papan, "kirby", sulit);
      if (k === null) return;
      setPapan((lama) => {
        const baru = [...lama];
        const baris = jatuhkan(baru, k, "kirby");
        if (baris !== null) setTerakhir(baris * CO_JALUR + k);
        return baru;
      });
      setGiliran("kamu");
    }, 560);
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

  function jatuhkanDi(kolom: number) {
    if (giliran !== "kamu" || selesai) return;
    setPapan((lama) => {
      const baru = [...lama];
      const baris = jatuhkan(baru, kolom, "kamu");
      if (baris === null) return lama;
      setTerakhir(baris * CO_JALUR + kolom);
      return baru;
    });
    setGiliran("kirby");
  }

  function ulang() {
    tercatat.current = false;
    setPapan(papanKosong());
    setGiliran("kamu");
    setTerakhir(null);
  }

  const pesan = juara
    ? juara === "kamu"
      ? "Kamu menang! poyoo~"
      : "Kirby menang. Coba lagi?"
    : seri
      ? "Seri. Papan penuh!"
      : giliran === "kamu"
        ? "Giliranmu — pilih kolom"
        : "Kirby sedang berpikir...";

  return (
    <div className="flex flex-col gap-sedang">
      <Skor kamu={skor.kamu} kirby={skor.kirby} seri={skor.seri} />

      <div className="mx-auto grid w-full max-w-[350px] grid-cols-7 gap-1 rounded-sedang border border-border bg-bg-topbar p-1.5">
        {Array.from({ length: CO_BARIS * CO_JALUR }, (_, idx) => {
          // Baris 0 = paling bawah; render dari atas supaya gravitasi terlihat.
          const baris = CO_BARIS - 1 - Math.floor(idx / CO_JALUR);
          const kolom = idx % CO_JALUR;
          const warna = sel(papan, baris, kolom);
          const sorot = garis?.includes(baris * CO_JALUR + kolom) ?? false;
          const baru = terakhir === baris * CO_JALUR + kolom;
          const bisaKlik = giliran === "kamu" && !selesai;
          return (
            <button
              key={idx}
              onClick={() => jatuhkanDi(kolom)}
              disabled={!bisaKlik}
              aria-label={`Kolom ${kolom + 1}, baris ${baris + 1}${
                warna ? `: ${warna === "kamu" ? "kamu" : "Kirby"}` : " kosong"
              }`}
              className={`grid aspect-square place-items-center rounded-penuh transition-colors ${
                bisaKlik ? "hover:bg-border" : ""
              }`}
            >
              {warna && (
                <motion.span
                  initial={{ opacity: 0, y: baru ? -14 : 0, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: TRANSISI.cepat }}
                  className={`block h-full w-full rounded-penuh ${
                    warna === "kamu" ? "bg-aksen" : "bg-aksen-lembut"
                  } ${sorot ? "ring-2 ring-teks" : ""}`}
                />
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
