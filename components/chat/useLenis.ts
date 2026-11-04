"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Gulir halus (Lenis) untuk satu wadah yang punya scroll sendiri.
 * Terima elemennya langsung (bukan ref) supaya hook jalan ulang begitu DOM-nya
 * benar-benar ada — halaman chat baru dirender setelah layar kunci dibuka.
 * Dimatikan otomatis kalau pengguna memilih "kurangi gerakan".
 */
export function useLenis(wrapper: HTMLElement | null, content: HTMLElement | null) {
  useEffect(() => {
    if (!wrapper || !content) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      wrapper,
      content,
      duration: 0.9,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      autoRaf: true,
    });

    return () => lenis.destroy();
  }, [wrapper, content]);
}
