"use client";

import { useEffect, useState } from "react";

/**
 * Sakelar memori otomatis (Kirby menyimpan fakta penting sendiri).
 * Nilainya disimpan di perangkat ini dan dikirim bersama setiap pesan.
 */
export function MemoryAutoToggle() {
  const [nyala, setNyala] = useState(true);

  useEffect(() => {
    try {
      setNyala(localStorage.getItem("ohmysea-memori-otomatis") !== "mati");
    } catch {
      // localStorage bisa diblokir; biarkan bawaan (menyala)
    }
  }, []);

  function ganti(nilai: boolean) {
    setNyala(nilai);
    try {
      localStorage.setItem("ohmysea-memori-otomatis", nilai ? "nyala" : "mati");
    } catch {
      // abaikan
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-sedang border border-border bg-bg-main p-sedang">
      <label className="flex items-center justify-between gap-sedang">
        <span className="text-sm font-medium">Simpan memori otomatis</span>
        <input
          type="checkbox"
          checked={nyala}
          onChange={(e) => ganti(e.target.checked)}
          className="h-5 w-5 accent-aksen"
          aria-label="Simpan memori otomatis"
        />
      </label>
      <p className="text-xs text-teks-muted">
        Kalau menyala, Kirby menyimpan sendiri fakta penting dari percakapan (nama,
        panggilan, kesukaan, kebiasaan, tujuan). Yang tidak disimpan: sapaan,
        pertanyaan, keluhan sesaat, hal teknis soal aplikasi, dan data sensitif
        seperti kata sandi atau nomor kartu. Semua yang tersimpan muncul di daftar
        atas dan bisa kamu matikan atau hapus kapan saja.
      </p>
    </div>
  );
}
