"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { Status, Ulang } from "@/components/game/bersama";
import { Icon } from "@/components/ui/Icon";
import { TRANSISI } from "@/lib/motion";
import { IKON_INGATAN, dekIngatan } from "@/lib/game";

const TOTAL = IKON_INGATAN.length;

export function PapanIngatan() {
  const [dek, setDek] = useState(() => dekIngatan());
  const [terbuka, setTerbuka] = useState<number[]>([]);
  const [cocok, setCocok] = useState<number[]>([]);
  const [langkah, setLangkah] = useState(0);

  const selesai = cocok.length === TOTAL * 2;

  function balik(i: number) {
    if (terbuka.length === 2 || terbuka.includes(i) || cocok.includes(i)) return;
    const baru = [...terbuka, i];
    setTerbuka(baru);
    setLangkah((n) => n + 1);

    if (baru.length === 2) {
      const [a, b] = baru;
      const sama = dek[a] === dek[b];
      window.setTimeout(
        () => {
          if (sama) setCocok((c) => [...c, a, b]);
          setTerbuka([]);
        },
        sama ? 480 : 760,
      );
    }
  }

  function ulang() {
    setDek(dekIngatan());
    setTerbuka([]);
    setCocok([]);
    setLangkah(0);
  }

  return (
    <div className="flex flex-col gap-sedang">
      <div className="flex items-center justify-center gap-besar text-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-teks-muted-2">Langkah</p>
          <p className="text-lg leading-tight tabular-nums">{langkah}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-teks-muted-2">Pasangan</p>
          <p className="text-lg leading-tight tabular-nums">
            {cocok.length / 2}/{TOTAL}
          </p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[320px] grid-cols-4 gap-1.5">
        {dek.map((nilai, i) => {
          const terbukaIni = terbuka.includes(i);
          const ketemu = cocok.includes(i);
          const tampil = terbukaIni || ketemu;
          return (
            <button
              key={i}
              onClick={() => balik(i)}
              disabled={tampil || terbuka.length === 2 || selesai}
              aria-label={tampil ? `Kartu terbuka: ${IKON_INGATAN[nilai]}` : `Kartu ${i + 1} tertutup`}
              className={`grid aspect-square place-items-center rounded-sedang border transition-colors ${
                ketemu
                  ? "border-aksen bg-aksen/10 opacity-60"
                  : tampil
                    ? "border-border-kuat bg-surface"
                    : "border-border bg-bg-topbar hover:border-border-kuat"
              }`}
            >
              {tampil ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, transition: TRANSISI.cepat }}
                  className={ketemu ? "text-aksen-lembut" : "text-teks"}
                >
                  <Icon name={IKON_INGATAN[nilai]} size={22} />
                </motion.span>
              ) : (
                <span className="h-2 w-2 rounded-penuh bg-border-kuat" />
              )}
            </button>
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
