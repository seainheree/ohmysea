"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Status, Ulang } from "@/components/game/bersama";
import { REAKSI, acak, type Reaksi } from "@/components/game/reaksi";
import { Icon } from "@/components/ui/Icon";
import { TRANSISI } from "@/lib/motion";
import { IKON_INGATAN, dekIngatan } from "@/lib/game";

const TOTAL = IKON_INGATAN.length;

/** Ledakan kecil saat semua pasangan ketemu. */
function Burst() {
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center">
      {[0, 0.12, 0.24].map((tunda) => (
        <motion.span
          key={tunda}
          initial={{ scale: 0.4, opacity: 0.7 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.9, delay: tunda, ease: "easeOut" }}
          className="absolute h-24 w-24 rounded-penuh border-2 border-aksen"
        />
      ))}
    </span>
  );
}

export function PapanIngatan({ onReaksi }: { onReaksi: (r: Reaksi) => void }) {
  const [dek, setDek] = useState(() => dekIngatan());
  const [terbuka, setTerbuka] = useState<number[]>([]);
  const [cocok, setCocok] = useState<number[]>([]);
  const [salah, setSalah] = useState<number[]>([]);
  const [langkah, setLangkah] = useState(0);
  const tercatat = useRef(false);

  const selesai = cocok.length === TOTAL * 2;

  useEffect(() => {
    if (!selesai || tercatat.current) return;
    tercatat.current = true;
    onReaksi({ ekspresi: "senang", teks: acak(REAKSI.beres) });
  }, [selesai, onReaksi]);

  function balik(i: number) {
    if (terbuka.length === 2 || terbuka.includes(i) || cocok.includes(i) || selesai) return;
    const baru = [...terbuka, i];
    setTerbuka(baru);
    setLangkah((n) => n + 1);

    if (baru.length === 2) {
      const [a, b] = baru;
      const sama = dek[a] === dek[b];
      if (sama && Math.random() < 0.5) {
        onReaksi({ ekspresi: "kaget", teks: acak(REAKSI.ingat) });
      }
      window.setTimeout(
        () => {
          if (sama) {
            setCocok((c) => [...c, a, b]);
          } else {
            setSalah([a, b]);
            window.setTimeout(() => setSalah([]), 340);
          }
          setTerbuka([]);
        },
        sama ? 460 : 700,
      );
    }
  }

  function ulang() {
    tercatat.current = false;
    setDek(dekIngatan());
    setTerbuka([]);
    setCocok([]);
    setSalah([]);
    setLangkah(0);
  }

  return (
    <div className="flex flex-col gap-sedang">
      <div className="relative flex items-center gap-besar">
        <div className="grid grid-cols-2 gap-besar">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-teks-muted-2">Langkah</p>
            <p className="text-lg leading-tight tabular-nums">{langkah}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-teks-muted-2">Pasangan</p>
            <p className="text-lg leading-tight tabular-nums text-aksen-lembut">
              {cocok.length / 2}/{TOTAL}
            </p>
          </div>
        </div>
        <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-penuh bg-border sm:w-32">
          <motion.div
            animate={{ width: `${(cocok.length / (TOTAL * 2)) * 100}%` }}
            transition={TRANSISI.sedang}
            className="h-full rounded-penuh bg-aksen"
          />
        </div>
        {selesai && <Burst />}
      </div>

      <div className="papan-3d mx-auto grid w-full max-w-[330px] grid-cols-4 gap-2">
        {dek.map((nilai, i) => {
          const terbukaIni = terbuka.includes(i);
          const ketemu = cocok.includes(i);
          const tampil = terbukaIni || ketemu;
          const goyang = salah.includes(i);
          return (
            <motion.button
              key={i}
              onClick={() => balik(i)}
              disabled={tampil || terbuka.length === 2 || selesai}
              animate={{ rotateY: tampil ? 180 : 0, x: goyang ? [0, -6, 6, -4, 4, 0] : 0 }}
              transition={goyang ? { duration: 0.34 } : TRANSISI.sedang}
              aria-label={tampil ? `Kartu terbuka: ${IKON_INGATAN[nilai]}` : `Kartu ${i + 1} tertutup`}
              className="relative aspect-square"
              style={{ transformStyle: "preserve-3d" }}
            >
              <span
                className="absolute inset-0 grid place-items-center rounded-sedang border border-border bg-bg-topbar"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="h-2 w-2 rounded-penuh bg-border-kuat" />
              </span>
              <span
                className={`absolute inset-0 grid place-items-center rounded-sedang border bg-surface ${
                  ketemu ? "border-aksen text-aksen-lembut" : "border-border-kuat text-teks"
                }`}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <Icon name={IKON_INGATAN[nilai]} size={22} />
              </span>
            </motion.button>
          );
        })}
      </div>

      <Status>
        {selesai ? `Selesai dalam ${langkah} langkah! poyoo~` : "Temukan 8 pasangan yang sama"}
      </Status>

      <div className="flex justify-center">
        <Ulang onKlik={ulang} />
      </div>
    </div>
  );
}
