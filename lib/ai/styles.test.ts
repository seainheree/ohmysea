import { describe, expect, it } from "vitest";

import {
  DEFAULT_MODEL,
  IMAGE_MODELS,
  RATIOS,
  STYLES,
  dukungDimensi,
  dukungGambarReferensi,
  gayaDari,
  susunPrompt,
  ukuranDari,
} from "./styles";

describe("pemetaan aspect ratio", () => {
  it("semua ratio punya dimensi positif dan kelipatan 8", () => {
    for (const [k, v] of Object.entries(RATIOS)) {
      expect(v.width, k).toBeGreaterThan(0);
      expect(v.height, k).toBeGreaterThan(0);
      expect(v.width % 8, k).toBe(0);
      expect(v.height % 8, k).toBe(0);
    }
  });

  it("16:9 benar-benar lebar dan 9:16 benar-benar tegak", () => {
    expect(ukuranDari("16:9").width).toBeGreaterThan(ukuranDari("16:9").height);
    expect(ukuranDari("9:16").height).toBeGreaterThan(ukuranDari("9:16").width);
  });

  it("ratio tak dikenal melempar error dengan daftar pilihan", () => {
    expect(() => ukuranDari("21:9")).toThrow(/Pilihan/);
  });
});

describe("pemetaan style", () => {
  it("setiap style punya potongan prompt", () => {
    for (const s of STYLES) {
      expect(s.potonganPrompt.length).toBeGreaterThan(5);
    }
  });

  it("susunPrompt menempelkan gaya di belakang prompt pengguna", () => {
    const hasil = susunPrompt("kucing oren", "anime");
    expect(hasil.startsWith("kucing oren, ")).toBe(true);
    expect(hasil).toContain(gayaDari("anime").potonganPrompt);
  });

  it("style tak dikenal melempar error", () => {
    expect(() => susunPrompt("x", "tidak-ada")).toThrow(/Gaya tidak dikenal/);
  });
});

describe("dukungan gambar referensi per model", () => {
  it("model default mendukung image-to-image", () => {
    expect(dukungGambarReferensi(DEFAULT_MODEL)).toBe(true);
  });

  it("flux-1-schnell tidak mendukung image-to-image", () => {
    expect(dukungGambarReferensi("@cf/black-forest-labs/flux-1-schnell")).toBe(false);
  });

  it("model tak dikenal dianggap tidak mendukung", () => {
    expect(dukungGambarReferensi("@cf/tidak/ada")).toBe(false);
  });

  it("hanya klein yang menghormati aspect ratio", () => {
    expect(dukungDimensi("@cf/black-forest-labs/flux-2-klein-4b")).toBe(true);
    expect(dukungDimensi("@cf/black-forest-labs/flux-2-klein-9b")).toBe(true);
    expect(dukungDimensi("@cf/black-forest-labs/flux-1-schnell")).toBe(false);
  });

  it("semua model di daftar punya id dan label", () => {
    for (const m of IMAGE_MODELS) {
      expect(m.id).toContain("@cf/");
      expect(m.label.length).toBeGreaterThan(3);
    }
  });
});
