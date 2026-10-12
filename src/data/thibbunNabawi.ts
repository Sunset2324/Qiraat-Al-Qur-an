// Data tema "Al-Qur'an dan Kesehatan" yang dikurasi lokal (offline).
// File sumber: src/data/quranMedis.json (hasil parse_quran_medis.py).
// Teks ayat TIDAK disimpan di sini; hanya referensi surah:ayat. Teksnya
// diambil dari API dan di-cache (lihat getTeksSurah di quranService.ts).
import raw from "./quranMedis.json";

interface RawTema {
  no: number;
  tema: string;
  halaman?: number;
  surah_nomor: number;
  ayat_nomor: number;
}
interface RawKategori {
  id: string;
  nama_lengkap: string;
  deskripsi?: string;
  jumlah_tema?: number;
  tema: RawTema[];
}
interface RawData {
  metadata?: { judul_buku?: string; total_tema?: number };
  kategori: Record<string, RawKategori>;
}

export interface KategoriMedis {
  id: string; // mis. "RUHANI"
  nama: string; // mis. "I. RUHANI"
  deskripsi: string;
  jumlah: number;
}

export interface TemaMedis {
  id: string; // unik, dipakai sebagai parameter route
  kategoriId: string;
  kategoriNama: string;
  no: number;
  tema: string;
  halaman?: number;
  surah: number;
  ayat: number;
}

const data = raw as unknown as RawData;

export const JUDUL_BUKU = data.metadata?.judul_buku ?? "Al-Qur'an dan Kesehatan";

export const KATEGORI_LIST: KategoriMedis[] = [];
export const TEMA_LIST: TemaMedis[] = [];

const dipakai = new Set<string>();
Object.values(data.kategori).forEach((k) => {
  KATEGORI_LIST.push({
    id: k.id,
    nama: k.nama_lengkap,
    deskripsi: k.deskripsi ?? "",
    jumlah: k.tema.length,
  });
  k.tema.forEach((t, i) => {
    let id = `${k.id}-${t.no}`;
    if (dipakai.has(id)) id = `${id}-${i}`; // jaga-jaga kalau ada nomor ganda
    dipakai.add(id);
    TEMA_LIST.push({
      id,
      kategoriId: k.id,
      kategoriNama: k.nama_lengkap,
      no: t.no,
      tema: t.tema,
      halaman: t.halaman,
      surah: t.surah_nomor,
      ayat: t.ayat_nomor,
    });
  });
});

const BY_ID = new Map(TEMA_LIST.map((t) => [t.id, t]));
export const getTemaById = (id: string) => BY_ID.get(id);

/**
 * Cari tema. `q` bisa berupa kata di judul tema, atau referensi "surah:ayat" (mis. "2:255").
 * `kategoriId` null = semua kategori.
 */
export const cariTema = (q: string, kategoriId: string | null): TemaMedis[] => {
  const kata = q.trim().toLowerCase();
  const ref = /^(\d{1,3})\s*[:.]\s*(\d{1,3})$/.exec(kata);
  return TEMA_LIST.filter((t) => {
    if (kategoriId && t.kategoriId !== kategoriId) return false;
    if (!kata) return true;
    if (ref) return t.surah === Number(ref[1]) && t.ayat === Number(ref[2]);
    return t.tema.toLowerCase().includes(kata);
  });
};