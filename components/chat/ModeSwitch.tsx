"use client";

import type { Mode } from "@/lib/api";

const URUTAN: { nilai: Mode; label: string; ket: string }[] = [
  { nilai: "chat", label: "Chat", ket: "Ngobrol biasa, memori tersimpan, bisa memakai dokumenmu" },
  { nilai: "curhat", label: "Curhat", ket: "Bercerita tanpa dihakimi — tanpa dokumen" },
];

export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Pilih mode">
      {URUTAN.map((m) => (
        <button
          key={m.nilai}
          role="tab"
          aria-selected={mode === m.nilai}
          title={m.ket}
          onClick={() => onChange(m.nilai)}
          className={`rounded-penuh px-sedang py-2 min-h-[40px] text-sm transition-colors ${
            mode === m.nilai
              ? "bg-aksen/15 text-aksen-lembut border border-aksen"
              : "border border-border-kuat text-teks-muted hover:text-teks"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
