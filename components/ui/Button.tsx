"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Varian = "utama" | "halus" | "garis" | "bahaya";

const gaya: Record<Varian, string> = {
  utama:
    "bg-aksen text-white hover:bg-aksen-terang shadow-[0_0_18px_rgb(236_72_153_/_0.25)] disabled:opacity-50",
  halus: "bg-surface text-teks hover:bg-border",
  garis: "border border-border-kuat text-teks-muted hover:text-teks hover:border-aksen",
  bahaya: "border border-border-kuat text-danger hover:border-danger",
};

export function Button({
  varian = "utama",
  children,
  className = "",
  ...sisa
}: ButtonHTMLAttributes<HTMLButtonElement> & { varian?: Varian; children: ReactNode }) {
  return (
    <button
      {...sisa}
      className={`inline-flex items-center justify-center gap-2 rounded-penuh px-sedang py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${gaya[varian]} ${className}`}
    >
      {children}
    </button>
  );
}
