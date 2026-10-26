#!/usr/bin/env bash
# Cetak pin SHA-256 (SPKI, base64) untuk SETIAP sertifikat di rantai TLS server.
# Pakai: bash scripts/get-pins.sh api.alqiraat.app
# Salin 2+ nilai ke security.config.json -> "pins". Saran: pin sertifikat intermediate/CA (bukan leaf),
# karena leaf berganti tiap perpanjangan; tambahkan satu pin cadangan (mis. root atau intermediate lain).
# Aman dipakai di Git Bash (Windows), Linux, dan macOS: tanpa awk dan tanpa folder temp di luar proyek.
set -uo pipefail
HOST="${1:-api.alqiraat.app}"
DIR=".pins-tmp"
rm -rf "$DIR"; mkdir -p "$DIR"
trap 'rm -rf "$DIR"' EXIT

openssl s_client -connect "$HOST:443" -servername "$HOST" -showcerts </dev/null 2>/dev/null \
  | tr -d '\r' > "$DIR/raw.txt"

n=0; inside=0
while IFS= read -r line; do
  case "$line" in
    *"-----BEGIN CERTIFICATE-----"*) n=$((n+1)); inside=1; : > "$DIR/c$n.pem" ;;
  esac
  if [ "$inside" = 1 ]; then printf '%s\n' "$line" >> "$DIR/c$n.pem"; fi
  case "$line" in
    *"-----END CERTIFICATE-----"*) inside=0 ;;
  esac
done < "$DIR/raw.txt"

if [ "$n" -eq 0 ]; then
  echo "Tidak ada sertifikat terbaca dari $HOST:443 (cek koneksi/DNS)."; exit 1
fi

for i in $(seq 1 "$n"); do
  f="$DIR/c$i.pem"
  subj="$(openssl x509 -in "$f" -noout -subject 2>/dev/null | sed 's/^subject= *//')"
  pin="$(openssl x509 -in "$f" -noout -pubkey 2>/dev/null | openssl pkey -pubin -outform der 2>/dev/null | openssl dgst -sha256 -binary | openssl enc -base64)"
  echo "[$i] ${subj:-?}"
  echo "    $pin"
done
echo
echo "Rantai: [1]=leaf (berganti tiap perpanjangan), [2]=intermediate, [3]=root (bila ada)."
