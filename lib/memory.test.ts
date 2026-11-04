import { describe, expect, it } from "vitest";

import { buildMemoryBlock } from "./memory";

describe("buildMemoryBlock", () => {
  it("tanpa memori menghasilkan string kosong", () => {
    expect(buildMemoryBlock([])).toBe("");
  });

  it("membentuk daftar berbutir dengan pengantar yang jelas", () => {
    const hasil = buildMemoryBlock(["namaku Sasha", "suka jawaban singkat"]);
    expect(hasil).toContain("Yang kamu ingat tentang pengguna");
    expect(hasil).toContain("- namaku Sasha");
    expect(hasil).toContain("- suka jawaban singkat");
  });

  it("melarang model mengarang di luar daftar", () => {
    const hasil = buildMemoryBlock(["aku kerja sebagai desainer"]);
    expect(hasil.toLowerCase()).toContain("jangan mengarang");
  });
});
