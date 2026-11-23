import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { isAuthorized, isValidCode, labelPerangkat, sessionToken } from "./session";

const asal = process.env.APP_ACCESS_CODE;

afterEach(() => {
  if (asal === undefined) delete process.env.APP_ACCESS_CODE;
  else process.env.APP_ACCESS_CODE = asal;
});

function permintaanDenganCookie(nilai: string): NextRequest {
  return {
    cookies: { get: () => ({ value: nilai }) },
  } as unknown as NextRequest;
}

const TOKEN_DUMMY = "a".repeat(64);

describe("session", () => {
  it("menerima kode benar dan menolak yang salah", () => {
    process.env.APP_ACCESS_CODE = "rahasia-123";
    expect(isValidCode("rahasia-123")).toBe(true);
    expect(isValidCode("salah")).toBe(false);
    expect(isValidCode("")).toBe(false);
  });

  it("env kosong: gagal jelas, bukan menerima kode apa pun", () => {
    delete process.env.APP_ACCESS_CODE;
    expect(() => isValidCode("apa-saja")).toThrow(/APP_ACCESS_CODE|Kode akses/);
  });

  it("hanya menerima cookie berbentuk token hex 64 karakter", () => {
    expect(sessionToken(permintaanDenganCookie(TOKEN_DUMMY))).toBe(TOKEN_DUMMY);
    expect(sessionToken(permintaanDenganCookie("palsu"))).toBeNull();
    expect(sessionToken(permintaanDenganCookie(""))).toBeNull();
  });

  it("tanpa cookie: tidak diizinkan tanpa menyentuh DB", async () => {
    await expect(isAuthorized(permintaanDenganCookie(""))).resolves.toBe(false);
  });

  it("memberi label perangkat yang mudah dibaca", () => {
    expect(
      labelPerangkat(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      ),
    ).toBe("Windows · Chrome");
    expect(
      labelPerangkat("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1 Safari/604.1"),
    ).toBe("iOS · Safari");
    expect(labelPerangkat("")).toBe("Perangkat lain · peramban lain");
  });
});
