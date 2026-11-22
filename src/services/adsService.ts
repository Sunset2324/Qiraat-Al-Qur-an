import axios from "axios";
import { API_BASE_URL } from "../config";
import { cachedRequest, MINUTE } from "../utils/apiCache";
import { assertSensitiveAllowed, installGuard, GuardBlockedError } from "../security/guard";

export interface Iklan {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  tema: string; // judul tema Thibbun Nabawi
  surah: number;
  ayat: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  productUrl: string;
  /** ISO; setelah waktu ini iklan tidak ditampilkan (server juga menyaring). */
  expiresAt?: string | null;
}

const http = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
installGuard(http);

/** Hanya https yang boleh dibuka/ditampilkan, apa pun isi respons server. */
const httpsOnly = (u: unknown) => typeof u === "string" && /^https:\/\//i.test(u);

const belumKedaluwarsa = (a: Iklan) => !a.expiresAt || Date.parse(a.expiresAt) > Date.now();

const tunggu = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Gangguan sementara (offline, timeout, 5xx, 429) layak dicoba lagi; 4xx lain dan blokir keamanan tidak. */
const bisaDiulang = (e: any): boolean => {
  if (e instanceof GuardBlockedError) return false;
  const st = e?.response?.status;
  if (st === undefined) return true; // tanpa respons: jaringan putus / timeout
  return st >= 500 || st === 429 || st === 408;
};

/** Ambil dari server dengan maksimal 3 percobaan (jeda 0,8 dtk lalu 2 dtk) untuk gangguan sementara. */
async function ambilDariServer(): Promise<Iklan[]> {
  let lastErr: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      await assertSensitiveAllowed(); // iklan dimatikan di mode terbatas (tidak diulang)
      const res = await http.get("/ads");
      const list: Iklan[] = Array.isArray(res.data?.data) ? res.data.data : [];
      return list.filter(
        (a) => a && a.id && a.title && a.surah > 0 && a.ayat > 0 && httpsOnly(a.imageUrl) && httpsOnly(a.productUrl)
      );
    } catch (e) {
      lastErr = e;
      if (!bisaDiulang(e) || i === 2) break;
      await tunggu(i === 0 ? 800 : 2000);
    }
  }
  throw lastErr;
}

/**
 * Daftar iklan aktif Jurnal Kesehatan. Cache 30 menit; kalau server gagal, pakai cache lama
 * supaya layar tidak kosong. Hasil kosong TIDAK ditahan di cache (iklan baru langsung terlihat).
 * Error blokir keamanan (GuardBlockedError) diteruskan apa adanya agar layar bisa menjelaskan sebabnya.
 * Endpoint: GET /ads
 */
export const getIklan = async (force = false): Promise<Iklan[]> => {
  const key = "iklan:list";
  // Disaring lagi di sini: cache lokal/offline bisa memuat iklan yang sudah lewat masa tayangnya.
  if (force) return (await ambilDariServer()).filter(belumKedaluwarsa);
  try {
    let dariServer = false;
    const hasil = (
      await cachedRequest<Iklan[]>(
        key,
        async () => {
          const l = await ambilDariServer();
          dariServer = true;
          return l;
        },
        { ttlMs: 30 * MINUTE, group: "iklan", maxEntries: 1 }
      )
    ).filter(belumKedaluwarsa);
    if (hasil.length > 0 || dariServer) return hasil;
    // data berasal dari cache dan kosong/semua kedaluwarsa: periksa server langsung supaya iklan baru tidak tertunda
    return (await ambilDariServer()).filter(belumKedaluwarsa);
  } catch (e) {
    if (e instanceof GuardBlockedError) throw e;
    throw new Error("ads_unavailable");
  }
};
