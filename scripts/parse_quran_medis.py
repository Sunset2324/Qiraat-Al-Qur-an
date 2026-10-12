#!/usr/bin/env python3
"""
Konversi data-source/quran_medis.docx -> src/data/quranMedis.json

Pakai (dari folder mana pun):
    python scripts/parse_quran_medis.py
    python scripts/parse_quran_medis.py "path/ke/file.docx" "path/keluaran.json"
    python scripts/parse_quran_medis.py --boleh-sebagian   # tidak gagal walau jumlah belum 602

Laporan baris yang tidak terbaca ditulis ke data-source/parse_report.txt
(folder itu di-.gitignore).
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

ROOT = Path(__file__).resolve().parent.parent
SUMBER_DEFAULT = ROOT / "data-source" / "quran_medis.docx"
KELUARAN_DEFAULT = ROOT / "src" / "data" / "quranMedis.json"
LAPORAN = ROOT / "data-source" / "parse_report.txt"

# Jumlah tema menurut buku. Dipakai untuk mendeteksi tema yang terlewat saat parsing.
TARGET = {"I_RUHANI": 243, "II_RAGAWI": 179, "III_HIKMAH_IBADAH": 84, "IV_ALA_NABI": 96}

SURAH_MAPPING = {
    "Al-Fatihah": 1, "Al-Baqarah": 2, "Ali 'Imran": 3, "An-Nisa'": 4, "Al-Ma'idah": 5,
    "Al-An'am": 6, "Al-A'raf": 7, "Al-Anfal": 8, "At-Taubah": 9, "Yunus": 10,
    "Hud": 11, "Yusuf": 12, "Ar-Ra'd": 13, "Ibrahim": 14, "Al-Hijr": 15,
    "An-Nahl": 16, "Al-Isra'": 17, "Al-Kahf": 18, "Maryam": 19, "Taha": 20,
    "Al-Anbiya'": 21, "Al-Hajj": 22, "Al-Mu'minun": 23, "An-Nur": 24, "Al-Furqan": 25,
    "Asy-Syu'ara'": 26, "An-Naml": 27, "Al-Qasas": 28, "Al-'Ankabut": 29, "Ar-Rum": 30,
    "Luqman": 31, "As-Sajdah": 32, "Al-Ahzab": 33, "Saba'": 34, "Fatir": 35,
    "Yasin": 36, "As-Saffat": 37, "Sad": 38, "Az-Zumar": 39, "Gafir": 40,
    "Fussilat": 41, "Asy-Syura": 42, "Az-Zukhruf": 43, "Ad-Dukhan": 44, "Al-Jasiyah": 45,
    "Al-Ahqaf": 46, "Muhammad": 47, "Al-Fath": 48, "Al-Hujurat": 49, "Qaf": 50,
    "Az-Zariyat": 51, "At-Tur": 52, "An-Najm": 53, "Al-Qamar": 54, "Ar-Rahman": 55,
    "Al-Waqi'ah": 56, "Al-Hadid": 57, "Al-Mujadalah": 58, "Al-Hasyr": 59, "Al-Mumtahanah": 60,
    "As-Saff": 61, "Al-Jumu'ah": 62, "Al-Munafiqun": 63, "At-Tagabun": 64, "At-Talaq": 65,
    "At-Tahrim": 66, "Al-Mulk": 67, "Al-Qalam": 68, "Al-Haqqah": 69, "Al-Ma'arij": 70,
    "Nuh": 71, "Al-Jinn": 72, "Al-Muzzammil": 73, "Al-Muddassir": 74, "Al-Qiyamah": 75,
    "Al-Insan": 76, "Al-Mursalat": 77, "An-Naba'": 78, "An-Nazi'at": 79, "'Abasa": 80,
    "At-Takwir": 81, "Al-Infitar": 82, "Al-Mutaffifin": 83, "Al-Insyiqaq": 84, "Al-Buruj": 85,
    "At-Tariq": 86, "Al-A'la": 87, "Al-Ghasyiyah": 88, "Al-Fajr": 89, "Al-Balad": 90,
    "Asy-Syams": 91, "Al-Lail": 92, "Ad-Duha": 93, "Asy-Syarh": 94, "At-Tin": 95,
    "Al-'Alaq": 96, "Al-Qadr": 97, "Al-Bayyinah": 98, "Az-Zalzalah": 99, "Al-'Adiyat": 100,
    "Al-Qari'ah": 101, "At-Takasur": 102, "Al-'Asr": 103, "Al-Humazah": 104, "Al-Fil": 105,
    "Quraisy": 106, "Al-Ma'un": 107, "Al-Kausar": 108, "Al-Kafirun": 109, "An-Nasr": 110,
    "Al-Lahab": 111, "Al-Ikhlas": 112, "Al-Falaq": 113, "An-Nas": 114,
}

# Ejaan alternatif yang umum (dibandingkan setelah dinormalisasi, lihat norm_key)
ALIAS = {
    "Al-Fatiha": 1, "Al-Baqara": 2, "Ali Imran": 3, "At-Tawbah": 9, "Al-Bara'ah": 9,
    "Al-Kahfi": 18, "Taha": 20, "Al-Mu'min": 40, "Ghafir": 40, "As-Syura": 42,
    "Al-Jatsiyah": 45, "Al-Waqiah": 56, "Al-Hasyr": 59, "At-Taghabun": 64,
    "Al-Muddatsir": 74, "Al-Ikhlash": 112, "Al-Quraisy": 106, "Quraish": 106,
}

# Kesalahan OCR/ketik yang sudah kamu temukan (dicocokkan sebagai potongan teks mentah)
TYPO_FIXES = {
    "Ai-Maidah": "Al-Ma'idah", "Al-Miidah": "Al-Ma'idah", "AlMaidah": "Al-Ma'idah",
    "Al-Arat": "Al-A'raf", "Al-AYaf": "Al-A'raf", "Al-Atat": "Al-A'raf",
    "Al-Arr'am": "Al-An'am", "Al-Anilm": "Al-An'am", "Ai-Anilm": "Al-An'am",
    "Al-Araf": "Al-A'raf", "Al-Kalf": "Al-Kahf", "Ai-Yaht": "Al-Kahf",
    "Al-Anbrya": "Al-Anbiya'", "AD-ahf": "Al-Kahf", "Al￥": "Al-Isra'",
    "Alinfitar": "Al-Infitar", "Al-Gasyiyah": "Al-Ghasyiyah", "Al-Asr": "Al-'Asr",
    "Abasa": "'Abasa", "N4107": "An-Nisa'", "pnisg": "An-Nisa'",
    "6Ns": "An-Nisa'", "f6t6s8": "An-Nisa'", "6-Nis8": "An-Nisa'",
}

KATEGORI = [
    (r"^\s*I\s*\.?\s*RUHANI\b", "I_RUHANI", "I. RUHANI",
     "Tema seputar kesehatan jiwa, hati, akhlak, dan spiritual"),
    (r"^\s*II\s*\.?\s*RAGAWI\b", "II_RAGAWI", "II. RAGAWI",
     "Tema seputar kesehatan fisik, makanan, minuman, dan tubuh"),
    (r"^\s*III\s*\.?\s*HIKMAH\s*IBADAH\b", "III_HIKMAH_IBADAH", "III. HIKMAH IBADAH",
     "Tema seputar hikmah ibadah, salat, zakat, dan hubungan dengan Allah"),
    (r"^\s*IV\s*\.?\s*ALA\s*NABI\b", "IV_ALA_NABI", "IV. ALA NABI",
     "Tema seputar sunah dan kebiasaan Rasulullah ﷺ"),
]

HEADER_LABELS = {"NO", "NO.", "NOMOR", "TEMA", "JUDUL", "HAL", "HAL.", "HALAMAN",
                 "SURAH", "RUJUKAN", "AYAT", "SURAH/AYAT", "SURAH, AYAT", "SURAT"}

# Karakter "pintar" dari Word -> ASCII
CHAR_FIX = str.maketrans({
    "’": "'", "‘": "'", "`": "'", "ʻ": "'", "ʼ": "'", "´": "'",
    "，": ",", "：": ":", "‑": "-", "–": "-", "—": "-",
    " ": " ",
})


def norm_key(s):
    """Normalisasi nama surah: huruf kecil, buang apostrof/tanda hubung/spasi."""
    s = unicodedata.normalize("NFKD", s.translate(CHAR_FIX)).lower()
    return re.sub(r"[^a-z0-9]", "", s)


NAMA_KE_NOMOR = {norm_key(k): v for k, v in SURAH_MAPPING.items()}
NAMA_KE_NOMOR.update({norm_key(k): v for k, v in ALIAS.items()})


def cari_surah(nama):
    if not nama:
        return None
    teks = nama.translate(CHAR_FIX).strip()
    for typo, benar in TYPO_FIXES.items():
        if typo in teks:
            teks = teks.replace(typo, benar)
    teks = re.sub(r"^(QS|Q\.S|Surah|Surat)\.?\s+", "", teks, flags=re.IGNORECASE)
    return NAMA_KE_NOMOR.get(norm_key(teks))


# "Al-Baqarah, 2:2" / "Al-Baqarah 2:2" / "QS. Al-Baqarah: 2: 2" / "Ali 'Imran, 3.112" / "…, 2:2-5"
RUJUKAN_RE = re.compile(
    r"(?:QS\.?\s*)?([A-Za-z][A-Za-z'\-\s]*?)\s*[,;:]?\s*\(?\s*(\d{1,3})\s*[:.]\s*(\d{1,3})(?:\s*-\s*\d{1,3})?\s*\)?"
)


def parse_rujukan(cell):
    """Kembalikan (nama_surah, ayat, seberapa_cocok) atau None."""
    teks = cell.translate(CHAR_FIX).strip()
    m = RUJUKAN_RE.search(teks)
    if not m:
        return None
    cakupan = (m.end() - m.start()) / max(len(teks), 1)
    return m.group(1).strip(), int(m.group(3)), cakupan


def deteksi_kategori(teks):
    teks = teks.strip()
    if not teks or len(teks) > 80:
        return None
    for pola, key, nama, desk in KATEGORI:
        if re.search(pola, teks, re.IGNORECASE):
            return key
    return None


def blok_berurutan(doc):
    """Paragraf dan tabel sesuai urutan di dokumen (penting untuk tahu kategori mana)."""
    for anak in doc.element.body.iterchildren():
        if anak.tag.endswith("}p"):
            yield Paragraph(anak, doc)
        elif anak.tag.endswith("}tbl"):
            yield Table(anak, doc)


def sel_unik(row):
    """Teks tiap sel, tanpa duplikat akibat sel yang digabung (merged)."""
    terlihat, hasil = set(), []
    for c in row.cells:
        if id(c._tc) in terlihat:
            continue
        terlihat.add(id(c._tc))
        hasil.append(c.text.strip())
    return hasil


def parse_baris(cells):
    """Kembalikan (data|None, alasan_gagal|None, jenis) untuk satu baris tabel."""
    isi = [c for c in cells if c]
    if not isi:
        return None, None, "kosong"

    angka = [c for c in isi if re.fullmatch(r"\d+", c)]
    bukan_angka = [c for c in isi if c not in angka]

    # Rujukan = sel yang hampir seluruhnya berisi pola "Nama, a:b"
    rujukan_cell, rujukan = None, None
    for c in bukan_angka:
        r = parse_rujukan(c)
        if r and r[2] >= 0.6 and (rujukan is None or r[2] > rujukan[2]):
            rujukan_cell, rujukan = c, r

    # Header tabel: ada label seperti NO/TEMA/HAL dan tidak ada rujukan
    if rujukan is None and any(c.upper() in HEADER_LABELS for c in isi):
        return None, None, "header"

    sisa = [c for c in bukan_angka if c != rujukan_cell and len(c) > 3]
    tema = max(sisa, key=len) if sisa else None
    no = int(angka[0]) if angka else None
    halaman = int(angka[1]) if len(angka) > 1 else None

    if rujukan is None:
        return None, "rujukan tidak terbaca", "data"
    if not tema:
        return None, "judul tema kosong", "data"
    nama, ayat, _ = rujukan
    surah = cari_surah(nama)
    if not surah:
        return None, f"nama surah tidak dikenali: '{nama}'", "data"
    return {"no": no, "tema": tema, "halaman": halaman,
            "surah_nomor": surah, "ayat_nomor": ayat}, None, "data"


def parse_docx(path):
    doc = Document(str(path))
    kategori = {
        key: {"id": key, "nama_lengkap": nama, "deskripsi": desk, "jumlah_tema": 0, "tema": []}
        for _, key, nama, desk in KATEGORI
    }
    aktif = None
    gagal = []  # (lokasi, alasan, isi)

    for blok in blok_berurutan(doc):
        if isinstance(blok, Paragraph):
            key = deteksi_kategori(blok.text)
            if key:
                aktif = key
            continue

        for i, row in enumerate(blok.rows):
            cells = sel_unik(row)
            baris_teks = " ".join(c for c in cells if c)

            # baris judul kategori di dalam tabel
            key = deteksi_kategori(baris_teks)
            if key and parse_rujukan(baris_teks) is None:
                aktif = key
                continue

            data, alasan, jenis = parse_baris(cells)
            if jenis in ("kosong", "header"):
                continue
            if data is None:
                gagal.append((aktif or "?", alasan, baris_teks[:120]))
                continue
            if aktif is None:
                gagal.append(("?", "kategori belum terdeteksi", baris_teks[:120]))
                continue
            kategori[aktif]["tema"].append(data)

    for k in kategori.values():
        k["jumlah_tema"] = len(k["tema"])
    total = sum(k["jumlah_tema"] for k in kategori.values())

    hasil = {
        "metadata": {
            "judul_buku": "Al-Qur'an dan Kesehatan",
            "total_kategori": len(kategori),
            "total_tema": total,
            "sumber_api": "https://equran.id/api/v2",
        },
        "kategori": kategori,
    }
    return hasil, gagal


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    boleh_sebagian = "--boleh-sebagian" in sys.argv
    sumber = Path(args[0]) if len(args) > 0 else SUMBER_DEFAULT
    keluaran = Path(args[1]) if len(args) > 1 else KELUARAN_DEFAULT

    if not sumber.exists():
        # coba nama dengan spasi di folder yang sama (mis. "quran medis.docx")
        alt = sumber.with_name(sumber.stem.replace("_", " ") + sumber.suffix)
        if alt.exists():
            sumber = alt
        else:
            print(f"❌ File sumber tidak ditemukan: {sumber}")
            sys.exit(2)

    data, gagal = parse_docx(sumber)

    keluaran.parent.mkdir(parents=True, exist_ok=True)
    keluaran.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Sumber  : {sumber}")
    print(f"Keluaran: {keluaran}")
    print("✅ Hasil parsing per kategori (terbaca / target buku):")
    kurang = False
    for key, kat in data["kategori"].items():
        t = TARGET.get(key)
        tanda = "" if t == kat["jumlah_tema"] else "  <-- tidak sama"
        kurang = kurang or bool(tanda)
        print(f"  • {kat['nama_lengkap']}: {kat['jumlah_tema']} / {t}{tanda}")
    print(f"  TOTAL: {data['metadata']['total_tema']} / {sum(TARGET.values())}")

    LAPORAN.parent.mkdir(parents=True, exist_ok=True)
    with LAPORAN.open("w", encoding="utf-8") as f:
        f.write(f"{len(gagal)} baris tidak terbaca\n\n")
        for kat, alasan, isi in gagal:
            f.write(f"[{kat}] {alasan}\n    {isi}\n")
    if gagal:
        print(f"⚠️  {len(gagal)} baris tidak terbaca, lihat {LAPORAN}")

    if kurang and not boleh_sebagian:
        print("❌ Jumlah belum sesuai target buku. Periksa laporan di atas, atau pakai --boleh-sebagian.")
        sys.exit(1)


if __name__ == "__main__":
    main()