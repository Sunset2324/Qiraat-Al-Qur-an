#!/usr/bin/env node
/**
 * Validasi src/data/quranMedis.json sebelum rilis.
 *
 * Cek:
 *  - surah_nomor 1..114 dan ayat_nomor 1..jumlahAyat surah itu (jumlahAyat diambil dari API)
 *  - tema tidak kosong, 'no' tidak ganda dalam satu kategori
 *  - jumlah_tema tiap kategori dan metadata.total_tema sesuai isi sebenarnya
 *
 * Pakai:  node scripts/validateQuranMedis.js [path/ke/quranMedis.json]
 * Perlu Node 18+ dan internet (mengambil daftar surah dari backend).
 */
const fs = require("fs");
const path = require("path");

function validate(data, jumlahAyat) {
  const errors = [];
  const warnings = [];
  let total = 0;

  if (!data || typeof data !== "object" || !data.kategori) {
    return { errors: ["Struktur JSON tidak valid: properti 'kategori' tidak ada."], warnings, total };
  }

  for (const [key, kat] of Object.entries(data.kategori)) {
    const daftar = Array.isArray(kat.tema) ? kat.tema : [];
    total += daftar.length;

    if (kat.jumlah_tema !== undefined && kat.jumlah_tema !== daftar.length) {
      errors.push(`[${key}] jumlah_tema=${kat.jumlah_tema} tapi isi tema=${daftar.length}`);
    }

    const noDipakai = new Set();
    daftar.forEach((t, i) => {
      const lokasi = `[${key}] #${t.no ?? "?"} (index ${i})`;
      if (!t.tema || !String(t.tema).trim()) errors.push(`${lokasi}: judul tema kosong`);
      if (noDipakai.has(t.no)) errors.push(`${lokasi}: nomor ganda dalam kategori`);
      noDipakai.add(t.no);

      const s = t.surah_nomor;
      const a = t.ayat_nomor;
      if (!Number.isInteger(s) || s < 1 || s > 114) {
        errors.push(`${lokasi}: surah_nomor tidak valid (${s})`);
        return;
      }
      const maks = jumlahAyat[s];
      if (!Number.isInteger(a) || a < 1) {
        errors.push(`${lokasi}: ayat_nomor tidak valid (${a})`);
      } else if (maks && a > maks) {
        errors.push(`${lokasi}: QS ${s}:${a} melebihi jumlah ayat surah (${maks}) - "${t.tema}"`);
      }
      if (t.halaman !== undefined && !Number.isFinite(t.halaman)) {
        warnings.push(`${lokasi}: halaman bukan angka (${t.halaman})`);
      }
    });
  }

  if (data.metadata && data.metadata.total_tema !== undefined && data.metadata.total_tema !== total) {
    errors.push(`metadata.total_tema=${data.metadata.total_tema} tapi total tema sebenarnya=${total}`);
  }
  return { errors, warnings, total };
}

async function ambilJumlahAyat() {
  const config = fs.readFileSync(path.join(__dirname, "..", "src", "config.ts"), "utf8");
  const m = /export const API_BASE_URL\s*=\s*["'`]([^"'`]+)["'`]/.exec(config);
  if (!m) throw new Error("API_BASE_URL tidak ditemukan di src/config.ts");
  const res = await fetch(`${m[1]}/surat`);
  if (!res.ok) throw new Error(`Gagal mengambil daftar surah: HTTP ${res.status}`);
  const json = await res.json();
  const map = {};
  json.data.forEach((s) => (map[s.nomor] = s.jumlahAyat));
  if (Object.keys(map).length !== 114) {
    throw new Error(`Daftar surah dari API berisi ${Object.keys(map).length} surah, seharusnya 114.`);
  }
  return map;
}

async function main() {
  const file = process.argv[2] || path.join(__dirname, "..", "src", "data", "quranMedis.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const jumlahAyat = await ambilJumlahAyat();
  const { errors, warnings, total } = validate(data, jumlahAyat);

  console.log(`File: ${file}`);
  console.log(`Total tema: ${total}`);
  warnings.forEach((w) => console.warn("  PERINGATAN:", w));
  if (errors.length) {
    console.error(`\n${errors.length} masalah ditemukan:`);
    errors.forEach((e) => console.error("  -", e));
    process.exit(1);
  }
  console.log("Semua referensi valid.");
}

if (require.main === module) {
  main().catch((e) => {
    console.error("Gagal menjalankan validasi:", e.message);
    process.exit(2);
  });
}

module.exports = { validate };