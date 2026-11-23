"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Skor, Status, Tingkat, Ulang } from "@/components/game/bersama";
import { REAKSI, acak, type Reaksi } from "@/components/game/reaksi";
import { DURASI, KURVA_STANDAR, TRANSISI } from "@/lib/motion";
import {
  garisTTT,
  langkahMenangTTT,
  langkahTTT,
  papanTTTKosong,
  penuh,
  type Pemain,
} from "@/lib/game";

/** Titik tengah sel (persen) — sel tanpa jarak supaya garis menang pas. */
function titik(i: number): { x: number; y: number } {
  return { x: ((i % 3) + 0.5) * (100 / 3), y: (Math.floor(i / 3) + 0.5) * (100 / 3) };
}

function GarisMenang({ tiga }: { tiga: number[] }) {
  const a = titik(tiga[0]);
  const c = titik(tiga[2]);
  const panjang = Math.hypot(c.x - a.x, c.y - a.y);
  const sudut = (Math.atan2(c.y - a.y, c.x - a.x) * 180) / Math.PI;
  return (
    <motion.span
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1, transition: { duration: DURASI.lambat, ease: KURVA_STANDAR } }}
      style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${panjang}%`, rotate: `${sudut}deg` }}
      className="pointer-events-none absolute h-[3px] origin-left -translate-y-1/2 rounded-penuh bg-aksen-terang shadow-glow"
    />
  );
}

export function PapanTicTacToe({ onReaksi }: { onReaksi: (r: Reaksi) => void }) {
  const [papan, setPapan] = useState(papanTTTKosong);
  const [giliran, setGiliran] = useState<Pemain>("kamu");
  const [sulit, setSulit] = useState(true);
  const [skor, setSkor] = useState({ kamu: 0, kirby: 0, seri: 0 });
  const [terakhir, setTerakhir] = useState<number | null>(null);
  const [sorot, setSorot] = useState<number | null>(null);
  const tercatat = useRef(false);

  const garis = garisTTT(papan);
  const juara = garis ? (papan[garis[0]] as Pemain) : null;
  const selesai = Boolean(garis) || penuh(papan);

  // Giliran Kirby: kadang mengeluh "menghitung" dulu, lalu melangkah.
  useEffect(() => {
    if (giliran !== "kirby" || selesai) return;
    const ancaman = langkahMenangTTT(papan, "kamu");
    if (Math.random() < 0.45) onReaksi({ ekspresi: "hitung", teks: acak(REAKSI.hitung) });

    const t = window.setTimeout(() => {
      const i = langkahTTT(papan, "kirby", sulit);
      if (i === null) return;
      const baru = [...papan];
      baru[i] = "kirby";
      setPapan(baru);
      setTerakhir(i);
      setGiliran("kamu");

      const sesudah = langkahMenangTTT(baru, "kamu");
      if (ancaman.length > 0 && sesudah.length === 0) {
        onReaksi({ ekspresi: "malu", teks: acak(REAKSI.blokir) });
      } else if (sesudah.length > 0) {
        onReaksi({ ekspresi: "kaget", teks: acak(REAKSI.kaget) });
      } else if (langkahMenangTTT(baru, "kirby").length > 0) {
        onReaksi({ ekspresi: "fokus", teks: acak(REAKSI.ancam) });
      }
    }, 620);
    return () => window.clearTimeout(t);
  }, [giliran, selesai, papan, sulit, onReaksi]);

  // Skor + reaksi akhir babak. Hanya sekali per babak.
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

  function pilih(i: number) {
    if (giliran !== "kamu" || selesai || papan[i]) return;
    const baru = [...papan];
    baru[i] = "kamu";
    setPapan(baru);
    setTerakhir(i);
    setSorot(null);
    setGiliran("kirby");
    if (langkahMenangTTT(baru, "kamu").length > 0) {
      onReaksi({ ekspresi: "kaget", teks: acak(REAKSI.kaget) });
    }
  }

  function ulang() {
    tercatat.current = false;
    setPapan(papanTTTKosong());
    setGiliran("kamu");
    setTerakhir(null);
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

      <div className="relative mx-auto grid aspect-square w-full max-w-[300px] grid-cols-3">
        {papan.map((sel, i) => {
          const sorotMenang = garis?.includes(i) ?? false;
          const bisaKlik = giliran === "kamu" && !selesai && !sel;
          return (
            <button
              key={i}
              onClick={() => pilih(i)}
              onPointerEnter={() => setSorot(i)}
              onPointerLeave={() => setSorot((s) => (s === i ? null : s))}
              disabled={!bisaKlik}
              aria-label={
                sel ? `Sel ${i + 1}: ${sel === "kamu" ? "kamu" : "Kirby"}` : `Sel ${i + 1} kosong`
              }
              className="group aspect-square p-[3px]"
            >
              <span
                className={`grid h-full w-full place-items-center rounded-sedang border transition-colors ${
                  sorotMenang
                    ? "border-aksen bg-aksen/15"
                    : bisaKlik
                      ? "border-border bg-surface group-hover:border-aksen group-hover:bg-aksen/5"
                      : "border-border bg-surface"
                }`}
              >
                {sel ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0, transition: TRANSISI.pegas }}
                    className={`text-3xl font-semibold sm:text-4xl ${
                      sel === "kamu" ? "text-aksen-terang" : "text-aksen-lembut"
                    }`}
                  >
                    {sel === "kamu" ? "X" : "O"}
                  </motion.span>
                ) : sorot === i && bisaKlik ? (
                  <span className="text-3xl font-semibold text-aksen/30 sm:text-4xl">X</span>
                ) : (
                  terakhir === i && <span className="h-1.5 w-1.5 rounded-penuh bg-teks-muted-2" />
                )}
              </span>
            </button>
          );
        })}
        {garis && <GarisMenang tiga={garis} />}
      </div>

      <Status>{pesan}</Status>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Tingkat sulit={sulit} onUbah={setSulit} />
        <Ulang onKlik={ulang} />
      </div>
    </div>
  );
}
