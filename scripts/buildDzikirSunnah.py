#!/usr/bin/env python3
"""Gabungkan data fitrahive/dua-dhikr (MIT) -> src/data/dzikirSunnah.json (bundled, offline).
Pakai: python3 scripts/buildDzikirSunnah.py <path-ke-repo-dua-dhikr>"""
import json, re, sys, os
src = sys.argv[1]
CATS = {  # slug -> (kunci filter app, grup tampilan id/en)
  "morning-dhikr": ("pagi", "Dzikir Pagi", "Morning Dhikr"),
  "evening-dhikr": ("petang", "Dzikir Petang", "Evening Dhikr"),
  "dhikr-after-salah": ("bakda", "Dzikir Setelah Shalat", "Dhikr After Salah"),
  "daily-dua": ("doa", "Doa Harian", "Daily Dua"),
  "selected-dua": ("doa", "Doa Pilihan", "Selected Dua"),
}
out = []
for slug, (kat, g_id, g_en) in CATS.items():
    idl = json.load(open(f"{src}/data/dua-dhikr/{slug}/id.json"))
    enl = json.load(open(f"{src}/data/dua-dhikr/{slug}/en.json"))
    assert len(idl) == len(enl), slug
    for i, (a, b) in enumerate(zip(idl, enl)):
        m = re.search(r"(\d+)\s*x", a.get("notes") or "")
        out.append({
            "id": f"dd-{slug}-{i+1}", "kat": kat, "slug": slug,
            "grup": {"id": g_id, "en": g_en},
            "judul": {"id": a["title"], "en": b["title"]},
            "arab": a["arabic"], "latin": a["latin"],
            "arti": {"id": a["translation"], "en": b["translation"]},
            "catatan": {"id": a.get("notes"), "en": b.get("notes")},
            "faedah": {"id": a.get("fawaid"), "en": b.get("fawaid")},
            "sumber": a.get("source"),
            "jumlah": int(m.group(1)) if m else 1,
        })
os.makedirs("src/data", exist_ok=True)
json.dump(out, open("src/data/dzikirSunnah.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "entri", os.path.getsize("src/data/dzikirSunnah.json") // 1024, "KB")
