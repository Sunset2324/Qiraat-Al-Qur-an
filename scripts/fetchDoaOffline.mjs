// Mengunduh SELURUH data Doa & Dzikir dari equran.id lalu menyimpannya ke src/data/doaEquran.json,
// supaya data ikut dibundel di dalam app (offline penuh, tanpa jaringan saat dipakai).
//
// Jalankan SEKALI dari root project (butuh Node 18+ dan internet):
//    node scripts/fetchDoaOffline.mjs
// Lalu commit src/data/doaEquran.json dan buat build baru. Ulangi hanya kalau ingin memperbarui data.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.DOA_BASE || "https://equran.id/api/doa"; // DOA_BASE hanya untuk uji lokal
const OUT = process.env.DOA_OUT || resolve(dirname(fileURLToPath(import.meta.url)), "../src/data/doaEquran.json");

async function getJson(url, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      last = e;
      await new Promise((ok) => setTimeout(ok, 700 * (i + 1)));
    }
  }
  throw new Error(`${url}: ${last?.message || last}`);
}

const str = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

const list = await getJson(BASE);
if (list.status !== "success" || !Array.isArray(list.data) || list.data.length === 0) {
  console.error("Respons daftar doa tidak seperti yang diharapkan:", JSON.stringify(list).slice(0, 300));
  process.exit(1);
}
console.log(`Daftar: ${list.data.length} doa. Mengambil detail tiap doa...`);

const items = [];
let done = 0;
const queue = [...list.data];
async function worker() {
  while (queue.length) {
    const it = queue.shift();
    let d = it;
    try {
      const det = await getJson(`${BASE}/${it.id}`);
      if (det.status === "success" && det.data) d = { ...it, ...det.data };
    } catch (e) {
      console.warn(`  ! detail ${it.id} gagal (${e.message}); pakai data daftar saja`);
    }
    items.push({
      id: Number(d.id),
      judul: str(d.nama),
      doa: str(d.ar),
      latin: str(d.tr),
      arti: str(d.idn),
      grup: str(d.grup),
      tags: Array.isArray(d.tag) ? d.tag.map(str).filter(Boolean) : [],
      ...(str(d.tentang) ? { tentang: str(d.tentang) } : {}),
    });
    if (++done % 25 === 0) console.log(`  ${done}/${list.data.length}`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));

items.sort((a, b) => a.id - b.id);
const bad = items.filter((x) => !x.id || !x.judul || !x.doa);
if (bad.length) console.warn(`Peringatan: ${bad.length} item tanpa id/judul/teks Arab:`, bad.slice(0, 5).map((x) => x.id));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(items));
console.log(`Selesai: ${items.length} doa disimpan ke ${OUT} (${Math.round(JSON.stringify(items).length / 1024)} KB).`);
const sunnah = items.filter((x) => /istikh?a+r|dhuha|duha/i.test(`${x.judul} ${x.grup} ${x.tags.join(" ")}`));
console.log("Item istikharah/dhuha yang ditemukan:", sunnah.map((x) => `${x.id}:${x.judul}`));
