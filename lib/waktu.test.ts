import { describe, expect, it } from "vitest";

import { waktuRelatif } from "./waktu";

const sekarang = new Date("2026-11-23T12:00:00Z");

describe("waktuRelatif", () => {
  it("menampilkan satuan yang sesuai", () => {
    expect(waktuRelatif("2026-11-23T11:59:40Z", sekarang)).toBe("baru saja");
    expect(waktuRelatif("2026-11-23T11:55:00Z", sekarang)).toBe("5 mnt");
    expect(waktuRelatif("2026-11-23T09:00:00Z", sekarang)).toBe("3 jm");
    expect(waktuRelatif("2026-11-21T12:00:00Z", sekarang)).toBe("2 hr");
  });

  it("jatuh ke tanggal setelah sepekan", () => {
    expect(waktuRelatif("2026-11-10T12:00:00Z", sekarang)).toMatch(/10/);
  });

  it("mengembalikan string kosong untuk tanggal tak valid", () => {
    expect(waktuRelatif("bukan-tanggal", sekarang)).toBe("");
  });
});