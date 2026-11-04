"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { buka } from "@/lib/api";

export function LockScreen({ onBuka }: { onBuka: () => void }) {
  const [kode, setKode] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setError(null);
    try {
      await buka(kode.trim());
      onBuka();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuka");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col items-center justify-center gap-besar px-sedang">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/image/logo-256.png"
          alt="Logo ohmysea"
          width={72}
          height={72}
          className="mx-auto mb-sedang h-[72px] w-[72px] rounded-[20px]"
        />
        <h1 className="font-display text-5xl leading-none">
          oh<span className="text-aksen-terang">my</span>sea
        </h1>
        <p className="mt-2 text-sm text-teks-muted">
          Masukkan kode akses untuk membuka. Hanya kamu yang punya kode ini.
        </p>
      </div>

      <form onSubmit={kirim} className="flex w-full flex-col gap-sedang">
        <input
          type="password"
          value={kode}
          onChange={(e) => setKode(e.target.value)}
          placeholder="Kode akses"
          autoFocus
          className="w-full rounded-sedang border border-border bg-surface px-sedang py-3 text-sm outline-none focus:border-aksen"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={sibuk || kode.trim().length === 0}>
          {sibuk ? "Memeriksa..." : "Buka"}
        </Button>
      </form>
    </main>
  );
}
