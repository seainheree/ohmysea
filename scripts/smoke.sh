#!/usr/bin/env bash
# Uji cepat API ohmysea terhadap server yang sedang berjalan.
# Pakai: BASE=http://localhost:3000 APP_ACCESS_CODE=... bash scripts/smoke.sh
# Tanpa argumen: membaca .env, BASE default http://localhost:3000.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
[ -f .env ] && set -a && . ./.env && set +a

BASE="${BASE:-http://localhost:3000}"
KODE="${APP_ACCESS_CODE:-}"
# Path native Windows: curl di Mesys tidak bisa menulis ke /tmp
TMPB="$(cygpath -m "${LOCALAPPDATA:-$HOME}/Temp" 2>/dev/null || echo "$HOME")"
JAR="$TMPB/ohmysea-smoke-cookies.txt"
HEAD="$TMPB/ohmysea-smoke-head.txt"
rm -f "$JAR" "$HEAD"
GAGAL=0

cek() {
  local judul="$1" harap="$2" dapat="$3"
  if [ "$harap" = "$dapat" ]; then
    printf '  OK   %-42s (%s)\n' "$judul" "$dapat"
  else
    printf '  GAGAL %-41s harap %s, dapat %s\n' "$judul" "$harap" "$dapat"
    GAGAL=$((GAGAL + 1))
  fi
}

http() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

echo "Uji API di $BASE"
echo
echo "Gerbang akses (T-003)"
cek "GET /api/health tanpa kode" 200 "$(http "$BASE/api/health")"
cek "GET /api/conversations tanpa cookie" 401 "$(http "$BASE/api/conversations")"
cek "POST /api/unlock kode salah" 401 "$(http -X POST "$BASE/api/unlock" -H 'content-type: application/json' -d '{"code":"salah"}')"
cek "POST /api/unlock kode benar" 200 "$(http -c "$JAR" -X POST "$BASE/api/unlock" -H 'content-type: application/json' -d "{\"code\":\"$KODE\"}")"
cek "GET /api/conversations dengan cookie" 200 "$(http -b "$JAR" "$BASE/api/conversations")"
echo

echo "Chat & memori (FR-1, FR-2)"
BALASAN=$(curl -s -b "$JAR" -X POST "$BASE/api/chat" -H 'content-type: application/json' \
  -d '{"mode":"chat","message":"Ingat ya, kode uji aku SMOKE77. Jawab singkat: siap"}' -D "$HEAD")
CID=$(grep -i '^x-ohmysea-conversation:' "$HEAD" | tr -d '\r' | awk '{print $2}')
cek "POST /api/chat balas non-kosong" 1 "$([ -n "$BALASAN" ] && echo 1 || echo 0)"
LAGI=$(curl -s -b "$JAR" -X POST "$BASE/api/chat" -H 'content-type: application/json' \
  -d "{\"conversationId\":\"$CID\",\"mode\":\"chat\",\"message\":\"kode uji aku apa?\"}")
cek "memori: balasan kedua memuat SMOKE77" 1 "$(echo "$LAGI" | grep -qi 'SMOKE77' && echo 1 || echo 0)"
echo

echo "RAG (FR-3, FR-4)"
cek "GET /api/rag/query tanpa q" 400 "$(http -b "$JAR" "$BASE/api/rag/query")"
JML=$(curl -s -b "$JAR" "$BASE/api/rag/query?q=berapa%20dimensi%20vektor%20embedding" \
  | python -c "import json,sys; print(len(json.load(sys.stdin).get('potongan',[])))" 2>/dev/null || echo 0)
cek "retrieval mengembalikan >= 1 potongan" 1 "$([ "${JML:-0}" -ge 1 ] && echo 1 || echo 0)"
echo

echo "Gambar (FR-6, FR-7)"
cek "GET /api/images" 200 "$(http -b "$JAR" "$BASE/api/images")"
GAMBAR=$(curl -s -b "$JAR" -X POST "$BASE/api/images" \
  --form-string 'prompt=lingkaran pink sederhana di latar gelap' --form-string 'style=3d' \
  --form-string 'model=@cf/black-forest-labs/flux-2-klein-4b' --form-string 'aspectRatio=1:1')
URLIMG=$(echo "$GAMBAR" | python -c "import json,sys; d=json.load(sys.stdin); print((d.get('gambar') or {}).get('url',''))" 2>/dev/null)
cek "POST /api/images menghasilkan URL" 1 "$([ -n "$URLIMG" ] && echo 1 || echo 0)"
if [ -n "$URLIMG" ]; then
  cek "URL gambar bisa diakses" 200 "$(http "$URLIMG")"
elif [ -n "$GAMBAR" ]; then
  echo "  info: respons gambar -> $(echo "$GAMBAR" | head -c 200)"
fi
echo

rm -f "$JAR" "$HEAD"
if [ "$GAGAL" -eq 0 ]; then
  echo "SEMUA UJI LULUS"
else
  echo "ADA $GAGAL UJI GAGAL"
  exit 1
fi
