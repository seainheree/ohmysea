import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { isAuthorized, isValidCode, sessionValue } from "./session";

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

describe("session", () => {
  it("menerima kode benar dan menolak yang salah", () => {
    process.env.APP_ACCESS_CODE = "rahasia-123";
    expect(isValidCode("rahasia-123")).toBe(true);
    expect(isValidCode("salah")).toBe(false);
  });

  it("nilai cookie HMAC stabil dan berbentuk hex 64 karakter", () => {
    process.env.APP_ACCESS_CODE = "rahasia-123";
    const nilai = sessionValue();
    expect(nilai).toMatch(/^[0-9a-f]{64}$/);
    expect(sessionValue()).toBe(nilai);
  });

  it("cookie sah lolos; cookie asal-asalan ditolak", () => {
    process.env.APP_ACCESS_CODE = "rahasia-123";
    expect(isAuthorized(permintaanDenganCookie(sessionValue()))).toBe(true);
    expect(isAuthorized(permintaanDenganCookie("palsu"))).toBe(false);
  });

  it("env kosong: gagal jelas dan tidak mengizinkan siapa pun", () => {
    delete process.env.APP_ACCESS_CODE;
    expect(() => sessionValue()).toThrow(/APP_ACCESS_CODE|Kode akses/);
    expect(isAuthorized(permintaanDenganCookie("apa-saja"))).toBe(false);
  });
});