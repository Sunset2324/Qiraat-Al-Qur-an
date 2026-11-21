import axios from 'axios';
import { API_BASE_URL } from '../config';
import { cachedRequest, DAY, HOUR } from '../utils/apiCache';
import { installGuard } from '../security/guard';

// Satu instance axios dengan timeout, supaya app tidak menggantung kalau
// server (Vercel cold start) atau jaringan lambat.
const http = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });
installGuard(http); // blokir panggilan saat VPN/proxy aktif

// Ubah pesan error teknis jadi pesan yang bisa langsung ditampilkan ke pengguna.
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Server terlalu lama merespons. Coba lagi sebentar lagi.';
      } else if (!error.response) {
        error.message = 'Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.';
      } else {
        const msg = (error.response.data as any)?.message;
        if (msg) error.message = msg;
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 1. Ambil daftar Mushaf/Qiraat dari Backend (sumber: Quranpedia)
 * Endpoint: GET /mushafs
 */
export const getMushafList = async () => {
  try {
    return await cachedRequest(
      'mushafs-v2', // v2: sekarang menyertakan rawi
      async () => (await http.get('/mushafs')).data.data,
      { ttlMs: 7 * DAY }
    );
  } catch (error) {
    console.error('Error fetching mushaf list:', error);
    throw error;
  }
};

/**
 * 2. Ambil daftar semua surah dari Backend
 * Endpoint: GET /surat
 */
export const getDaftarSurah = async () => {
  try {
    return await cachedRequest(
      'surat-list',
      async () => {
        const response = await http.get('/surat');
        const surahList = response.data.data;
        return surahList.map((item: any) => ({
          nomor: item.nomor,
          namaLatin: item.namaLatin,
          namaArab: item.nama,
          arti: item.arti,
          jumlahAyat: item.jumlahAyat,
          tempatTurun: item.tempatTurun || 'Mekah',
        }));
      },
      { ttlMs: 30 * DAY } // daftar 114 surah praktis tidak pernah berubah
    );
  } catch (error) {
    console.error('Error fetching surah list:', error);
    throw error;
  }
};

/**
 * 3. Ambil detail surat beserta ayat-ayatnya dari Backend (Default Hafs)
 * Endpoint: GET /surat/:nomor?qari=05
 */
export const getDetailSurah = async (nomor: number, qariId: string = '05') => {
  try {
    const response = await http.get(`/surat/${nomor}?qari=${qariId}`);
    const backendData = response.data.data;
    
    // Backend mengembalikan struktur: { info: {...}, audioFull: "...", ayat: [...] }
    const info = backendData.info || backendData; 
    
    return {
      info: {
        nomor: info.nomor,
        nama: info.nama,
        namaLatin: info.namaLatin,
        arti: info.arti,
        jumlahAyat: info.jumlahAyat,
        tempatTurun: info.tempatTurun || 'Mekah',
        mushafAktif: 'HAFS'
      },
      audioFull: backendData.audioFull,
      ayat: (backendData.ayat || []).map((ayat: any) => ({
        nomor: ayat.nomor,
        teksArab: ayat.teksArab,
        teksLatin: ayat.teksLatin,
        teksIndonesia: ayat.teksIndonesia || ayat.artiIndonesia,
        audio: ayat.audio,
      })),
    };
  } catch (error) {
    console.error(`Error fetching surah ${nomor}:`, error);
    throw error;
  }
};

/**
 * 4. Ambil Detail Surah MERGED: Teks Arab dari Quranpedia + Terjemahan/Tafsir dari EQuran.id
 * Endpoint: GET /surat-merged/:nomor?mushafId=...&qariId=...
 */
export const getDetailSurahMerged = async (
  nomor: number,
  mushafId: string,
  qariId: string = '05',
  reciterId?: number
) => {
  try {
    // reciterId (opsional) = qari dari katalog Quranpedia. Kalau kosong, pakai qariId (EQuran.id).
    const reciterParam = reciterId ? `&reciterId=${reciterId}` : '';
    return await cachedRequest(
      `merged:${nomor}:${mushafId}:${qariId}:${reciterId ?? ''}`,
      async () =>
        (
          await http.get(
            `/surat-merged/${nomor}?mushafId=${mushafId}&qariId=${qariId}${reciterParam}`
          )
        ).data.data,
      { ttlMs: 7 * DAY, group: 'surah', maxEntries: 20 }
    );
  } catch (error) {
    console.error(`Error fetching merged surah ${nomor}:`, error);
    throw error;
  }
};

/** Qari dari katalog Quranpedia (versi ringan dari backend) */
export interface Reciter {
  id: number;
  reciter: string;          // nama qari (Arab)
  name: string;
  rawi: string | null;      // mis. "حفص"
  recitationType: string | null; // mis. "مرتل"
  perAyah: boolean;         // true = bisa dipakai untuk "Ikuti Bacaan" (audio per ayat)
  hasAyah?: boolean;        // punya audio per ayat
  hasFull?: boolean;        // punya audio surah penuh
  surahCount: number;
}

/**
 * Ambil daftar qari lengkap dari Backend (sumber: Quranpedia)
 * Endpoint: GET /reciters
 *  - rawi  (opsional) : filter rawi, mis. "حفص"
 *  - surah (opsional) : hanya qari yang punya audio untuk surah ini (1-114)
 */
export const getReciters = async (
  rawi?: string | null,
  surah?: number | null
): Promise<Reciter[]> => {
  try {
    const params: Record<string, string | number> = {};
    if (rawi) params.rawi = rawi;
    if (surah) params.surah = surah;
    return await cachedRequest<Reciter[]>(
      `reciters-v2:${rawi ?? ''}:${surah ?? ''}`,
      async () => (await http.get('/reciters', { params })).data.data,
      { ttlMs: DAY, group: 'reciters', maxEntries: 40 }
    );
  } catch (error) {
    console.error('Error fetching reciters:', error);
    throw error;
  }
};

/**
 * 5. Ambil daftar doa dan dzikir dari Backend
 * Endpoint: GET /doa (dengan opsional query ?grup=... atau ?tag=...)
 */
export const getDaftarDoa = async (grup?: string, tag?: string) => {
  try {
    let url = '/doa';
    const params = new URLSearchParams();
    
    if (grup) params.append('grup', grup);
    if (tag) params.append('tag', tag);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return await cachedRequest(
      `doa:${grup ?? ''}:${tag ?? ''}`,
      async () => (await http.get(url)).data.data,
      { ttlMs: 7 * DAY }
    );
  } catch (error) {
    console.error('Error fetching doa list:', error);
    throw error;
  }
};

/**
 * 6. Ambil detail doa spesifik berdasarkan ID
 * Endpoint: GET /doa/:id
 */
export const getDetailDoa = async (id: number) => {
  try {
    return await cachedRequest(
      `doa-detail:${id}`,
      async () => (await http.get(`/doa/${id}`)).data.data,
      { ttlMs: 7 * DAY, group: 'doa-detail', maxEntries: 60 }
    );
  } catch (error) {
    console.error(`Error fetching doa detail for ID ${id}:`, error);
    throw error;
  }
};

/**
 * 7. Ambil Jadwal Shalat dari Backend
 * Endpoint: POST /shalat
 */
export const getJadwalShalat = async (provinsi: string, kabkota: string, bulan: number, tahun: number) => {
  try {
    return await cachedRequest(
      `shalat:${provinsi}:${kabkota}:${bulan}:${tahun}`,
      async () =>
        (await http.post('/shalat', { provinsi, kabkota, bulan, tahun })).data.data,
      { ttlMs: 6 * HOUR, group: 'shalat', maxEntries: 6 }
    );
  } catch (error) {
    console.error('Error fetching jadwal shalat:', error);
    throw error;
  }
};

/**
 * Daftar provinsi untuk jadwal shalat
 * Endpoint: GET /shalat/provinsi
 */
export const getProvinsiShalat = async (): Promise<string[]> =>
  cachedRequest<string[]>(
    'shalat-provinsi',
    async () => (await http.get('/shalat/provinsi')).data.data,
    { ttlMs: 30 * DAY }
  );

/**
 * Daftar kab/kota dalam satu provinsi
 * Endpoint: POST /shalat/kabkota
 */
export const getKabKotaShalat = async (provinsi: string): Promise<string[]> =>
  cachedRequest<string[]>(
    `shalat-kabkota:${provinsi}`,
    async () => (await http.post('/shalat/kabkota', { provinsi })).data.data,
    { ttlMs: 30 * DAY, group: 'shalat-kabkota', maxEntries: 40 }
  );

/** Satu ayat versi ringan (tanpa audio) untuk ditampilkan sebagai kutipan. */
export interface AyatTeks {
  nomor: number;
  teksArab: string;
  teksLatin?: string;
  teksIndonesia?: string;
}

/** Teks satu surah versi ringan, aman disimpan di cache. */
export interface SurahTeks {
  nomor: number;
  namaLatin: string;
  namaArab: string;
  arti?: string;
  jumlahAyat: number;
  ayat: AyatTeks[];
}

/**
 * Ambil teks (Arab + latin + terjemahan) satu surah dari backend (sumber: EQuran.id),
 * tanpa data audio supaya ringan. Di-cache 90 hari: satu fetch per surah sudah
 * mencakup semua tema yang merujuk ke surah itu.
 * Endpoint: GET /surat/:nomor
 */
export const getTeksSurah = async (nomor: number): Promise<SurahTeks> => {
  try {
    return await cachedRequest<SurahTeks>(
      `teks:${nomor}`,
      async () => {
        const response = await http.get(`/surat/${nomor}?qari=05`);
        const data = response.data.data;
        const info = data.info || data;
        return {
          nomor: info.nomor ?? nomor,
          namaLatin: info.namaLatin,
          namaArab: info.nama,
          arti: info.arti,
          jumlahAyat: info.jumlahAyat,
          ayat: (data.ayat || []).map((a: any) => ({
            nomor: a.nomor,
            teksArab: a.teksArab,
            teksLatin: a.teksLatin,
            teksIndonesia: a.teksIndonesia || a.artiIndonesia,
          })),
        };
      },
      { ttlMs: 90 * DAY, group: 'teks', maxEntries: 40 }
    );
  } catch (error) {
    console.error(`Error fetching teks surah ${nomor}:`, error);
    throw error;
  }
};

/** Ringkasan halaman sebuah mushaf (qiraat): jumlah halaman + juz + surah pertama tiap halaman. */
export interface MushafPagesSummary {
  mushafId: string;
  totalPages: number;
  pages: { page: number; juz: number | null; surah: number; ayah: number }[];
}

export const getMushafPages = async (mushafId: string): Promise<MushafPagesSummary> => {
  try {
    return await cachedRequest<MushafPagesSummary>(
      `pages-summary:${mushafId}`,
      async () => (await http.get(`/mushafs/${mushafId}/pages`, { timeout: 60000 })).data.data,
      { ttlMs: 30 * DAY }
    );
  } catch (error) {
    console.error('Error fetching mushaf pages:', error);
    throw error;
  }
};

/** Isi satu halaman mushaf: ayat dikelompokkan per surah. */
export interface MushafPageData {
  mushafId: string;
  page: number;
  totalPages: number;
  juz: number | null;
  bismillah: string | null;
  segments: {
    surah: { nomor: number; nama: string; namaLatin: string; arti: string; tempatTurun: string; jumlahAyat: number };
    startsSurah: boolean;
    endsSurah: boolean;
    ayat: { nomor: number; teksArab: string; teksLatin: string; teksIndonesia: string }[];
  }[];
}

export const getMushafPage = async (mushafId: string, page: number): Promise<MushafPageData> => {
  try {
    return await cachedRequest<MushafPageData>(
      `page:${mushafId}:${page}`,
      async () => (await http.get(`/mushafs/${mushafId}/pages/${page}`, { timeout: 60000 })).data.data,
      { ttlMs: 30 * DAY, group: 'pages', maxEntries: 40 }
    );
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
    throw error;
  }
};
