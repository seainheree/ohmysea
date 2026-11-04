"use client";

import Link from "next/link";

import { Label } from "@/components/ui/Card";
import type { Mode, Percakapan } from "@/lib/api";

export function Sidebar({
  percakapan,
  aktifId,
  mode,
  onPilih,
  onBaru,
  onGantiJudul,
  onHapus,
  terbuka,
  onTutup,
}: {
  percakapan: Percakapan[];
  aktifId: string | null;
  mode: Mode;
  onPilih: (p: Percakapan) => void;
  onBaru: () => void;
  onGantiJudul: (p: Percakapan) => void;
  onHapus: (p: Percakapan) => void;
  terbuka: boolean;
  onTutup: () => void;
}) {
  return (
    <>
      {terbuka && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onTutup}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[300px] shrink-0 flex-col border-r border-border bg-bg-sidebar transition-transform md:static md:translate-x-0 ${
          terbuka ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-border px-sedang py-sedang">
          <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-gradient-to-br from-aksen to-aksen-lembut text-white shadow-[0_0_18px_rgb(236_72_153_/_0.35)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="font-display text-2xl leading-none">
            oh<span className="text-aksen-terang">my</span>sea
          </span>
          <button
            onClick={onTutup}
            aria-label="Tutup menu"
            className="ml-auto text-teks-muted md:hidden"
          >
            ✕
          </button>
        </div>

        <div className="px-sedang py-sedang">
          <button
            onClick={onBaru}
            className="w-full rounded-penuh bg-gradient-to-r from-aksen to-aksen-terang px-sedang py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgb(236_72_153_/_0.3)]"
          >
            + Percakapan baru
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-sedang pb-sedang">
          <div className="mb-2 mt-1">
            <Label>Mode {mode === "curhat" ? "curhat" : "chat"}</Label>
          </div>
          <ul className="flex flex-col gap-1">
            {percakapan.map((p) => (
              <li key={p.id} className="group">
                <div
                  className={`flex items-center gap-2 rounded-sedang px-2 py-2 text-sm ${
                    p.id === aktifId ? "bg-border text-teks" : "text-teks-muted hover:bg-surface"
                  }`}
                >
                  <button
                    onClick={() => onPilih(p)}
                    className="flex-1 truncate text-left"
                    title={p.title}
                  >
                    {p.title}
                  </button>
                  <button
                    onClick={() => onGantiJudul(p)}
                    aria-label={`Ganti judul ${p.title}`}
                    className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onHapus(p)}
                    aria-label={`Hapus ${p.title}`}
                    className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
            {percakapan.length === 0 && (
              <li className="px-2 py-1 text-xs text-teks-muted-2">Belum ada percakapan.</li>
            )}
          </ul>
        </nav>

        <div className="border-t border-border px-sedang py-sedang text-xs">
          <Link href="/gambar" className="text-teks-muted hover:text-teks">
            Galeri gambar →
          </Link>
        </div>
      </aside>
    </>
  );
}
