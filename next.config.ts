import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route handler API memakai driver `postgres` (butuh TCP) + Supabase Storage,
  // jadi tidak boleh dijalankan di Edge runtime.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
