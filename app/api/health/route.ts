import { NextResponse } from "next/server";

import { pingDb } from "@/lib/db/client";
import { envReport } from "@/lib/env";

export const runtime = "nodejs";

/** Rute publik: hanya melaporkan status, tanpa membocorkan nilai env. */
export async function GET() {
  const env = envReport();
  const db = env.ok ? await pingDb() : { ok: false, detail: "env belum lengkap" };

  return NextResponse.json(
    {
      ok: env.ok && db.ok,
      env: { ok: env.ok, hilang: env.hilang },
      db,
      model: env.model,
    },
    { status: env.ok && db.ok ? 200 : 503 },
  );
}
