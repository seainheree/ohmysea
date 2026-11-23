"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

import type { Ekspresi, Reaksi } from "@/components/game/reaksi";
import { Kirby, type EkspresiKirby } from "@/components/ui/Kirby";
import { Icon } from "@/components/ui/Icon";
import { TRANSISI } from "@/lib/motion";

/** Ekspresi game → potongan sprite. */
const WAJAH: Record<Ekspresi, EkspresiKirby> = {
  tenang: "tenang",
  hitung: "pikir",
  senang: "senang",
  kaget: "kaget",
  sedih: "sedih",
  tertawa: "tertawa",
  bingung: "bingung",
  malu: "malu",
  fokus: "fokus",
  sapaan: "sapaan",
};

/** Ekspresi game → kelas animasi CSS (lihat app/globals.css). */
const GERAK: Record<Ekspresi, string> = {
  tenang: "kirby-tenang",
  hitung: "kirby-hitung",
  senang: "kirby-senang",
  kaget: "kirby-kaget",
  sedih: "kirby-sedih",
  tertawa: "kirby-senang",
  bingung: "kirby-kaget",
  malu: "kirby-tenang",
  fokus: "kirby-kaget",
  sapaan: "kirby-tenang",
};

/** Avatar Kirby dengan sikap — potongan lembar sprite + animasi CSS. */
export function AvatarKirby({
  ekspresi = "tenang",
  size = 44,
}: {
  ekspresi?: Ekspresi;
  size?: number;
}) {
  return (
    <span className={`${GERAK[ekspresi]} grid shrink-0 place-items-center`}>
      <Kirby ekspresi={WAJAH[ekspresi]} size={size} />
    </span>
  );
}

/** Bilah Kirby: avatar + ucapan yang berganti tiap momen penting. */
export function BarKirby({ reaksi }: { reaksi: Reaksi }) {
  return (
    <div className="flex min-h-[68px] items-center gap-2.5 rounded-besar border border-border bg-surface px-sedang py-2">
      <AvatarKirby ekspresi={reaksi.ekspresi} />
      <div className="min-w-0 flex-1" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={reaksi.teks}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: TRANSISI.cepat }}
            exit={{ opacity: 0, y: -6, transition: TRANSISI.kilat }}
            className="text-[12.5px] leading-snug text-teks"
          >
            <span className="text-aksen-lembut">Kirby</span> {reaksi.teks}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Baris status di bawah papan — satu tempat supaya semua game seragam. */
export function Status({ children }: { children: ReactNode }) {
  return (
    <p aria-live="polite" className="min-h-5 text-center text-[13px] text-teks-muted">
      {children}
    </p>
  );
}

/** Papan skor kamu / Kirby / seri. */
export function Skor({ kamu, kirby, seri }: { kamu: number; kirby: number; seri: number }) {
  const isi: [string, number, string][] = [
    ["Kamu", kamu, "text-aksen-terang"],
    ["Kirby", kirby, "text-aksen-lembut"],
    ["Seri", seri, "text-teks-muted"],
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {isi.map(([label, nilai, warna]) => (
        <div
          key={label}
          className="rounded-sedang border border-border bg-surface px-2 py-1.5 text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.08em] text-teks-muted-2">{label}</p>
          <motion.p
            key={nilai}
            initial={{ scale: 1.35, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1, transition: TRANSISI.cepat }}
            className={`text-lg leading-tight tabular-nums ${warna}`}
          >
            {nilai}
          </motion.p>
        </div>
      ))}
    </div>
  );
}

/** Tingkat kesulitan Kirby. */
export function Tingkat({
  sulit,
  onUbah,
}: {
  sulit: boolean;
  onUbah: (sulit: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-penuh border border-border p-0.5 text-[11px]">
      {[
        { nilai: false, label: "Mudah" },
        { nilai: true, label: "Sulit" },
      ].map(({ nilai, label }) => (
        <button
          key={label}
          onClick={() => onUbah(nilai)}
          aria-pressed={sulit === nilai}
          className={`relative rounded-penuh px-3 py-1 transition-colors ${
            sulit === nilai ? "text-white" : "text-teks-muted hover:text-teks"
          }`}
        >
          {sulit === nilai && (
            <motion.span
              layoutId="tingkat-aktif"
              className="absolute inset-0 -z-10 rounded-penuh bg-aksen"
              transition={TRANSISI.pegas}
            />
          )}
          {label}
        </button>
      ))}
    </div>
  );
}

/** Tombol mulai ulang papan. */
export function Ulang({ onKlik }: { onKlik: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onKlik}
      className="inline-flex items-center gap-1.5 rounded-penuh border border-border-kuat px-3 py-1.5 text-[12px] text-teks-muted transition-colors hover:border-aksen hover:text-teks"
    >
      <Icon name="ulang" size={13} /> Mulai ulang
    </motion.button>
  );
}

export type NilaiSkor = { kamu: number; kirby: number; seri: number };

const AWAL_SKOR: NilaiSkor = { kamu: 0, kirby: 0, seri: 0 };

/**
 * Skor yang diingat di perangkat. Menutup ruang main tidak lagi menghapus
 * riwayat menang/kalah; "Mulai ulang" hanya mengulang papan, skornya tetap.
 */
export function useSkorTersimpan(kunci: string) {
  const [skor, setSkor] = useState<NilaiSkor>(AWAL_SKOR);

  useEffect(() => {
    try {
      const isi = localStorage.getItem(kunci);
      if (!isi) return;
      const lama = JSON.parse(isi) as Partial<NilaiSkor>;
      setSkor({
        kamu: Number(lama.kamu) || 0,
        kirby: Number(lama.kirby) || 0,
        seri: Number(lama.seri) || 0,
      });
    } catch {
      // localStorage bisa diblokir atau isinya rusak — mulai dari nol.
    }
  }, [kunci]);

  function simpan(ubah: (lama: NilaiSkor) => NilaiSkor) {
    setSkor((lama) => {
      const baru = ubah(lama);
      try {
        localStorage.setItem(kunci, JSON.stringify(baru));
      } catch {
        // abaikan: skor tetap jalan di sesi ini
      }
      return baru;
    });
  }

  return [skor, simpan] as const;
}
