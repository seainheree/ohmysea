import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

import { getEnv } from "@/lib/env";

let provider: ReturnType<typeof createGroq> | null = null;

function getProvider() {
  if (provider) return provider;
  const env = getEnv();
  provider = createGroq({ apiKey: env.GROQ_API_KEY });
  return provider;
}

/** Model untuk mode chat. */
export function chatModel(): LanguageModel {
  return getProvider().languageModel(getEnv().GROQ_MODEL_CHAT);
}

/** Model untuk mode curhat (bisa dibedakan lewat env kalau perlu). */
export function curhatModel(): LanguageModel {
  return getProvider().languageModel(getEnv().GROQ_MODEL_CURHAT);
}

/**
 * Model murah untuk menyaring memori otomatis — pekerjaannya kecil (ubah satu
 * pertukaran pesan jadi daftar fakta), jadi tidak perlu model besar.
 */
export function memoriModel(): LanguageModel {
  return getProvider().languageModel(getEnv().GROQ_MODEL_MEMORI);
}

export const HISTORY_LIMIT = 20;
