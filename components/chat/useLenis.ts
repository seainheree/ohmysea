"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Gulir halus (Lenis) untuk satu wadah yang punya scroll sendiri, sekaligus
 * menyambungkannya ke GSAP ScrollTrigger supaya animasi berbasis gulir ikut
 * halus (ticker GSAP yang menjalankan rAF Lenis, bukan rAF ganda).
 *
 * Terima elemennya langsung (bukan ref) supaya hook jalan ulang begitu DOM-nya
 * benar-benar ada — halaman chat baru dirender setelah layar kunci dibuka.
 * Gulir halus selalu aktif (tanpa cabang `prefers-reduced-motion`).
 */
export function useLenis(wrapper: HTMLElement | null, content: HTMLElement | null) {
  useEffect(() => {
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      duration: 0.9,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      autoRaf: false,
    });

    let lepas = () => {};
    let dibatalkan = false;

    // GSAP diimpor dinamis: tidak ikut bundel awal halaman chat.
    void (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (dibatalkan) return;

      gsap.registerPlugin(ScrollTrigger);

      const padaGulir = () => ScrollTrigger.update();
      lenis.on("scroll", padaGulir);
      const padaTick = (waktu: number) => lenis.raf(waktu * 1000);
      gsap.ticker.add(padaTick);
      gsap.ticker.lagSmoothing(0);

      lepas = () => {
        lenis.off("scroll", padaGulir);
        gsap.ticker.remove(padaTick);
      };
    })();

    return () => {
      dibatalkan = true;
      lepas();
      lenis.destroy();
    };
  }, [wrapper, content]);
}
