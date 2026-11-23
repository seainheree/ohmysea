"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Skor, Status, Tingkat, Ulang } from "@/components/game/bersama";
import { REAKSI, acak, type Reaksi } from "@/components/game/reaksi";
import { TRANSISI } from "@/lib/motion";
import {
  CO_BARIS,
  CO_JALUR,
  bisaMenangCO,
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

/** Warna keping dibuat beda jauh supaya jelas di tema gelap maupun terang. */
function gayaKeping(warna: Pemain, sorot: boolean): string {
  const dasar =
    warna === "kamu"
      ? "bg-aksen ring-2 ring-aksen-lembut"
      : "bg-teks ring-2 ring-aksen-terang";
  return `${dasar} ${sorot ? "animate-pulse ring-4 ring-teks" : ""}`;
}

export function PapanEmpatBerderet({ onReaksi }: { onReaksi: (r: Reaksi) => void }) {
  const [papan, setPapan] = useState(papanKosong);
  const [giliran, setGiliran] = useState<Pemain>("kamu");
  const [sulit, setSulit] = useState(true);
  const [skor, setSkor] = useState({ kamu: 0, kirby: 0, seri: 0 });
  const [terakhir, setTerakhir] = useState<number | null>(null);
  const [kolomSorot, setKolomSorot] = useState<number | null>(null);
  const tercatat = useRef(false);

  const garis = garisCO(papan);
  const juara = garis ? (papan[garis[0]] as Pemain) : null;
  const seri = !garis && kolomBisa(papan).length === 0;
  const selesai = Boolean(garis) || seri;
  const bisaMain = giliran === "kamu" && !selesai;

  /** Baris tempat keping akan berhenti di kolom itu (untuk bayangan saat hover). */
  const barisJatuh = (kolom: number): number | null => {
    for (let b = 0; b < CO_BARIS; b++) if (sel(papan, b, kolom) === null) return b;
    return null;
  };

  useEffect(() => {
    if (giliran !== "kirby" || selesai) return;
    const ancaman = bisaMenangCO(papan, "kamu");
    if (Math.random() < 0.45) onReaksi({ ekspresi: "hitung", teks: acak(REAKSI.hitung) });

    const t = window.setTimeout(() => {
      const k = langkahCO(papan, "kirby", sulit);
      if (k === null) return;
      const baru = [...papan];
      const baris = jatuhkan(baru, k, "kirby");
      setPapan(baru);
      if (baris !== null) setTerakhir(baris * CO_JALUR + k);
      setGiliran("kamu");

      if (ancaman && !bisaMenangCO(baru, "kamu")) {
        onReaksi({ ekspresi: "malu", teks: acak(REAKSI.blokir) });
      } else if (bisaMenangCO(baru, "kirby")) {
        onReaksi({ ekspresi: "fokus", teks: acak(REAKSI.ancam) });
      }
    }, 660);
    return () => window.clearTimeout(t);
  }, [giliran, selesai, papan, sulit, onReaksi]);

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
    onReaksi(
      juara === "kamu"
        ? { ekspresi: "sedih", teks: acak(REAKSI.kalah) }
        : juara === "kirby"
          ? { ekspresi: "tertawa", teks: acak(REAKSI.menang) }
          : { ekspresi: "bingung", teks: acak(REAKSI.seri) },
    );
  }, [selesai, juara, onReaksi]);

  function lepas(kolom: number) {
    if (!bisaMain) return;
    const baru = [...papan];
    const baris = jatuhkan(baru, kolom, "kamu");
    if (baris === null) return;
    setPapan(baru);
    setTerakhir(baris * CO_JALUR + kolom);
    setGiliran("kirby");
    if (bisaMenangCO(baru, "kamu")) {
      onReaksi({ ekspresi: "kaget", teks: acak(REAKSI.kaget) });
    }
  }

  function ulang() {
    tercatat.current = false;
    setPapan(papanKosong());
    setGiliran("kamu");
    setTerakhir(null);
    setKolomSorot(null);
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

      <div className="mx-auto w-full max-w-[360px] rounded-besar border border-border bg-bg-topbar p-2 shadow-glow">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: CO_BARIS * CO_JALUR }, (_, idx) => {
            // Baris 0 = paling bawah; render dari atas supaya gravitasi terlihat.
            const baris = CO_BARIS - 1 - Math.floor(idx / CO_JALUR);
            const kolom = idx % CO_JALUR;
            const warna = sel(papan, baris, kolom);
            const posisi = baris * CO_JALUR + kolom;
            const sorot = garis?.includes(posisi) ?? false;
            const baru = terakhir === posisi;
            const bayangan = bisaMain && kolomSorot === kolom && barisJatuh(kolom) === baris;
            return (
              <button
                key={idx}
                onClick={() => lepas(kolom)}
                onPointerEnter={() => setKolomSorot(kolom)}
                onPointerLeave={() => setKolomSorot((k) => (k === kolom ? null : k))}
                disabled={!bisaMain}
                aria-label={`Kolom ${kolom + 1}, baris ${baris + 1}${
                  warna ? `: ${warna === "kamu" ? "kamu" : "Kirby"}` : " kosong"
                }`}
                className="grid aspect-square place-items-center rounded-penuh"
              >
                <span
                  className={`grid h-full w-full place-items-center rounded-penuh transition-colors ${
                    bayangan ? "bg-aksen/15 ring-2 ring-aksen" : "bg-bg-main ring-1 ring-border"
                  }`}
                >
                  {warna ? (
                    <motion.span
                      initial={{ y: baru ? -320 : 0, opacity: baru ? 1 : 0, scale: baru ? 1 : 0.6 }}
                      animate={{ y: 0, opacity: 1, scale: 1, transition: TRANSISI.pegas }}
                      className={`block h-full w-full rounded-penuh ${gayaKeping(warna, sorot)}`}
                    />
                  ) : (
                    bayangan && <span className="block h-full w-full rounded-penuh bg-aksen/40" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Status>{pesan}</Status>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Tingkat sulit={sulit} onUbah={setSulit} />
        <Ulang onKlik={ulang} />
      </div>
    </div>
  );
}
