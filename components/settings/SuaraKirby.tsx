"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import {
  KUNCI_LAJU,
  KUNCI_NADA,
  NADA_BAWAAN,
  batasiNada,
  bicarakan,
  hentikanSuara,
} from "@/lib/suara";

/** Pengaturan nada suara Kirby — disimpan di perangkat, dibaca saat bicara. */
export function SuaraKirby() {
  const [pitch, setPitch] = useState(NADA_BAWAAN.pitch);
  const [rate, setRate] = useState(NADA_BAWAAN.rate);

  useEffect(() => {
    try {
      const nada = batasiNada(
        Number(localStorage.getItem(KUNCI_NADA)) || NADA_BAWAAN.pitch,
        Number(localStorage.getItem(KUNCI_LAJU)) || NADA_BAWAAN.rate,
      );
      setPitch(nada.pitch);
      setRate(nada.rate);
    } catch {
      // localStorage bisa diblokir; bawaan sudah dipakai.
    }
  }, []);

  function ubah(nada: number, laju: number) {
    const nilai = batasiNada(nada, laju);
    setPitch(nilai.pitch);
    setRate(nilai.rate);
    try {
      localStorage.setItem(KUNCI_NADA, String(nilai.pitch));
      localStorage.setItem(KUNCI_LAJU, String(nilai.rate));
    } catch {
      // abaikan: nada tetap dipakai di sesi ini
    }
  }

  return (
    <section className="flex flex-col gap-sedang rounded-besar border border-border-kuat bg-surface p-sedang">
      <header>
        <h2 className="text-base font-semibold">Suara Kirby</h2>
        <p className="mt-1 text-xs text-teks-muted">
          Nada tinggi = lebih seperti karakter, tapi lebih terasa sintetis. Disimpan di perangkat ini.
        </p>
      </header>

      <label className="flex flex-col gap-1">
        <span className="flex items-center justify-between">
          <Label>Nada (pitch)</Label>
          <span className="text-xs tabular-nums text-teks-muted-2">{pitch.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={1}
          max={2}
          step={0.05}
          value={pitch}
          onChange={(e) => ubah(Number(e.target.value), rate)}
          className="w-full"
          style={{ accentColor: "var(--color-aksen)" }}
          aria-label="Nada suara Kirby"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="flex items-center justify-between">
          <Label>Kecepatan</Label>
          <span className="text-xs tabular-nums text-teks-muted-2">{rate.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={0.7}
          max={1.6}
          step={0.03}
          value={rate}
          onChange={(e) => ubah(pitch, Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--color-aksen)" }}
          aria-label="Kecepatan bicara Kirby"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void bicarakan("Halo, aku Kirby. Suaraku begini ya.")}>
          Coba suara
        </Button>
        <Button varian="garis" onClick={hentikanSuara}>
          Stop
        </Button>
        <Button varian="garis" onClick={() => ubah(NADA_BAWAAN.pitch, NADA_BAWAAN.rate)}>
          Kembalikan bawaan
        </Button>
      </div>
    </section>
  );
}