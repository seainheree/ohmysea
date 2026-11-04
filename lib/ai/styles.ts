/** Gaya, aspect ratio, dan daftar model gambar. Satu sumber — dipakai API dan UI. */

export type GayaGambar = { slug: string; label: string; potonganPrompt: string };

export const STYLES: GayaGambar[] = [
  { slug: "anime", label: "Anime", potonganPrompt: "anime style, cel shaded, vibrant colors, clean lineart" },
  { slug: "foto", label: "Foto", potonganPrompt: "photorealistic, 50mm lens, natural lighting, sharp detail" },
  { slug: "3d", label: "3D render", potonganPrompt: "3d render, soft studio lighting, octane render, smooth shading" },
  { slug: "sketsa", label: "Sketsa", potonganPrompt: "pencil sketch, monochrome, hand drawn, cross hatching" },
  { slug: "watercolor", label: "Watercolor", potonganPrompt: "watercolor painting, soft washes, paper texture" },
  { slug: "cyberpunk", label: "Cyberpunk", potonganPrompt: "cyberpunk, neon lights, night, rain, cinematic" },
];

export type RasioGambar = { label: string; width: number; height: number };

/** Ukuran yang sudah diuji diterima model (1344x768 terbukti keluar 1344x768). */
export const RATIOS = {
  "1:1": { label: "1:1 (persegi)", width: 1024, height: 1024 },
  "16:9": { label: "16:9 (lebar)", width: 1344, height: 768 },
  "9:16": { label: "9:16 (tegak)", width: 768, height: 1344 },
  "4:3": { label: "4:3", width: 1152, height: 896 },
  "3:4": { label: "3:4", width: 896, height: 1152 },
} as const satisfies Record<string, RasioGambar>;

export type RasioKey = keyof typeof RATIOS;

export type ModelGambar = {
  id: string;
  label: string;
  dukungGambarReferensi: boolean;
  /** Mengikuti width/height dari aspect ratio? flux-1-schnell selalu 1024x1024. */
  dukungDimensi: boolean;
};

export const IMAGE_MODELS: ModelGambar[] = [
  {
    id: "@cf/black-forest-labs/flux-2-klein-4b",
    label: "FLUX.2 klein 4B — cepat, dukung gambar referensi",
    dukungGambarReferensi: true,
    dukungDimensi: true,
  },
  {
    id: "@cf/black-forest-labs/flux-2-klein-9b",
    label: "FLUX.2 klein 9B — kualitas lebih tinggi",
    dukungGambarReferensi: true,
    dukungDimensi: true,
  },
  {
    id: "@cf/black-forest-labs/flux-1-schnell",
    label: "FLUX.1 schnell — paling cepat, tanpa gambar referensi, ukuran tetap 1024×1024",
    dukungGambarReferensi: false,
    dukungDimensi: false,
  },
];

export const DEFAULT_MODEL = IMAGE_MODELS[0]!.id;
export const DEFAULT_RATIO: RasioKey = "1:1";

export function gayaDari(slug: string): GayaGambar {
  const g = STYLES.find((s) => s.slug === slug);
  if (!g) throw new Error(`Gaya tidak dikenal: ${slug}. Pilihan: ${STYLES.map((s) => s.slug).join(", ")}`);
  return g;
}

export function ukuranDari(ratio: string): RasioGambar {
  const r = (RATIOS as Record<string, RasioGambar>)[ratio];
  if (!r) {
    throw new Error(`Aspect ratio tidak dikenal: ${ratio}. Pilihan: ${Object.keys(RATIOS).join(", ")}`);
  }
  return r;
}

export function dukungGambarReferensi(modelId: string): boolean {
  return IMAGE_MODELS.find((m) => m.id === modelId)?.dukungGambarReferensi ?? false;
}

/** Model yang menghormati width/height dari aspect ratio. */
export function dukungDimensi(modelId: string): boolean {
  return IMAGE_MODELS.find((m) => m.id === modelId)?.dukungDimensi ?? false;
}

/** Gabungkan prompt pengguna dengan potongan gaya. */
export function susunPrompt(prompt: string, styleSlug: string): string {
  const gaya = gayaDari(styleSlug);
  return `${prompt.trim()}, ${gaya.potonganPrompt}`;
}

export const MAKS_PANJANG_PROMPT = 2000;
export const MAKS_UKURAN_REFERENSI_MB = 4;
