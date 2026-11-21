#!/usr/bin/env bash
# Cek pin SHA-256 (SPKI) tiap sertifikat di rantai TLS server.
# Pakai:  bash cek-pin.sh                       (default api.alqiraat.app:443)
#         bash cek-pin.sh host:port
HP="${1:-api.alqiraat.app:443}"
HOST="${HP%%:*}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

openssl s_client -connect "$HP" -servername "$HOST" -showcerts </dev/null 2>/dev/null \
  | awk -v d="$TMP" '/BEGIN CERTIFICATE/{n++} n{print > (d "/c" n ".pem")}'

if ! ls "$TMP"/c*.pem >/dev/null 2>&1; then
  echo "GAGAL: tidak ada sertifikat diterima dari $HP (cek koneksi / nama host)."
  exit 1
fi

for f in $(ls "$TMP"/c*.pem | sort -V); do
  echo "== $(basename "$f")"
  openssl x509 -in "$f" -noout -subject -issuer
  printf 'pin: '
  openssl x509 -in "$f" -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl base64
done
echo
echo "Pin di security.config.json yang cocok ditandai di bawah:"
for p in "sCkq5UWXjg+7mKu9lMhhYF5bGLsy7VI/UNW3tccdR7w=" "diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI="; do
  found=NO
  for f in "$TMP"/c*.pem; do
    x=$(openssl x509 -in "$f" -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl base64)
    [ "$x" = "$p" ] && found="YA ($(basename "$f"))"
  done
  echo "  $p -> $found"
done